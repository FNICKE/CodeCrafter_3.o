const express = require('express');
const router  = express.Router();
const { getTrustScoredFeed, scoreSingleArticle, getSourceReputation } = require('../controller/trustController');
const { protect } = require('../middleware/auth');
 
router.get('/feed',               protect, getTrustScoredFeed);
router.get('/score-article',      protect, scoreSingleArticle);
router.get('/source-reputation',  protect, getSourceReputation);
 
module.exports = router;