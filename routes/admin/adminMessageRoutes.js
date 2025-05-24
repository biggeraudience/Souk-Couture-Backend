const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { getAllMessages, updateMessage } = require('../../controllers/adminController');

router.route('/')
    .get(protect, admin, getAllMessages); // Get all messages

router.route('/:id')
    .put(protect, admin, updateMessage); // Update message status/reply

module.exports = router;
