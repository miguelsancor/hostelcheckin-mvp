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

// ✅ NUEVO: extender passcodes activos de un huésped
router.put("/passcode/extend/:huespedId", extendPasscodeByGuest);

// debug env
router.get("/debug/env", debugEnv);

module.exports = router;