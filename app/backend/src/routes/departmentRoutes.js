const express = require('express');
const router = express.Router();
const { getDepartments } = require('../controllers/adminController');

router.get('/', getDepartments);

module.exports = router;
