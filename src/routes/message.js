const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/messageController');

router.post('/:id/message', handleMessage);

module.exports = router;
