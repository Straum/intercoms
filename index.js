/* eslint-disable no-underscore-dangle */
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const http = require('http');
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const winston = require('./lib/winston');
const logger = require('./lib/winston');
const db = require('./lib/db');

const checkOrders = require('./lib/check_orders');
const ordersController = require('./router/web/docs/orders');

db.connect();

const app = express();

app.use(morgan('combined', {
  stream: winston.stream,
}));
app.use(express.static('public'));
app.use(express.static('static'));

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use((err, req, res, next) => {
  logger.error(`${req.method} - ${err.message} - ${req.originalUrl} - ${req.ip}`);
  next(err);
});

// https://stackoverflow.com/questions/19917401/error-request-entity-too-large
app.use(bodyParser.json({
  limit: '50mb',
}));

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 50000,
}));

app.use(expressValidator());

app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    let method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.use(cookieParser('keyboard cat'));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000 * 60 * 24 * 30,
  }, // 30 days
}));
app.use(flash());

app.use('/', require('./router/web/index')());
app.use('/admin', require('./router/admin/index')());
app.use('/home', require('./router/web/index')());

const server = http.createServer(app);
const webSocketServer = require('./lib/wss');

webSocketServer.connect({
  server,
});
const wss = webSocketServer.get();

wss.on('connection', (ws) => {
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
      const { remoteAddress } = ws._socket;
      const { remotePort } = ws._socket;

      // 1
      if (obj.action.localeCompare('generateOrderSetup') === 0) {
        const { id } = obj.data;

        ordersController.buildReportForSetup(id, true, (filename) => {
          if (filename) {
            wss.clients.forEach((ws) => {
              if ((ws._socket.remoteAddress === remoteAddress)
                && (ws._socket.remotePort !== remotePort)) {
                ws.send(JSON.stringify({
                  action: 'openFile',
                  filename: `start winword /t ${filename}`,
                }));
              }
            });
          }
        });
      }

      // 2
      if (obj.action.localeCompare('generateOrderService') === 0) {
        const { id } = obj.data;

        ordersController.buildReportForService(id, true, (filename) => {
          if (filename) {
            wss.clients.forEach((ws) => {
              if ((ws._socket.remoteAddress === remoteAddress)
                && (ws._socket.remotePort !== remotePort)) {
                ws.send(JSON.stringify({
                  action: 'openFile',
                  filename: `start winword /t ${filename}`,
                }));
              }
            });
          }
        });
      }

      // 3
      if (obj.action.localeCompare('openOrderSetup') === 0) {
        const { contractNumber } = obj.data;

        const filename = checkOrders.existsOrder(contractNumber, 1, true);
        // eslint-disable-next-line no-console
        console.log(`filename: ${filename}`);

        if (filename) {
          console.log('11');
          wss.clients.forEach((ws) => {
            if ((ws._socket.remoteAddress === remoteAddress)
              && (ws._socket.remotePort !== remotePort)) {
              console.log('22');
              ws.send(JSON.stringify({
                action: 'openFile',
                filename,
              }));
            }
          });
        } else {
          console.log('33');
          ws.send(JSON.stringify({
            action: 'errorOpenFile',
            index: 1,
          }));
        }
      }

      // 4
      if (obj.action.localeCompare('openOrderService') === 0) {
        const { contractNumber } = obj.data;

        const filename = checkOrders.existsOrder(contractNumber, 2, true);

        if (filename) {
          wss.clients.forEach((ws) => {
            if ((ws._socket.remoteAddress === remoteAddress)
              && (ws._socket.remotePort !== remotePort)) {
              ws.send(JSON.stringify({
                action: 'openFile',
                filename,
              }));
            }
          });
        } else {
          ws.send(JSON.stringify({
            action: 'errorOpenFile',
            index: 2,
          }));
        }
      }
    }
  });
});

server.listen(process.env.PORT || 5005, () => {
console.log(`Server started on port ${server.address().port} :)`);
});
