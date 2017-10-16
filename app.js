var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var addRequestId = require('express-request-id');
//var session = require('express-session');
//var RedisStore = require('connect-redis')(session);
// var redis = require('redis');
// var client = redis.createClient(6379, 'localhost');

var index = require('./routes/index');
var intents = require('./routes/intents');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.set('trust proxy', 1) // trust first proxy

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(addRequestId());
app.use(cookieParser());
// app.use(session({
//   secret: process.env.SECRET,
//   //store: new RedisStore({ client: client }),
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true }
// }));

// //TODO revisar esto. llamar a la vista de error.
// app.use((req, res, next) => {
//   if (!req.session) {
//     return next(new Error('Problemas con la sesión!'));
//   }
//   next();
// })


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/intents', intents);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
