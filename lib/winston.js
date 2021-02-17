// https://www.8host.com/blog/logirovanie-prilozheniya-node-js-s-pomoshhyu-winston/
const moment = require('moment');
const winston = require('winston');
const {format} = require('winston');

const { combine, timestamp, label, printf } = format;

require('winston-daily-rotate-file');
var transport = new winston.transports.DailyRotateFile({
  filename: './logs/intercoms-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
});

const myFormat = printf(({ label, message, timestamp }) => {

  const firstPosition = message.indexOf('- [');
  const twoPosition = message.indexOf(']');

  if ( ((firstPosition > 0) && (twoPosition > 0)) && ((firstPosition <= twoPosition)) ) {
    const modifyMessage = `${message.slice(0, firstPosition - 1)}${message.slice(twoPosition + 1)}`.replace(/\r|\n/g, '');
    return `${moment(timestamp).format('YYYY-MM-DD HH:mm:ss')} ${modifyMessage}`;
  }

  return `${moment(timestamp).format('YYYY-MM-DD HH:mm:ss')} ${message}`;

});

var logger = winston.createLogger({
  format: myFormat,
  transports: [
    transport
  ]
});

logger.stream = {
  write: function (message, encoding) {
    logger.info(message);
  },
};

module.exports = logger;