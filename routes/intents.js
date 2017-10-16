'use strict';

const express = require('express');
const router = express.Router();

const intentController = require('../controllers/intentController');

router.get('/', intentController.intentsListGET);
router.post('/', intentController.intentsListPOST);
router.post('/details', intentController.intentsDetailsPOST);

module.exports = router;
