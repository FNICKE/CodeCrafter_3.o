const express = require("express");
const router = express.Router();
const { getAlerts, createAlert, deleteAlert, toggleAlert } = require("../controller/alertController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getAlerts);
router.post("/", protect, createAlert);
router.delete("/:id", protect, deleteAlert);
router.put("/:id/toggle", protect, toggleAlert);

module.exports = router;
