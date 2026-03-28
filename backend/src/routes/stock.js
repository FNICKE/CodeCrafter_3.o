const express = require("express");
const router = express.Router();
const { fetchStock } = require("../controller/stockController");
const { protect } = require("../middleware/auth");

router.get("/:symbol", protect, fetchStock);

module.exports = router;
