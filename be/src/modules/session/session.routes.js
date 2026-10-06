const express = require('express');
const router = express.Router();
const sessionController = require('./session.controller');

router.post('/zoom-mail', sessionController.sendZoomMail);
router.post('/close', sessionController.closeSessions);
router.post('/logbook-mail', sessionController.sendLogbookMail);

module.exports = router;