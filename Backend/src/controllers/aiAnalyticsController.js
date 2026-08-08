exports.getDemandPrediction = async (req, res) => {
    res.json({ success: true, count: 0, data: [] });
};

exports.getReorderSuggestions = async (req, res) => {
    res.json({ success: true, count: 0, data: [] });
};

exports.getExpiryRisk = async (req, res) => {
    res.json({ success: true, count: 0, data: [] });
};

exports.getStockAnalysis = async (req, res) => {
    res.json({
        success: true,
        data: {
            summary: { totalProductsWithStock: 0, fastMovingCount: 0, deadStockCount: 0, normalCount: 0 },
            fastMoving: [],
            deadStock: []
        }
    });
};
