const asyncHandler = require('../middleware/asyncHandler');
const SystemSettings = require('../models/SystemSettings');
const mongoose = require('mongoose');

const getOrCreateSettings = async () => {
    let settings = await SystemSettings.findOne();
    if (!settings) {
        settings = await SystemSettings.create({
            businessInfo: { name: 'Institute' },
            operatingHours: [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
            ].map(day => ({ day, open: '08:00 AM', close: '06:00 PM', isClosed: day === 'Sunday' }))
        });
    }
    return settings;
};

const getSettings = asyncHandler(async (req, res) => {
    const settings = await getOrCreateSettings();
    res.json(settings);
});

const updateSettings = asyncHandler(async (req, res) => {
    let settings = await getOrCreateSettings();
    const updates = req.body;

    if (updates.businessInfo) {
        settings.businessInfo = { ...settings.businessInfo.toObject(), ...updates.businessInfo };
    }
    if (updates.branding) {
        settings.branding = { ...settings.branding.toObject(), ...updates.branding };
    }
    if (updates.contactInfo) {
        const existingContact = settings.contactInfo.toObject();
        settings.contactInfo = {
            ...existingContact,
            ...updates.contactInfo,
            socials: { ...existingContact.socials, ...(updates.contactInfo.socials || {}) }
        };
    }
    if (updates.operatingHours) {
        settings.operatingHours = updates.operatingHours;
    }
    if (updates.notifications) {
        const existing = settings.notifications.toObject();
        settings.notifications = {
            sms: { ...existing.sms, ...(updates.notifications.sms || {}) },
            email: { ...existing.email, ...(updates.notifications.email || {}) },
            push: { ...existing.push, ...(updates.notifications.push || {}) }
        };
    }
    if (updates.alerts) {
        settings.alerts = { ...settings.alerts.toObject(), ...updates.alerts };
    }

    const saved = await settings.save();
    res.json(saved);
});

const triggerBackup = asyncHandler(async (req, res) => {
    let settings = await getOrCreateSettings();
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    let totalDocs = 0;
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        totalDocs += count;
    }
    const estimatedSizeKB = totalDocs * 2;
    const sizeStr = estimatedSizeKB > 1024
        ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
        : `${estimatedSizeKB} KB`;

    const snapshot = {
        id: `SNAP-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date(),
        size: sizeStr,
        status: 'completed',
        type: 'manual',
        collections: collections.length,
        documents: totalDocs
    };

    settings.backup.history.unshift(snapshot);
    if (settings.backup.history.length > 20) {
        settings.backup.history = settings.backup.history.slice(0, 20);
    }
    settings.backup.lastBackupAt = new Date();

    await settings.save();
    res.json({ message: 'Backup snapshot created successfully', snapshot });
});

const getAlertsSummary = asyncHandler(async (req, res) => {
    const settings = await getOrCreateSettings();
    res.json({
        lowStock: { count: 0, items: [], threshold: 10 },
        expiring: { count: 0, expired: 0, items: [], daysWarning: 30 },
        shipments: { delayed: 0, items: [], delayHours: 24 },
        warehouse: { warnings: 0, items: [], capacityThreshold: 90 },
        tasks: { overdue: 0, urgent: 0, items: [] },
        audits: { active: 0, items: [] },
        finance: { negativeWallets: 0, customerBalances: 0, vendorBalances: 0, wallets: [], customers: [], vendors: [] },
        operations: { pendingSales: 0, pendingPurchases: 0, sales: [], purchases: [] },
        totalAlerts: 0
    });
});

module.exports = {
    getSettings,
    updateSettings,
    triggerBackup,
    getAlertsSummary
};
