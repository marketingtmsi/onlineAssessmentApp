const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb+srv://admin:QLwctwVy98B0DQBP@cluster0-tetbk.gcp.mongodb.net/tmsi_olassdb?retryWrites=true';
var mongoose = require('mongoose');

// start connecting to database
mongoose.connect(uri, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var conn = mongoose.connection;
conn.on('error', console.error.bind(console, 'MongoDB Atlas connection error'))
conn.once('open', function() {
  console.log('Mongoose connected to MongoDB Atlas...');
});

module.exports = mongoose;