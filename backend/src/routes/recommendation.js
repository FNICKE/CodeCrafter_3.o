// routes/recommendationRoutes.js
const express = require("express");
const router  = express.Router();
const { getSmartRecommendations, getTopStocks } = require("../controller/recommendationController");
const { protect } = require("../middleware/auth");

// GET  /api/recommendations/top?budget=500000   → top stocks shown on page load
router.get("/top", protect, getTopStocks);

// POST /api/recommendations                     → budget-filtered + optional symbol search
router.post("/", protect, getSmartRecommendations);

module.exports = router;