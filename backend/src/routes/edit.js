// backend/routes/edit.js
const express = require('express');
const router = express.Router();
const { processEditRequest } = require('../controllers/editController');

router.post('/', processEditRequest);

module.exports = router;
