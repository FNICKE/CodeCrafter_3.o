const express = require('express');
const router  = express.Router();
const {
  getAnalystReport,
  getEarningsCalendar,
  getIPOCalendar,
  getSecSummary,
  getReportsOverview,
} = require('../controller/reportsController'); // ✅ adjust path if needed
const { protect } = require('../middleware/auth');

// Frontend calls:
// GET /api/reports/analyst/:ticker      → getAnalystReport
// GET /api/reports/earnings-calendar    → getEarningsCalendar
// GET /api/reports/ipo-calendar         → getIPOCalendar
// GET /api/reports/sec/:ticker          → getSecSummary  ✅ was 'sec-summary' before
// GET /api/reports/overview             → getReportsOverview

router.get('/analyst/:ticker',     protect, getAnalystReport);
router.get('/earnings-calendar',   protect, getEarningsCalendar);
router.get('/ipo-calendar',        protect, getIPOCalendar);
router.get('/sec/:ticker',         protect, getSecSummary);      // ✅ fixed route name
router.get('/overview',            protect, getReportsOverview);

module.exports = router;