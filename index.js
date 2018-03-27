const express = require('express');
const app = express();
const http = require('http')
const WebSocket = require('ws')

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({server});
let position = null;
let rotation = null;
let helperWS;
let workerWS;
let data = {};

wss.on('connection', function (ws) {
    ws.on('message', (iniitalConnect) => {
        if (iniitalConnect === 'HELPER_WS') {
            helperWS = ws;
            console.log('HELPER_WS');
            helperWS.on('message', (gestureData) => {
              console.log('gestureData: ',gestureData);
                data['position'] = JSON.parse(gestureData).position;
                data['rotation'] = JSON.parse(gestureData).rotation;
                wss.broadcast(JSON.stringify(data));
            })
        } else if (iniitalConnect === 'WORKER_WS') {
            workerWS = ws;
            console.log('WORKER_WS');
            workerWS.on('message', (videoData) => {
                // Worker video data
                data['signal'] = videoData;
                wss.broadcast(JSON.stringify(data));
            })
        }
    })
    // ws.on('close', () => clearInterval(intervalId))
    ws.on('error', (err) => console.log(err));
});
wss.broadcast = function(data) {
  this.clients.forEach(function(client) {
    if(client.readyState === WebSocket.OPEN) {
        client.send(data);
    }
  });
};
app.use('/', express.static('client'));
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
