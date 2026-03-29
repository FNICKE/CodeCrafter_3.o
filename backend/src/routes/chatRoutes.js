const express = require("express");
const router = express.Router();
const { handleChat } = require("../controller/chatController");
const { protect } = require("../middleware/auth");

router.post("/", protect, handleChat);

module.exports = router;
