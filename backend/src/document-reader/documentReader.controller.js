/**
 * Document Reader — Controller
 * POST /api/document-reader/extract
 * Recibe imagen, la envía al proveedor de IA configurado para OCR inteligente,
 * retorna campos con confidence scoring.
 *
 * Configuración via env vars:
 *   VISION_PROVIDER   = groq | openai | custom  (default: groq)
 *   VISION_BASE_URL   = URL base del API (default: https://api.groq.com/openai/v1)
 *   VISION_API_KEY     = API key del proveedor (fallback: GROQ_API_KEY)
 *   VISION_MODEL       = modelo a usar (default: llama-3.2-90b-vision-preview)
 */
const fs = require("fs");
const axios = require("axios");
const { renameWithExtension } = require("../utils/upload");

/* ── Configuración dinámica ── */
function getVisionConfig() {
  const provider = (process.env.VISION_PROVIDER || "groq").toLowerCase();

  let baseUrl = process.env.VISION_BASE_URL || "";
  let apiKey = process.env.VISION_API_KEY || "";
  let model = process.env.VISION_MODEL || "";

  // Defaults por provider
  if (!baseUrl) {
    if (provider === "groq") baseUrl = "https://api.groq.com/openai/v1";
    else if (provider === "openai") baseUrl = "https://api.openai.com/v1";
    else baseUrl = "https://api.groq.com/openai/v1";
  }

  if (!apiKey) {
    apiKey = process.env.GROQ_API_KEY || "";
  }

  if (!model) {
    if (provider === "groq") model = "llama-3.2-90b-vision-preview";
    else if (provider === "openai") model = "gpt-4o";
    else model = process.env.GROQ_VISION_MODEL || "llama-3.2-90b-vision-preview";
  }

  return { provider, baseUrl: baseUrl.replace(/\/+$/, ""), apiKey, model };
}

const EXTRACTION_PROMPT = `Eres un sistema OCR inteligente especializado en documentos de identidad (cédulas colombianas, pasaportes internacionales, cédulas de extranjería).

Analiza la imagen del documento y extrae los siguientes campos si son visibles:
- tipoDocumento: "Cédula" si es documento colombiano, "Pasaporte" si es pasaporte extranjero
- numeroDocumento: número del documento
- nacionalidad: país de nacionalidad
- fechaNacimiento: en formato YYYY-MM-DD
- ciudadResidencia: ciudad de residencia si aparece
- ciudadProcedencia: ciudad de procedencia si aparece
- ciudadDestino: ciudad de destino si aparece
- direccion: dirección si aparece

REGLAS DE CONFIANZA:
- Si el campo es claramente legible, confidence = 0.90-0.99
- Si el campo es parcialmente legible, confidence = 0.70-0.89
- Si no puedes leer el campo con certeza, NO lo incluyas

REGLAS DE TIPO DE DOCUMENTO:
- Si detectas "REPÚBLICA DE COLOMBIA" o "CÉDULA DE CIUDADANÍA", tipoDocumento = "Cédula"
- Si detectas "PASSPORT" o sellos/formatos de pasaporte, tipoDocumento = "Pasaporte"
- Si el documento es de otro país (no Colombia), tipoDocumento = "Pasaporte"

VALIDACIÓN DE IMAGEN:
Si la imagen tiene problemas, responde con:
{ "ok": false, "reason": "CODIGO_PROBLEMA" }

Códigos válidos:
- IMAGE_TOO_BLURRY: imagen borrosa
- LOW_RESOLUTION: resolución muy baja
- DOCUMENT_CROPPED: documento cortado
- GLARE_DETECTED: reflejos
- TOO_DARK: muy oscura
- IMAGE_ROTATED: rotada o inclinada
- NOT_A_DOCUMENT: no parece un documento de identidad

Si la imagen es legible, responde con:
{
  "ok": true,
  "fields": {
    "campo": { "value": "valor", "confidence": 0.95 }
  }
}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional.`;

/**
 * POST /api/document-reader/extract
 */
async function extractDocument(req, res) {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ ok: false, reason: "NO_FILE" });
    }

    const config = getVisionConfig();

    if (!config.apiKey) {
      console.error("❌ No hay API key configurada para document-reader (VISION_API_KEY o GROQ_API_KEY)");
      return res.status(500).json({ ok: false, reason: "SERVICE_UNAVAILABLE" });
    }

    // Leer archivo y convertir a base64
    const filePath = file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString("base64");
    const mimeType = file.mimetype || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    // Renombrar archivo con extensión correcta
    await renameWithExtension(file).catch(() => {});

    console.log(`📄 document-reader: usando provider=${config.provider}, model=${config.model}`);

    // Llamar al API de visión
    const apiResp = await axios.post(
      `${config.baseUrl}/chat/completions`,
      {
        model: config.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              {
                type: "image_url",
                image_url: { url: dataUri },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const content = apiResp.data?.choices?.[0]?.message?.content || "{}";

    console.log("📄 document-reader raw content:", content);

    let parsed;
    try {
      parsed = safeParseJson(content);
    } catch {
      console.error("❌ document-reader: respuesta no es JSON válido:", content);
      return res.json({ ok: false, reason: "PARSE_ERROR" });
    }

    return res.json(parsed);
  } catch (err) {
    console.error("❌ document-reader error:", err?.response?.status, err?.response?.data || err.message);

    if (err?.response?.status === 400 || err?.response?.status === 401 || err?.response?.status === 403) {
      return res.status(500).json({ ok: false, reason: "SERVICE_UNAVAILABLE" });
    }

    if (err?.response?.status === 429) {
      return res.status(429).json({ ok: false, reason: "RATE_LIMITED" });
    }

    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}

function safeParseJson(content) {
  if (!content) return {};

  try {
    return JSON.parse(content);
  } catch {
    const match = String(content).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON");
    return JSON.parse(match[0]);
  }
}

module.exports = { extractDocument };
