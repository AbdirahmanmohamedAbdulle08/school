require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('./src/models/Location');
const Warehouse = require('./src/models/Warehouse');
const connectDB = require('./src/db');

const seed = async () => {
    try {
        await connectDB();

        // 1. Get or create first warehouse
        let warehouse = await Warehouse.findOne();
        if (!warehouse) {
            console.log('No warehouse found. Creating default "Main Logistics Hub" warehouse...');
            warehouse = await Warehouse.create({
                name: 'Main Logistics Hub',
                code: 'MLH-001',
                address: {
                    street: '100 Industrial Parkway',
                    city: 'Chicago',
                    state: 'IL',
                    zipCode: '60601',
                    country: 'USA'
                },
                contact: {
                    phone: '+1-555-0199',
                    email: 'hub@inventoryflow.com'
                },
                capacity: 50000,
                is_default: true,
                isActive: true
            });
            console.log(`✓ Created Warehouse: ${warehouse.name} (${warehouse._id})`);
        } else {
            console.log(`Using existing Warehouse: ${warehouse.name} (${warehouse._id})`);
        }

        // Clean existing locations under this warehouse if any (optional, let's keep them clean)
        const count = await Location.countDocuments({ warehouseId: warehouse._id });
        if (count > 0) {
            console.log(`Warehouse already has ${count} locations. Skipping seeder to prevent duplicates.`);
            process.exit(0);
        }

        // 2. Create Zones
        console.log('Seeding Zones...');
        const zoneA = await Location.create({
            warehouseId: warehouse._id,
            parentId: null,
            type: 'Zone',
            name: 'Cold Zone A',
            barcode: 'Z-COLD-A',
            description: 'Temperature controlled environment (2-8°C) for perishable goods'
        });

        const zoneB = await Location.create({
            warehouseId: warehouse._id,
            parentId: null,
            type: 'Zone',
            name: 'General Zone B',
            barcode: 'Z-GEN-B',
            description: 'Ambient temperature storage'
        });

        // 3. Create Racks
        console.log('Seeding Racks...');
        const rackA1 = await Location.create({
            warehouseId: warehouse._id,
            parentId: zoneA._id,
            type: 'Rack',
            name: 'Rack A1',
            barcode: 'R-A1',
            description: 'Primary Cold Rack'
        });

        const rackB1 = await Location.create({
            warehouseId: warehouse._id,
            parentId: zoneB._id,
            type: 'Rack',
            name: 'Rack B1',
            barcode: 'R-B1',
            description: 'Primary Ambient Rack'
        });

        // 4. Create Shelves
        console.log('Seeding Shelves...');
        const shelfA1S1 = await Location.create({
            warehouseId: warehouse._id,
            parentId: rackA1._id,
            type: 'Shelf',
            name: 'Shelf A1-S1',
            barcode: 'S-A1-S1',
            description: 'Top shelf Cold Storage'
        });

        const shelfB1S1 = await Location.create({
            warehouseId: warehouse._id,
            parentId: rackB1._id,
            type: 'Shelf',
            name: 'Shelf B1-S1',
            barcode: 'S-B1-S1',
            description: 'Top shelf Ambient Storage'
        });

        // 5. Create Bins
        console.log('Seeding Bins...');
        await Location.create({
            warehouseId: warehouse._id,
            parentId: shelfA1S1._id,
            type: 'Bin',
            name: 'Cold Bin 01',
            barcode: 'B-COLD-01',
            description: 'Cold Bin A1-S1-01'
        });

        await Location.create({
            warehouseId: warehouse._id,
            parentId: shelfA1S1._id,
            type: 'Bin',
            name: 'Cold Bin 02',
            barcode: 'B-COLD-02',
            description: 'Cold Bin A1-S1-02'
        });

        await Location.create({
            warehouseId: warehouse._id,
            parentId: shelfB1S1._id,
            type: 'Bin',
            name: 'Ambient Bin 01',
            barcode: 'B-AMBI-01',
            description: 'Ambient Bin B1-S1-01'
        });

        await Location.create({
            warehouseId: warehouse._id,
            parentId: shelfB1S1._id,
            type: 'Bin',
            name: 'Ambient Bin 02',
            barcode: 'B-AMBI-02',
            description: 'Ambient Bin B1-S1-02'
        });

        console.log('✓ Successfully seeded 8 locations (Zones, Racks, Shelves, Bins)!');
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed:', err.message);
        process.exit(1);
    }
};

seed();
