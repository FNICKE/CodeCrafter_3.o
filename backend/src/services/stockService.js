const axios = require("axios");

const getStockData = async (symbol) => {
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "d73ns7pr01qjjol3m9l0d73ns7pr01qjjol3m9lg";
  const res = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`);
  return {
    "Global Quote": {
      "01. symbol": symbol.toUpperCase(),
      "05. price": res.data.c
    }
  };
};

module.exports = { getStockData };
