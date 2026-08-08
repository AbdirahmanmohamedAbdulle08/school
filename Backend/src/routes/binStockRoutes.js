const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const BinStock = require('../models/BinStock');
require('../models/Product');
require('../models/Location');
require('../models/Warehouse');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');
const mongoose = require('mongoose');

// @desc    Get all BinStock entries (optionally filtered by warehouse)
// @route   GET /api/binstock
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
    const query = {};
    const isOwner = req.user.roles.some(r => r.name.toLowerCase() === 'owner');

    if (req.query.warehouseId && mongoose.Types.ObjectId.isValid(req.query.warehouseId)) {
        query.warehouseId = req.query.warehouseId;
    } else if (!isOwner && req.user.warehouseId) {
        query.warehouseId = req.user.warehouseId;
    }

    if (req.query.productId) query.productId = req.query.productId;
    if (req.query.locationId) query.locationId = req.query.locationId;

    // Filter for items that have an expiry date (for the expiry page)
    if (req.query.expiryOnly === 'true') {
        query.expiryDate = { $exists: true, $ne: null };
    }

    const binStocks = await BinStock.find(query)
        .populate('locationId', 'name type parentId')
        .populate('warehouseId', 'name')
        .sort({ expiryDate: 1 })
        .lean();

    const productIds = [
        ...new Set(binStocks
            .filter(item => item.productId)
            .map(item => item.productId.toString()))
    ];

    if (productIds.length > 0) {
        const [products, purchaseMatches, transactionMatches] = await Promise.all([
            Product.find({ _id: { $in: productIds } })
                .select('name sku category')
                .lean(),
            Purchase.find({ 'items.product': { $in: productIds } })
                .select('items.product items.productName')
                .lean(),
            StockTransaction.find({ product: { $in: productIds } })
                .select('product productName sku')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        const productsById = new Map(products.map(product => [product._id.toString(), product]));
        const productSnapshots = new Map();

        purchaseMatches.forEach(purchase => {
            (purchase.items || []).forEach(item => {
                const productId = item.product?.toString();
                if (productId && item.productName && !productSnapshots.has(productId)) {
                    productSnapshots.set(productId, { name: item.productName, sku: '' });
                }
            });
        });

        transactionMatches.forEach(transaction => {
            const productId = transaction.product?.toString();
            if (productId && transaction.productName) {
                productSnapshots.set(productId, {
                    name: transaction.productName,
                    sku: transaction.sku || productSnapshots.get(productId)?.sku || ''
                });
            }
        });

        binStocks.forEach(item => {
            if (!item.productId) return;

            const rawProductId = item.productId.toString();
            const product = productsById.get(rawProductId);
            if (product) {
                item.productId = product;
                return;
            }

            const snapshot = productSnapshots.get(rawProductId);
            if (snapshot) {
                item.productName = snapshot.name;
                item.sku = snapshot.sku;
            }
        });
    }

    res.json(binStocks);
}));

module.exports = router;
