var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var multer = require('multer');
var logger = require('morgan');
var mongoose = require('./config/db');

// routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var questionsRouter = require('./routes/questions');
var answersRouter = require('./routes/answers');
var markingsRouter = require('./routes/markings');
var correctionsRouter = require('./routes/corrections');
var reviewsRouter = require('./routes/reviews');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());
app.use(session({secret: 'secret-session-key', resave: true, saveUninitialized: false, cookie: { maxAge: 3600000 }}));
app.use(multer().array())
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/questions', questionsRouter);
app.use('/answers', answersRouter);
app.use('/markings', markingsRouter);
app.use('/corrections', correctionsRouter);
app.use('/reviews', reviewsRouter);
//console.log(process.env);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(req, res, next) {
  if (!req.session.user) {
    req.session.user = {}
  }
  if (!req.session.errors) {
    req.session.errors = {}
  }
})

// error handler - should always be last
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;