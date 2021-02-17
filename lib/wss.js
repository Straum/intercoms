'use strict';

const WebSocket = require('ws');
let wss = null;

exports.connect = (params) => {
  wss = new WebSocket.Server(params);
}

exports.get = () => wss;