let ws = new WebSocket('ws://' + window.location.host);

ws.onopen = function () {
    ws.send('WORKER_WS');
}

ws.onmessage = function (ev) {
    // console.log(ev);
}