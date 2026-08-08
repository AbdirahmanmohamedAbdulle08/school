const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', auditController.startAudit);
router.get('/', auditController.getAudits);
router.get('/:id', auditController.getAuditById);
router.post('/record-count', auditController.recordCount);
router.put('/:id/complete', auditController.completeAudit);

module.exports = router;
