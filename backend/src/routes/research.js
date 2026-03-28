const express = require("express");
const router = express.Router();
const {
  getAssets,
  getAssetByTicker,
  getNews,
  getCompaniesWithNews,
  getMarketSentiment,
  getSectorPerformance,
} = require("../controller/researchController");
const { protect } = require("../middleware/auth");

router.get("/companies-overview", protect, getCompaniesWithNews);
router.get("/assets", protect, getAssets);
router.get("/assets/:ticker", protect, getAssetByTicker);
router.get("/news", protect, getNews);
router.get("/market-sentiment", protect, getMarketSentiment);
router.get("/sector-performance", protect, getSectorPerformance);

module.exports = router;
