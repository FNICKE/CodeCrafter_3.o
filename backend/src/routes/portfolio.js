const express = require("express");
const router = express.Router();
const {
  getPortfolios,
  createPortfolio,
  getHoldings,
  addHolding,
  deletePortfolio,
} = require("../controller/portfolioController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getPortfolios);
router.post("/", protect, createPortfolio);
router.get("/:id/holdings", protect, getHoldings);
router.post("/:id/holdings", protect, addHolding);
router.delete("/:id", protect, deletePortfolio);

module.exports = router;
