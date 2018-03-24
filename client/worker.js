let ws = new WebSocket('ws://' + window.location.host);

ws.onopen = function () {
    ws.send('WORKER_WS');
    setInterval(() => {
        // ws.send(JSON.stringify())
    }, 100)
}

ws.onmessage = function (ev) {
    // console.log(ev);
}