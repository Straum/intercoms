var express = require('express');
var path = require('path');
var logger = require('morgan');
var http = require('http');
var db = require('./lib/db');
db.connect();

var app = express();

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

var publicPath = path.resolve(__dirname, 'public');
var staticPath = path.join(__dirname, 'static');

app.use(logger('short'));
app.use(express.static(publicPath));
app.use(express.static(staticPath));

// https://stackoverflow.com/questions/19917401/error-request-entity-too-large
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 50000
}));

var expressValidator = require('express-validator');
app.use(expressValidator());

var methodOverride = require('method-override');
app.use(methodOverride(function (req, res) {
  'use strict';
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
 
app.use(cookieParser('keyboard cat'));
app.use(session({ 
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 }
}));
app.use(flash());

app.use('/admin', require('./router/admin/index')());
app.use('/home', require('./router/web/index')());
app.use('/', require('./router/web/index')());

http.createServer(app).listen(5005);