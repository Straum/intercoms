var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use('/admin', require('./router/admin/index')());
app.use('/home', require('./router/web/index')());
app.use('/', require('./router/web/index')());

http.createServer(app).listen(4444);