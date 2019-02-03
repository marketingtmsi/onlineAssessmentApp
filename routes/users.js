var express = require('express');
var router = express.Router();

var User = require('../models/users');

/* GET users listing. */
//router.get('/', function(req, res, next) {
  /*
  MongoClient.connect(uri, { useNewUrlParser: true }, function(err, client) {
    if (err) {
      console.log('Error connecting to MongoDB Atlas: ', err);
    }
    console.log('MongoClient connected to MongoDB Atlas...');
    var db = client.db('tmsi_olassdb');
    db.collection('users').find().toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
    });
    client.close();
  });
  */
  //res.redirect('/questions');
//});

router.post('/', function(req, res, next) {
  console.log('username ' + req.body.username);
  User.findOne({'username': req.body.username}, function(err, usersResult) {
    if (usersResult) {
      console.log('found ' + usersResult);
      req.session.user = req.body.username;
      req.session.role = usersResult.role;
      if (usersResult.role == 'student') {
        res.redirect('/questions');
      } else {
        res.redirect('/answers');
      }
    } else {
      req.session.errors = 'Wrong username entered!';
      res.redirect('/');
    }
  });  
});

module.exports = router;