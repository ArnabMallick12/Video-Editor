const express = require('express');
const router = express.Router();
const editController = require('../controllers/editController');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/');
  },
  filename: function (req, file, cb) {
    cb(null, 'thumbnail-' + Date.now() + path.extname(file.originalname));
  }
});

// Configure multer upload
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create temp directory if it doesn't exist
const fs = require('fs');
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
}

// Routes
router.post('/edit', upload.single('thumbnail'), editController.processEditRequest);

module.exports = router; 