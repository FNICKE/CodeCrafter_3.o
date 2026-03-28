const express = require("express");
const router = express.Router();
const {
  getPortfolios,
  getHoldings,
  addHolding,
} = require("../controller/portfolioController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getPortfolios);
router.get("/:id/holdings", protect, getHoldings);
router.post("/:id/holdings", protect, addHolding);

module.exports = router;