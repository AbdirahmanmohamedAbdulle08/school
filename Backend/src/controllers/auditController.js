const Audit = require('../models/Audit');
const BinStock = require('../models/BinStock');
const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const populateAudit = (query) => query
    .populate('warehouse', 'name')
    .populate('items.product', 'name sku')
    .populate('items.bin', 'name barcode')
    .populate('createdBy', 'username');

// Start a new audit
exports.startAudit = async (req, res) => {
    try {
        const { warehouseId, notes } = req.body;
        const auditNo = `AUD-${Date.now().toString().slice(-8)}`;
        
        const audit = new Audit({
            auditNo,
            warehouse: warehouseId,
            notes,
            createdBy: req.user.id,
            items: []
        });

        await audit.save();
        res.status(201).json(audit);
    } catch (error) {
        res.status(500).json({ message: 'Failed to start audit', error: error.message });
    }
};

// Get all audits
exports.getAudits = async (req, res) => {
    try {
        const audits = await Audit.find()
            .populate('warehouse', 'name')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });
        res.json(audits);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audits', error: error.message });
    }
};

// Get specific audit
exports.getAuditById = async (req, res) => {
    try {
        const audit = await populateAudit(Audit.findById(req.params.id));
        if (!audit) return res.status(404).json({ message: 'Audit not found' });
        res.json(audit);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit', error: error.message });
    }
};

// Record a physical count for an item
exports.recordCount = async (req, res) => {
    try {
        const {
            auditId,
            productId: rawProductId,
            binId: rawBinId,
            physicalQuantity
        } = req.body;
        const productId = rawProductId || req.body.product;
        const binId = rawBinId || req.body.bin;
        const countedQuantity = Number(physicalQuantity);

        if (!mongoose.Types.ObjectId.isValid(auditId)) {
            return res.status(400).json({ message: 'Invalid audit session.' });
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Please select a valid product.' });
        }
        if (!mongoose.Types.ObjectId.isValid(binId)) {
            return res.status(400).json({ message: 'Please select a valid bin location.' });
        }
        if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
            return res.status(400).json({ message: 'Physical quantity must be zero or greater.' });
        }
        
        const audit = await Audit.findById(auditId);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });
        if (audit.status !== 'In-Progress') return res.status(400).json({ message: 'Audit is not in progress' });

        const stockTotals = await BinStock.aggregate([
            {
                $match: {
                    productId: new mongoose.Types.ObjectId(productId),
                    locationId: new mongoose.Types.ObjectId(binId),
                    warehouseId: new mongoose.Types.ObjectId(audit.warehouse)
                }
            },
            { $group: { _id: null, quantity: { $sum: '$quantity' } } }
        ]);
        const systemQuantity = stockTotals[0]?.quantity || 0;
        
        const difference = countedQuantity - systemQuantity;
        let status = 'Matched';
        if (difference < 0) status = 'Missing';
        if (difference > 0) status = 'Overstock';

        // Check if item already exists in audit
        const existingItemIndex = audit.items.findIndex(item => 
            item.product.toString() === productId && item.bin.toString() === binId
        );

        const newItem = {
            product: productId,
            bin: binId,
            systemQuantity,
            physicalQuantity: countedQuantity,
            difference,
            status
        };

        if (existingItemIndex > -1) {
            audit.items[existingItemIndex] = newItem;
        } else {
            audit.items.push(newItem);
        }

        await audit.save();
        const populatedAudit = await populateAudit(Audit.findById(audit._id));
        res.json(populatedAudit);
    } catch (error) {
        res.status(500).json({ message: 'Failed to record count', error: error.message });
    }
};

// Complete an audit
exports.completeAudit = async (req, res) => {
    try {
        const audit = await Audit.findById(req.params.id);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });
        
        audit.status = 'Completed';
        audit.completedAt = new Date();
        await audit.save();
        
        res.json(audit);
    } catch (error) {
        res.status(500).json({ message: 'Failed to complete audit', error: error.message });
    }
};
