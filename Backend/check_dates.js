const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://ccm:ccm2022c@mire-hub.ylagdft.mongodb.net/FInventry-System?appName=mire-Hub').then(async () => { 
    const db = mongoose.connection.db; 
    const start = new Date(); 
    start.setHours(0,0,0,0); 
    const end = new Date(); 
    end.setHours(23,59,59,999); 
    const count = await db.collection('purchases').countDocuments({ status: 'Completed', updatedAt: { $gte: start, $lte: end } }); 
    const allCompleted = await db.collection('purchases').countDocuments({ status: 'Completed' }); 
    const withoutUpdatedAt = await db.collection('purchases').countDocuments({ status: 'Completed', purchaseDate: { $gte: start, $lte: end } }); 
    console.log('Today (updatedAt):', count);
    console.log('Today (purchaseDate):', withoutUpdatedAt);
    console.log('All completed:', allCompleted); 
    mongoose.disconnect(); 
});
