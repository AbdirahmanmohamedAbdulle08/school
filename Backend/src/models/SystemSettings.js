const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    // Business Information
    businessInfo: {
        name: { type: String, default: 'My Warehouse' },
        legalName: { type: String, default: '' },
        industry: { type: String, default: 'Warehousing & Distribution' },
        description: { type: String, default: '' },
        logo: { type: String, default: null },
        currency: { type: String, default: 'USD' },
        currencySymbol: { type: String, default: '$' },
        timezone: { type: String, default: 'Africa/Nairobi' },
        dateFormat: { type: String, default: 'DD/MM/YYYY' }
    },

    // Branding
    branding: {
        brandColor: { type: String, default: '#1E7A3C' },
        accentColor: { type: String, default: '#B8860B' }
    },

    // Contact Information
    contactInfo: {
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        website: { type: String, default: '' },
        socials: {
            instagram: { type: String, default: '' },
            facebook: { type: String, default: '' },
            twitter: { type: String, default: '' }
        }
    },

    // Operating Hours
    operatingHours: [{
        day: String,
        open: { type: String, default: '08:00 AM' },
        close: { type: String, default: '06:00 PM' },
        isClosed: { type: Boolean, default: false }
    }],

    // Notification Settings
    notifications: {
        sms: {
            enabled: { type: Boolean, default: false },
            provider: { type: String, default: '' },
            apiKey: { type: String, default: '' },
            senderName: { type: String, default: '' }
        },
        email: {
            enabled: { type: Boolean, default: true },
            smtpHost: { type: String, default: '' },
            smtpPort: { type: Number, default: 587 },
            smtpUser: { type: String, default: '' },
            smtpPass: { type: String, default: '' },
            senderEmail: { type: String, default: '' }
        },
        push: {
            enabled: { type: Boolean, default: true },
            sound: { type: Boolean, default: true },
            desktop: { type: Boolean, default: true }
        }
    },

    // Alert Thresholds
    alerts: {
        lowStockEnabled: { type: Boolean, default: true },
        lowStockThreshold: { type: Number, default: 10 },
        expiryEnabled: { type: Boolean, default: true },
        expiryDaysWarning: { type: Number, default: 30 },
        shipmentDelayEnabled: { type: Boolean, default: true },
        shipmentDelayHours: { type: Number, default: 48 },
        warehouseCapacityEnabled: { type: Boolean, default: true },
        warehouseCapacityPercent: { type: Number, default: 90 }
    },

    // Backup Configuration
    backup: {
        autoBackupEnabled: { type: Boolean, default: false },
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
        retentionDays: { type: Number, default: 90 },
        lastBackupAt: { type: Date, default: null },
        history: [{
            id: String,
            createdAt: { type: Date, default: Date.now },
            size: String,
            status: { type: String, enum: ['completed', 'failed', 'in_progress'], default: 'completed' },
            type: { type: String, enum: ['manual', 'auto'], default: 'manual' },
            collections: { type: Number, default: 0 },
            documents: { type: Number, default: 0 }
        }]
    },

    // Label & Printing
    labelPrinting: {
        printerName: { type: String, default: '' },
        connectionType: { type: String, enum: ['usb', 'network', 'bluetooth', 'none'], default: 'none' },
        printerIP: { type: String, default: '' },
        barcode: {
            format: { type: String, enum: ['CODE128', 'EAN13', 'UPC', 'CODE39', 'QR'], default: 'CODE128' },
            width: { type: Number, default: 200 },
            height: { type: Number, default: 100 },
            fontSize: { type: Number, default: 12 },
            showText: { type: Boolean, default: true },
            prefix: { type: String, default: 'WH-' }
        },
        qr: {
            size: { type: Number, default: 150 },
            errorCorrection: { type: String, enum: ['L', 'M', 'Q', 'H'], default: 'M' },
            includeProductName: { type: Boolean, default: true },
            includeSKU: { type: Boolean, default: true },
            includePrice: { type: Boolean, default: false }
        },
        receipt: {
            width: { type: Number, default: 80 },
            headerText: { type: String, default: '' },
            footerText: { type: String, default: 'Thank you for your business!' },
            showLogo: { type: Boolean, default: true },
            showAddress: { type: Boolean, default: true },
            showPhone: { type: Boolean, default: true }
        }
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Always update the timestamp on save
systemSettingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
