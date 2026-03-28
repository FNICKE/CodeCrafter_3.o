const express = require("express");
const router = express.Router();
const {
  getPortfolios,
  getHoldings,
  addHolding,
  updateHolding,
  deleteHolding,
} = require("../controller/portfolioController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getPortfolios);
router.get("/:id/holdings", protect, getHoldings);
router.post("/:id/holdings", protect, addHolding);
router.put("/:id/holdings/:holdingId", protect, updateHolding);
router.delete("/:id/holdings/:holdingId", protect, deleteHolding);


module.exports = router;