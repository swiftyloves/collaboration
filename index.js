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
        if (data === 'HELPER') {
            helperWS = ws;
        } else if (data === 'WORKER') {
            workerWS = ws;
        } else {
            data = JSON.parse(data);
            position = data['position'];
            rotation = data['rotation'];
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
