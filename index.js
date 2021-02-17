var express = require('express');
var path = require('path');
var morgan = require('morgan');
// var rfs = require('rotating-file-stream');
var http = require('http');

var winston = require('./lib/winston');
const checkOrders = require('./lib/check_orders');
const ordersController = require('./router/web/docs/orders');

// const WebSocket = require('ws');

// var accessLogStream = rfs.createStream('intercoms-server.log', {
//   interval: '1d', // rotate daily
//   path: path.join(__dirname, 'logs')
// })

var db = require('./lib/db');

db.connect();

var app = express();

app.use(morgan('combined', {
  stream: winston.stream
}));
app.use(express.static('public'));
app.use(express.static('static'));

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(function (err, req, res, next) {
  logger.error(`${req.method} - ${err.message}  - ${req.originalUrl} - ${req.ip}`);
  next(err)
})

// https://stackoverflow.com/questions/19917401/error-request-entity-too-large
var bodyParser = require('body-parser');
app.use(bodyParser.json({
  limit: '50mb'
}));

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
  cookie: {
    maxAge: 60000 * 60 * 24 * 30
  } // 30 days
}));
app.use(flash());

app.use('/', require('./router/web/index')());
app.use('/admin', require('./router/admin/index')());
app.use('/home', require('./router/web/index')());

let server = http.createServer(app)
let webSocketServer = require('./lib/wss');
const logger = require('./lib/winston');

webSocketServer.connect({
  server
});
const wss = webSocketServer.get();

wss.on('connection', (ws) => {

  // console.log('Remote address: ' + ws._socket.remoteAddress);
  // console.log('Remote port: ' + ws._socket.remotePort);

  ws.on('message', (message) => {
    logger.info(`Получено сообщение: ${message}`);

    let obj;
    try {
      obj = JSON.parse(message);
    } catch (e) {
      console.log('');
      console.log('Ошибка при получении сообщения на сервере от клиента');
      console.log('Тип ошибки: ' + e.name);
      console.log('Описание ошибки: ' + e.message);
      console.log('Cообщение: ' + message);
      console.log('Длина сообщения: ' + message.length);
      console.log('');
      return;
    }

    if ('action' in obj) {

      const remoteAddress = ws._socket.remoteAddress;
      const remotePort = ws._socket.remotePort;

      // 1
      if (obj.action.localeCompare('generateOrderSetup') === 0) {
        const {
          id
        } = obj.data;

        ordersController.buildReportForSetup(id, true, (filename) => {

          if (filename) {
            wss.clients.forEach((ws) => {
              if ((ws._socket.remoteAddress == remoteAddress) && (ws._socket.remotePort != remotePort)) {
                ws.send(JSON.stringify({
                  action: 'openFile',
                  filename: filename
                }))
              }
            })
          }
        });
      }

      // 2
      if (obj.action.localeCompare('generateOrderService') === 0) {
        const {
          id
        } = obj.data;

        ordersController.buildReportForService(id, true, (filename) => {

          if (filename) {
            wss.clients.forEach((ws) => {
              if ((ws._socket.remoteAddress == remoteAddress) && (ws._socket.remotePort != remotePort)) {
                ws.send(JSON.stringify({
                  action: 'openFile',
                  filename: filename
                }))
              }
            })
          }
        });
      }

      // 3
      if (obj.action.localeCompare('openOrderSetup') === 0) {
        const {
          contractNumber
        } = obj.data;

        const filename = checkOrders.existsOrder(contractNumber, 1, true);
        console.log('filename: ' + filename);

        if (filename) {
          console.log('11');
          wss.clients.forEach((ws) => {
            if ((ws._socket.remoteAddress == remoteAddress) && (ws._socket.remotePort != remotePort)) {
              console.log('22');
              ws.send(JSON.stringify({
                action: 'openFile',
                filename: filename
              }))
            }
          })
        } else {
          console.log('33');
          ws.send(JSON.stringify({
            action: 'errorOpenFile',
            index: 1
          }))
        }
      }

      // 4
      if (obj.action.localeCompare('openOrderService') === 0) {
        const {
          contractNumber
        } = obj.data;

        const filename = checkOrders.existsOrder(contractNumber, 2, true);

        if (filename) {
          wss.clients.forEach((ws) => {
            if ((ws._socket.remoteAddress == remoteAddress) && (ws._socket.remotePort != remotePort)) {
              ws.send(JSON.stringify({
                action: 'openFile',
                filename: filename
              }))
            }
          })
        } else {
          ws.send(JSON.stringify({
            action: 'errorOpenFile',
            index: 2
          }))
        }
      }

    }
  });
});

server.listen(process.env.PORT || 5005, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});