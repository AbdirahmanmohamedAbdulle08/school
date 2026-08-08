
const systemTemplates = {
    units: [
        { name: 'Kilogram', symbol: 'kg', isRequired: true },
        { name: 'Piece', symbol: 'pcs', isRequired: true },
        { name: 'Box', symbol: 'box', isRequired: false },
        { name: 'Liter', symbol: 'l', isRequired: false },
        { name: 'Meter', symbol: 'm', isRequired: false }
    ],
    roles: [
        {
            name: 'Owner',
            description: 'Business Owner with full access',
            isRequired: true,
            isSystemRole: true,
            permissions: ['*']
        },
        {
            name: 'Warehouse Manager',
            description: 'Full warehouse operations access',
            isRequired: false,
            isSystemRole: true,
            permissions: [
                'Dashboard.Dashboard.View',
                'Sales.New Sale.*', 'Sales.Sales History.*', 'Sales.Returns / Refunds.*', 'Sales.Discounts & Offers.*', 'Sales.Quotations.*',
                'Inventory.Products.*', 'Inventory.Transfer.*', 'Inventory.Categories.*', 'Inventory.Purchases.*', 'Inventory.Stock History.*', 'Inventory.Adjustments.*', 'Inventory.Expiry Alerts.*', 'Inventory.Units.*',
                'Services.Service List.*', 'Services.Categories.*',
                'People.Customers.*', 'People.Vendors.*',
                'HR.Employees.*', 'HR.Attendance.*',
                'Accounting.Expenses.*', 'Accounting.Income.*', 'Accounting.Salaries.*',
                'Reports.Financial.View', 'Reports.Sales & Services.View', 'Reports.Inventory.View', 'Reports.People & HR.View', 'Reports.Activity.View'
            ]
        },
        {
            name: 'Cashier',
            description: 'Point of Sale (POS) and Customer handling',
            isRequired: false,
            isSystemRole: true,
            permissions: [
                'Sales.New Sale.*', 'Sales.Sales History.View', 'Sales.Returns / Refunds.Create', 'Sales.Quotations.Create',
                'People.Customers.Create', 'People.Customers.View',
                'Inventory.Products.View'
            ]
        },
        {
            name: 'Salesman',
            description: 'Sales processing and quotations',
            isRequired: false,
            isSystemRole: true,
            permissions: [
                'Sales.New Sale.Create', 'Sales.New Sale.View', 'Sales.Quotations.*',
                'People.Customers.View', 'People.Customers.Create',
                'Inventory.Products.View'
            ]
        },
        {
            name: 'Stockman',
            description: 'Inventory management and stock control',
            isRequired: false,
            isSystemRole: true,
            permissions: [
                'Inventory.Products.*', 'Inventory.Transfer.*', 'Inventory.Categories.*', 'Inventory.Purchases.*', 'Inventory.Stock History.*', 'Inventory.Adjustments.*', 'Inventory.Expiry Alerts.*', 'Inventory.Units.*',
                'People.Vendors.*'
            ]
        },
        {
            name: 'Accountant',
            description: 'Financial records management',
            isRequired: false,
            isSystemRole: true,
            permissions: [
                'Accounting.*', 'Reports.Financial.*'
            ]
        }
    ],
    accounts: [
        // Assets
        { code: '1010', name: 'Cash on Hand', type: 'Asset', accountCategory: 'Cash', isRequired: true },
        { code: '1020', name: 'Bank Account', type: 'Asset', accountCategory: 'Bank', isRequired: true },
        { code: '1030', name: 'Accounts Receivable', type: 'Asset', accountCategory: 'Other', isRequired: true },
        { code: '1200', name: 'Inventory Asset', type: 'Asset', accountCategory: 'Other', isRequired: true },

        // Liabilities
        { code: '2010', name: 'Accounts Payable', type: 'Liability', accountCategory: 'Other', isRequired: true },

        // Equity
        { code: '3000', name: 'Equity', type: 'Equity', accountCategory: 'Other', isRequired: true },

        // Income
        { code: '4010', name: 'Income', type: 'Income', accountCategory: 'Other', isRequired: true },

        // Expenses
        { code: '5010', name: 'Cost of Goods Sold', type: 'Expense', accountCategory: 'Other', isRequired: true }
    ]
};

module.exports = systemTemplates;
