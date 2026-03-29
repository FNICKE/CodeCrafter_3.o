const express3 = require('express');
const router3  = express3.Router();
const { getPortfolioRisk, getBenchmark } = require('../controller/riskController');
const { protect: protect3 } = require('../middleware/auth');
 
router3.get('/portfolio/:portfolioId', protect3, getPortfolioRisk);
router3.get('/benchmark',              protect3, getBenchmark);
 
module.exports = router3;