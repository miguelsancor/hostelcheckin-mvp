const express = require("express");
const router = express.Router();

const {
  createKey,
  createPasscode,
  openLock,
  revokeKey,
  listLocks,
  listKeys,
  createPasscodeAll,
  listPasscodesAll,
  listGuestPasscodes,
  deletePasscode,
  deleteSelectedPasscodes,
  extendPasscodeByGuest,
  debugEnv,
} = require("./mcp.controller");

router.post("/create-key", createKey);
router.post("/create-passcode", createPasscode);
router.post("/open-lock", openLock);
router.post("/revoke-key", revokeKey);

router.get("/locks", listLocks);
router.get("/keys", listKeys);

router.post("/create-passcode-all", createPasscodeAll);
router.post("/list-passcodes-all", listPasscodesAll);

// ✅ NUEVO: listar passcodes de un huésped
router.get("/guest-passcodes/:huespedId", listGuestPasscodes);

// ✅ NUEVO: borrar uno
router.post("/delete-passcode", deletePasscode);

// ✅ NUEVO: borrar varios seleccionados
router.post("/delete-passcodes-selected", deleteSelectedPasscodes);

// ✅ EXTENDER por huésped
router.put("/passcode/extend/:huespedId", extendPasscodeByGuest);

// debug env
router.get("/debug/env", debugEnv);

module.exports = router;