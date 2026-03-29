const express = require("express");
const router = express.Router();
const { getQuote, getCandles, getWatchlist, searchSymbol, getCryptoPrices, searchStocks, getSymbols } = require("../controller/marketController");
const { protect } = require("../middleware/auth");

router.get("/quote/:symbol", protect, getQuote);
router.get("/candles/:symbol", protect, getCandles);
router.get("/watchlist", protect, getWatchlist);
router.get("/search", protect, searchSymbol);
router.get("/crypto", protect, getCryptoPrices);
router.get("/symbols", protect, getSymbols);

module.exports = router;
