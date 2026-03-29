const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getFilings } = require("../controller/regulatoryController");

router.get("/filings", protect, getFilings);

module.exports = router;