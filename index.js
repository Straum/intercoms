var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

var publicPath = path.resolve(__dirname, 'public');

app.use(express.static(publicPath));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false 
}));

app.get('/', function(req, res) {
  res.render('index', {
    message: 'Future home page'
  });
});

app.get('/orders', function(req, res) {
  res.end('Future orders');
});

app.get('/about', function(req, res) {
  res.end('Future about');
});

app.use(function (req, res) {
  res.statusCode = 404;
  res.end('Error 404');
});

http.createServer(app).listen(4444);