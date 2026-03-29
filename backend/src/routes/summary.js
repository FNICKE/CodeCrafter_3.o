const express = require("express");
const router = express.Router();
const { getStockSummary } = require("../controller/summaryController");
const { protect } = require("../middleware/auth");

router.get("/:symbol", protect, getStockSummary);

module.exports = router;
