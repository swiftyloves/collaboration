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

wss.on('connection', function (ws) {
    ws.on('message', (data) => {
        console.log('data: ', data);
        if (data === 'HELPER_WS') {
            helperWS = ws;
            helperWS.on('message', (data) => {
                // Helepr hand data
                data = JSON.parse(data);
                position = data['position'];
                rotation = data['rotation'];
            })
        } else if (data === 'WORKER_WS') {
            workerWS = ws;
            workerWS.on('message', (data) => {
                // Worker video data
                console.log('worker data: ', data);
            })
        }
    })
    ws.on('close', () => clearInterval(intervalId))
    ws.on('error', (err) => console.log(err));
    let intervalId = setInterval(
        () => ws.send(`${new Date()}`),
        1000
    )
});

app.use('/', express.static('client'));
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
