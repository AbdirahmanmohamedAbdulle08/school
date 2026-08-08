const fs = require('fs');
const path = require('path');

const models = [
    { name: 'Branch', param: 'branch' },
    { name: 'Class', param: 'cls' },
    { name: 'Guardian', param: 'guardian' },
    { name: 'Student', param: 'student' },
    { name: 'Payment', param: 'payment' },
    { name: 'StudentAttendance', param: 'studentAttendance' },
    { name: 'TeacherAttendance', param: 'teacherAttendance' },
    { name: 'Salary', param: 'salary' },
    { name: 'Wallet', param: 'wallet' },
    { name: 'Transaction', param: 'transaction' },
    { name: 'Expense', param: 'expense' },
    { name: 'Notification', param: 'notification' }
];

const controllersPath = path.join(__dirname, '../src/controllers');
const routesPath = path.join(__dirname, '../src/routes');

const generateController = (modelName, paramName) => {
    return `const asyncHandler = require('../middleware/asyncHandler');
const ${modelName} = require('../models/${modelName}');

const get${modelName}s = asyncHandler(async (req, res) => {
    const data = await ${modelName}.find();
    res.json(data);
});

const get${modelName}ById = asyncHandler(async (req, res) => {
    const data = await ${modelName}.findById(req.params.id);
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('${modelName} not found');
    }
});

const create${modelName} = asyncHandler(async (req, res) => {
    const data = await ${modelName}.create(req.body);
    res.status(201).json(data);
});

const update${modelName} = asyncHandler(async (req, res) => {
    const data = await ${modelName}.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (data) {
        res.json(data);
    } else {
        res.status(404);
        throw new Error('${modelName} not found');
    }
});

const delete${modelName} = asyncHandler(async (req, res) => {
    const data = await ${modelName}.findByIdAndDelete(req.params.id);
    if (data) {
        res.json({ message: '${modelName} removed' });
    } else {
        res.status(404);
        throw new Error('${modelName} not found');
    }
});

module.exports = {
    get${modelName}s,
    get${modelName}ById,
    create${modelName},
    update${modelName},
    delete${modelName}
};
`;
};

const generateRoute = (modelName, paramName) => {
    const controllerName = `${paramName}Controller`;
    return `const express = require('express');
const router = express.Router();
const {
    get${modelName}s,
    get${modelName}ById,
    create${modelName},
    update${modelName},
    delete${modelName}
} = require('../controllers/${controllerName}');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, get${modelName}s)
    .post(protect, create${modelName});

router.route('/:id')
    .get(protect, get${modelName}ById)
    .put(protect, update${modelName})
    .delete(protect, delete${modelName});

module.exports = router;
`;
};

models.forEach(({ name, param }) => {
    const controllerFile = path.join(controllersPath, `${param}Controller.js`);
    const routeFile = path.join(routesPath, `${param}Routes.js`);

    fs.writeFileSync(controllerFile, generateController(name, param));
    fs.writeFileSync(routeFile, generateRoute(name, param));
    console.log(`Generated ${name}`);
});
