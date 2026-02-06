import React, { useMemo, useState } from "react";
import { useCheckinForm } from "./CheckinForm.hook";
import { GuestCard } from "./CheckinForm.guest";
import { ResultModal, GuestsTodayModal } from "./CheckinForm.modal";
import { styles } from "./CheckinForm.styles";

export default function CheckinForm() {
  const {
    formList,
    reserva,
    loading,
    showModal,
    modalMessage,
    showModalHoy,
    huespedesHoy,
    cargarHuespedesHoy,
    cerrarModalHoy,
    setShowModal,
    handleChange,
    handleFileChange,
    handleAddGuest,
    removeGuestByIndex,
    handleSubmit,
  } = useCheckinForm();

  // ✅ Titular = primer huésped
  const titular = formList?.[0];

  // ✅ NUEVO: aceptación de términos
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsError, setTermsError] = useState("");

  const TERMS_TEXT = useMemo(
    () => `
GENERAL

OBJETO
Informar los términos y condiciones de la reserva de habitación que se adquiere con Kuyay Hostel una reserva que realiza un cliente y no forma parte de un grupo o una negociación de más de 09 habitaciones y/o camas individuales se denomina individual.

APLICACIÓN
Términos y condiciones aplicables para el cliente que ha adquirido una reserva individual de alojamiento en Kuyay Hostel

TERMINOS Y CONDICIONES PARA RESERVAS INDIVIDUALES

1.1. Policy for entering the hostel (Check-In) and leaving the hostel (Check-Out)
Su reserva inicia a las 2:00 p. m.( 14 Horas ) del día de llegada y finaliza a las 12:00 p. m. ( 12:00 horas ) del día de salida.
Hora máxima de cheking hasta 10:00 pm si vas a llegar después de las 10:00 pm debes informarnos para ayudarte con tu acomodación

1.2. Tarjeta de registro de alojamiento TAR (Register Card)
i. Los prestadores de servicios de alojamiento turístico deberán llevar el registro de los huéspedes a través del diligenciamiento de la tarjeta de registro de alojamiento en el sistema que, para todos los efectos, dispone el gobierno nacional de la republica de Colombia.
ii. La tarjeta de registro alojamiento es prueba del contrato de hospedaje.

1.3. Política de Ingreso antes de las 02:00 p.m - Early Check In
i. Sujeto a disponibilidad.
ii. Para los ingresos previos a las 8:00 a.m. se cobra la totalidad de la noche.
iii. Ingreso entre 8:00 a.m. y 2:00 p.m. se cobrará 1/4 parte de la tarifa vigente por la tarifa adquirida en su estadía.

1.4. Política de Salida temprana o previo a su fecha de salida reservada - Early Departure
i. Para estos efectos el huesped debe Informar con un día de anticipación previo a la nueva fecha de salida su early departure, a fin que el hostel disponga de la habitación para su venta.
ii. En caso de no brindar dicha información el huesped sera sujeto del cobro de la(s) noches subsiguientes hasta su fecha de salida reservada.

1.5. Política Salida tardia o posterior a las 12:00 p.m. - Late Check Out
i. Sujeto a disponibilidad.
ii. Late check out hasta las 16 horas (4:00 p.m.) sin cobro. Sujeto a disponibilidad
iii. Late check out entre las 17 horas (4:00 p.m.) y las 22 horas (7:00 p.m.) se cobrará la tarifa completa adquirida por el huésped en su reserva.

2. Política de Cancelación y Modificación
i. Usted podrá cancelar o modificar su(s) reserva(s) sin penalidad si lo hace antes de las 24 horas (3:00 p. m.) del día anterior de su fecha de llegada; en caso de no hacer uso de su reserva y no haberla cancelado o modificado dentro del tiempo establecido, le será cobrada una penalidad por el valor de la primera noche de alojamiento más impuestos y servicios adicionales reservados. No aplica para tarifas no reembolsables.
ii. Las reservas no garantizadas serán canceladas 72 horas antes de la fecha de llegada

3.Política de Registro de Menores de Edad
Si viaja con su(s) hijo(s) menor(es) de 18 años de edad, debe presentar el documento de identificación del(los) menor(es) de edad (registro civil), que demuestre dicha relación de parentesco. Si el(los) menor(es) de edad no viaja(n) en compañía de sus padres, usted deberá entregar en la recepción, adicionalmente al documento de identificación del menor (registro civil), el permiso de los padres, el cual deberá estar autenticado por un Notario y acompañado de la copia del documento de identificación de quienes dieron la autorización. Sin esta documentación no se permite el ingreso de los menores de edad al hostel. Lo anterior segun lo dispuesto en la Ley 679 de 2001 Estatuto para Prevenir la Explotación Sexual de Niños, Niñas y Adolescentes y sus normas concordantes.

4.Política Anticorrupción y Antifraude
No se permitir conductas o prácticas deshonestas que atenten contra la integridad empresarial , como por ejemplo: ofrecer o aceptar regalos, invitaciones, u otro tipo de incentivos que puedan recompensar o influir para que tome o se abstenga de tomar alguna medida comercial o legal, o cuando intencionalmente oculta, altera, falsifica u omite información en beneficio propio o en beneficio de otros, o la incursión en eventuales conflictos de interés que pudieran anteponer prioridades personales a las colectivas; promoviendo una cultura de ética, transparencia y rectitud en el desarrollo de las actividades.

5.Política de fumador
Nos permitimos informarle que nuestro hotel es una propiedad LIBRE DE HUMO. Por su salud y seguridad NO está permitido fumar en la habitación, de no ser respetada esta norma, se cargará un monto de COP 900.0000 + IVA el cual se verá reflejado en su cuenta.

6.Politica de acompañantes
Por motivos de Seguridad, todos nuestros huéspedes deben ser registrados en la recepción durante el “check in”. No está permitido el ingreso de nuevos huéspedes durante la estadía. Kuyay Hostel no admitirá el registro de huéspedes adicionales o acompañantes, de acuerdo a sus políticas de seguridad si no fueron registrados al momento del Ingreso “check in”.

POLITICAS DE CONDICIONES LEGALES ESPECIALES.

7.Política Prevención Lavado de Activos y Financiación del Terrorismo
(…texto completo…)
`,
    []
  );

  const onSubmitClick = () => {
    if (!acceptTerms) {
      setTermsError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }
    setTermsError("");
    handleSubmit(titular?.motivoViaje || "");
  };

  return (
    <>
      <ResultModal
        show={showModal}
        message={modalMessage}
        guest={titular}
        reserva={reserva as any}
        onClose={() => setShowModal(false)}
      />

      <GuestsTodayModal
        show={showModalHoy}
        huespedes={huespedesHoy}
        onClose={cerrarModalHoy}
      />

      <div style={styles.container}>
        <h2 style={styles.title}>Registro de Huéspedes</h2>

        <button
          onClick={cargarHuespedesHoy}
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 2rem",
            background: "#10b981",
            borderRadius: "0.5rem",
            border: "none",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Ver huéspedes registrados hoy
        </button>

        {reserva?.numeroReserva && (
          <h3 style={styles.subTitle}>
            Código de Reserva:{" "}
            <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
          </h3>
        )}

        {/* ✅ FORMULARIO */}
        {formList.map((formData, index) => (
          <GuestCard
            key={formData._id ?? index}
            data={formData}
            index={index}
            onChange={handleChange}
            onFile={handleFileChange}
            onRemove={removeGuestByIndex}  // ✅ FIX: volver a pasar el handler
          />
        ))}

        {/* ✅ AGREGAR HUÉSPED */}
        <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <button
            onClick={handleAddGuest}
            style={{
              ...styles.button,
              backgroundColor: "#8b5cf6",
              width: "auto",
              padding: "0.85rem 1.5rem",
            }}
            disabled={loading}
          >
            Agregar Huésped / Add Guest
          </button>
        </div>

        {/* ✅ TÉRMINOS */}
        <div
          style={{
            marginTop: "1.5rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.75rem",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (e.target.checked) setTermsError("");
              }}
              style={{ transform: "scale(1.2)", cursor: "pointer" }}
            />

            <label
              htmlFor="acceptTerms"
              style={{ color: "white", cursor: "pointer", fontWeight: 700 }}
            >
              Acepto los Términos y Condiciones del servicio
            </label>

            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "white",
                borderRadius: "0.5rem",
                padding: "0.45rem 0.8rem",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Ver términos
            </button>
          </div>

          {termsError && (
            <div style={{ marginTop: "0.75rem", color: "#fca5a5", fontSize: "0.9rem" }}>
              {termsError}
            </div>
          )}
        </div>

        {/* ✅ SUBMIT */}
        <div style={styles.actions}>
          <button
            onClick={onSubmitClick}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Registro / Submit"}
          </button>
        </div>
      </div>

      {/* ✅ MODAL TÉRMINOS */}
      {showTermsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            style={{
              background: "#111827",
              padding: "1.25rem",
              borderRadius: "0.75rem",
              width: "100%",
              maxWidth: "860px",
              color: "white",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                Términos y Condiciones del servicio
              </h2>

              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  marginLeft: "auto",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "white",
                  padding: "0.55rem 0.9rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>

            <div
              style={{
                marginTop: "1rem",
                maxHeight: "60vh",
                overflowY: "auto",
                padding: "1rem",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "0.65rem",
                whiteSpace: "pre-wrap",
                lineHeight: 1.4,
                fontSize: "0.95rem",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {TERMS_TEXT}
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => {
                  setAcceptTerms(true);
                  setTermsError("");
                  setShowTermsModal(false);
                }}
                style={{
                  flex: 1,
                  background: "#10b981",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "white",
                  padding: "0.75rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Acepto los términos
              </button>

              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "0.5rem",
                  color: "white",
                  padding: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
