// Color manipulation utilities for dynamic tenant branding

/**
 * Convert hex color to RGB components
 * @param {string} hex - Hex color (e.g., "#4F46E5")
 * @returns {object} RGB values {r, g, b}
 */
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 79, g: 70, b: 229 }; // Fallback to default indigo
};

/**
 * Convert RGB to hex
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color
 */
export const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Lighten a color by a percentage
 * @param {object} rgb - RGB values {r, g, b}
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {object} Lightened RGB values
 */
const lighten = (rgb, percent) => {
    return {
        r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (percent / 100))),
        g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (percent / 100))),
        b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (percent / 100)))
    };
};

/**
 * Darken a color by a percentage
 * @param {object} rgb - RGB values {r, g, b}
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {object} Darkened RGB values
 */
const darken = (rgb, percent) => {
    return {
        r: Math.max(0, Math.round(rgb.r * (1 - percent / 100))),
        g: Math.max(0, Math.round(rgb.g * (1 - percent / 100))),
        b: Math.max(0, Math.round(rgb.b * (1 - percent / 100)))
    };
};

/**
 * Generate a full Tailwind-style color scale from a base color
 * @param {string} baseHex - Base hex color (becomes 600)
 * @returns {object} Color scale from 50-950
 */
export const generateColorScale = (baseHex) => {
    const base = hexToRgb(baseHex);

    return {
        50: lighten(base, 95),
        100: lighten(base, 90),
        200: lighten(base, 75),
        300: lighten(base, 55),
        400: lighten(base, 30),
        500: lighten(base, 10),
        600: base, // Original color
        700: darken(base, 15),
        800: darken(base, 30),
        900: darken(base, 45),
        950: darken(base, 60)
    };
};

/**
 * Apply brand colors to the document as CSS custom properties
 * @param {string} brandColor - Primary brand color hex
 * @param {string} accentColor - Accent color hex (optional)
 */
export const applyBrandColors = (brandColor, accentColor) => {
    const scale = generateColorScale(brandColor);

    // Apply to document root
    const root = document.documentElement;

    Object.entries(scale).forEach(([shade, rgb]) => {
        root.style.setProperty(`--color-brand-${shade}`, `${rgb.r} ${rgb.g} ${rgb.b}`);
    });

    // If accent color provided, apply it too
    if (accentColor) {
        const accentScale = generateColorScale(accentColor);
        Object.entries(accentScale).forEach(([shade, rgb]) => {
            root.style.setProperty(`--color-accent-${shade}`, `${rgb.r} ${rgb.g} ${rgb.b}`);
        });
    }
};

/**
 * Get default brand colors (Indigo)
 * @returns {object} Default colors
 */
export const getDefaultColors = () => ({
    brandColor: '#1E7A3C', // Logo green
    accentColor: '#B8860B'  // Logo gold
});
