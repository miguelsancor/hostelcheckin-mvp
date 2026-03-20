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
  assignSelectedLocksToGuest,
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

router.get("/guest-passcodes/:huespedId", listGuestPasscodes);

// ✅ NUEVO: asignar cerraduras existentes al huésped
router.post("/assign-locks-to-guest", assignSelectedLocksToGuest);

router.post("/delete-passcode", deletePasscode);
router.post("/delete-passcodes-selected", deleteSelectedPasscodes);

router.put("/passcode/extend/:huespedId", extendPasscodeByGuest);

router.get("/debug/env", debugEnv);

module.exports = router;