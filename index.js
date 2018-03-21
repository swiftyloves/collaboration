const express = require('express');
const app = express();
const http = require('http')
const WebSocket = require('ws')

const PORT = 3000;

const server = http.createServer(app)
const wss = new WebSocket.Server({server})

wss.on('connection', function (ws) {
    ws.on('message', (message) => {
        console.log(typeof(message))
        message = JSON.parse(message)
        console.log(message['x'])
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
