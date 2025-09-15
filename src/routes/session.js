const express = require('express');
const router = express.Router();
const { createSession, getHistory, resetSession } = require('../controllers/sessionController');

router.post('/', createSession);
router.get('/:id/history', getHistory);
router.post('/:id/reset', resetSession);

module.exports = router;
