const express = require('express');
const app = express();
const http = require('http')
const WebSocket = require('ws')

const PORT = 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({server});
let position = null;
let rotation = null;

wss.on('connection', function (ws) {
    ws.on('message', (data) => {
        data = JSON.parse(data)
        position = data['position'];
        rotation = data['rotation'];

        if ('triggerdown' in data) {

        }
    })
    ws.on('close', () => clearInterval(intervalId))

    let intervalId = setInterval(
        () => ws.send(`${new Date()}`),
        1000
    )
})

app.use(express.static('client'));

server.listen(PORT);
console.log(`Listening on port ${PORT}`);
