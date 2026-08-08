const mongoose = require('mongoose');
const uri = 'mongodb+srv://ccm:mire2022c@mire-hub.ylagdft.mongodb.net/FInventry-System?appName=mire-Hub';

mongoose.connect(uri)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to connect:', err);
    process.exit(1);
  });
