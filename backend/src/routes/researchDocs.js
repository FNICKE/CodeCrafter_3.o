const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  listDocuments,
  addNoteOrUrl,
  uploadPdf,
  deleteDocument,
} = require("../controller/researchDocsController");

router.get("/", protect, listDocuments);
router.post("/note", protect, addNoteOrUrl);
router.post("/upload", protect, ...uploadPdf);
router.delete("/:id", protect, deleteDocument);

module.exports = router;
