const express = require("express");
const router = express.Router();
const { getSmartRecommendations } = require("../controller/recommendationController");
const { protect } = require("../middleware/auth");

router.post("/", protect, getSmartRecommendations);

module.exports = router;
