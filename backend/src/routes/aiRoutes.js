const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getAIPrediction,
  getQuickStockAdvice,
  getPortfolioBuilder,
  getSIPCalculator,
  getLiquidStrategy,
} = require("../controller/aiController");
const { getStockSummary } = require("../controller/summaryController");

router.post("/predict",       protect, getAIPrediction);
router.post("/quick-advice",  protect, getQuickStockAdvice);
router.post("/portfolio",     protect, getPortfolioBuilder);
router.post("/sip",           protect, getSIPCalculator);
router.post("/liquid",        protect, getLiquidStrategy);

// Stock summary / prediction endpoint
router.get("/summary/:symbol", protect, getStockSummary);

module.exports = router;