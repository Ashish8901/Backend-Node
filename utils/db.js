const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URI, { dbName: 'auth' })
  .then(() => {
    console.log('MongoDb connected');
  })
  .catch((err) => console.log(err.message));

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to db');
});

mongoose.connection.on('error', (err) => {
  console.log(err.message);
});

mongoose.connection.on('disconnected', (err) => {
  console.log('Mongoose disconnected to db');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
