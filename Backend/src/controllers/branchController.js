const asyncHandler = require('../middleware/asyncHandler');
const Branch = require('../models/Branch');

const getBranchs = asyncHandler(async (req, res) => {
    const data = await Branch.find();
    res.json(data);
});

const getBranchById = asyncHandler(async (req, res) => {
    const data = await Branch.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Branch not found');
    }
});

const createBranch = asyncHandler(async (req, res) => {
    const data = await Branch.create(req.body);
    res.status(201).json(data);
});

const updateBranch = asyncHandler(async (req, res) => {
    const data = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('Branch not found');
    }
});

const deleteBranch = asyncHandler(async (req, res) => {
    const data = await Branch.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: 'Branch removed' });
    } else {
        res.status(404);
        throw new Error('Branch not found');
    }
});

module.exports = {
    getBranchs,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch
};
