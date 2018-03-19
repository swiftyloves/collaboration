const express = require('express');
const app = express();
const http = require('http')
const WebSocket = require('ws')

const server = http.createServer(app)
const wss = new WebSocket.Server({server})
server.listen(3000)

wss.on('connection', function (ws) {
    ws.on('message', (message) => {
        console.log('received: %s', message)
    })
    ws.on('close', () => clearInterval(intervalId))

    let intervalId = setInterval(
        () => ws.send(`${new Date()}`),
        1000
    )
})

app.use(express.static('client'));