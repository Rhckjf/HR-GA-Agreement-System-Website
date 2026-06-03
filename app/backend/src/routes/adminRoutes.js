const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/users')
    .get(protect, adminOnly, getUsers)
    .post(protect, adminOnly, createUser);

router.route('/users/:id')
    .put(protect, adminOnly, updateUser)
    .delete(protect, adminOnly, deleteUser);

module.exports = router;
