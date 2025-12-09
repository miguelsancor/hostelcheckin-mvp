function parseGuestsFromFormData(body, files = []) {
    const guests = [];
    const re = /^huespedes\[(\d+)\]\[(.+)\]$/;
  
    for (const [k, v] of Object.entries(body)) {
      const m = re.exec(k);
      if (!m) continue;
      const idx = Number(m[1]);
      const key = m[2];
      if (!guests[idx]) guests[idx] = {};
      guests[idx][key] = v;
    }
  
    for (const file of files) {
      const m = re.exec(file.fieldname);
      if (!m) continue;
      const idx = Number(m[1]);
      const key = m[2];
      if (!guests[idx]) guests[idx] = {};
      guests[idx][key] = {
        path: file.path,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      };
    }
  
    return guests.filter(Boolean);
  }
  
  module.exports = { parseGuestsFromFormData };
  