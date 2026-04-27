const express = require('express');
const router = express.Router();
const {
    getAgreements,
    getAgreement,
    getCategories,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    uploadAgreementFile,
    downloadAgreement,
    previewAgreement,
    approveAgreement,
    rejectAgreement
} = require('../controllers/agreementController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
    .get(protect, getAgreements)
    .post(protect, createAgreement);

router.get('/categories', protect, getCategories);

router.route('/:id')
    .get(protect, getAgreement)
    .put(protect, updateAgreement)
    .delete(protect, deleteAgreement);

router.post('/:id/upload', protect, upload.single('file'), uploadAgreementFile);
router.get('/:id/download', protect, downloadAgreement);
router.get('/:id/preview', protect, previewAgreement);
router.put('/:id/approve', protect, approveAgreement);
router.put('/:id/reject', protect, rejectAgreement);

module.exports = router;
