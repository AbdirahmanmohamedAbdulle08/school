const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');

// Helper: Get or create the single settings document
const getOrCreateSettings = async () => {
    let settings = await SystemSettings.findOne();
    if (!settings) {
        settings = await SystemSettings.create({
            businessInfo: { name: 'Cumar Binu Khadhaab', systemSubtitle: 'Institute Management' },
            operatingHours: [
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
            ].map(day => ({ day, open: '08:00 AM', close: '06:00 PM', isClosed: day === 'Sunday' }))
        });
    }
    return settings;
};

// @desc    Get current tenant info (reads from SystemSettings)
// @route   GET /api/tenants/me
// @access  Public
router.get('/me', async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json({
            name: settings.businessInfo.name || 'Cumar Binu Khadhaab',
            systemSubtitle: settings.businessInfo.systemSubtitle || 'Institute Management',
            legalName: settings.businessInfo.legalName,
            industry: settings.businessInfo.industry,
            description: settings.businessInfo.description,
            logo: settings.businessInfo.logo,
            currency: settings.businessInfo.currency || 'USD',
            timezone: settings.businessInfo.timezone || 'Africa/Nairobi',
            subdomain: 'warehouse',
            contactInfo: settings.contactInfo,
            operatingHours: settings.operatingHours,
            settings: {
                brandColor: settings.branding.brandColor,
                accentColor: settings.branding.accentColor
            }
        });
    } catch (error) {
        // Fallback to defaults if DB is not ready
        res.json({
            name: 'Cumar Binu Khadhaab',
            systemSubtitle: 'Institute Management',
            logo: null,
            settings: {
                brandColor: '#4f46e5',
                accentColor: '#10b981'
            }
        });
    }
});

// @desc    Update tenant info (saves to SystemSettings)
// @route   PUT /api/tenants/me
// @access  Private
router.put('/me', async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        const body = req.body;

        if (body.name !== undefined) settings.businessInfo.name = body.name;
        if (body.systemSubtitle !== undefined) settings.businessInfo.systemSubtitle = body.systemSubtitle;
        if (body.legalName !== undefined) settings.businessInfo.legalName = body.legalName;
        if (body.industry !== undefined) settings.businessInfo.industry = body.industry;
        if (body.description !== undefined) settings.businessInfo.description = body.description;
        if (body.logo !== undefined) settings.businessInfo.logo = body.logo;
        if (body.currency !== undefined) settings.businessInfo.currency = body.currency;
        if (body.timezone !== undefined) settings.businessInfo.timezone = body.timezone;

        if (body.contactInfo) {
            const existing = settings.contactInfo.toObject();
            settings.contactInfo = {
                ...existing,
                ...body.contactInfo,
                socials: { ...existing.socials, ...(body.contactInfo.socials || {}) }
            };
        }

        if (body.operatingHours) {
            settings.operatingHours = body.operatingHours;
        }

        if (body.settings) {
            if (body.settings.brandColor) settings.branding.brandColor = body.settings.brandColor;
            if (body.settings.accentColor) settings.branding.accentColor = body.settings.accentColor;
        }

        await settings.save();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Failed to update tenant:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

module.exports = router;
