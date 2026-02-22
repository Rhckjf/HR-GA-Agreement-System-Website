const express = require('express');
const router = express.Router();
const { getUsers, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/users')
    .get(protect, adminOnly, getUsers);

router.route('/users/:id')
    .delete(protect, adminOnly, deleteUser);

module.exports = router;
