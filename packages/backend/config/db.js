// const mongoose = require('mongoose');

// const connectDB = async () => {
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     });

//     console.log(`MongoDB Connected: ${conn.connection.host}`);
// }

// module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error('Server will keep running but database operations will fail.');
    console.error('Check your network connection and MongoDB Atlas IP whitelist.');
  }
};

module.exports = connectDB;