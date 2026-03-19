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
  deletePasscode,
  extendPasscodeByGuest,
  getGuestLocksMatrix,
  createPasscodeSelected,
  deletePasscodeSelected,
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
router.post("/delete-passcode", deletePasscode);

// nuevo: consultar matrix de locks por huésped
router.get("/guest-locks/:huespedId", getGuestLocksMatrix);

// nuevo: crear solo locks seleccionados
router.post("/create-passcode-selected", createPasscodeSelected);

// nuevo: eliminar solo locks seleccionados
router.post("/delete-passcode-selected", deletePasscodeSelected);

// extender
router.put("/passcode/extend/:huespedId", extendPasscodeByGuest);

// debug env
router.get("/debug/env", debugEnv);

module.exports = router;