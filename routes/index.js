var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'TMSI Online Assessment', message: req.session.errors });
});

/* GET home page as logout page. */
router.get('/logout', function(req, res, next) {
  req.session.destroy();
  res.redirect('/')
});

module.exports = router;
