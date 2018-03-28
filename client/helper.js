
// const leftHand = document.getElementById('left_hand');
// const rightHand = document.getElementById('right_hand');
// var ws = new WebSocket('ws://' + window.location.host);

let data = {};
let allEventTypes = [ 'triggerdown', 'triggerup', 'gripdown', 'gripup'];
let leftEventTypes = ['xbuttontouchstart', 'xbuttontouchend'];
let rightEventTypes = ['abuttontouchstart', 'abuttontouchend'];
let registerEventListener = function(eventTypes, hand) {
    for (let i = 0; i < eventTypes.length; i++) {
        let eventType = eventTypes[i];
        hand.addEventListener(eventType, (event) => {
            data = {};
            let handId = event['target']['id'];
            // data[eventType] = {};
            data['eventType'] = eventType;
            data['handId'] = handId;
            data['position'] = hand.getAttribute('position');
            data['rotation'] = hand.getAttribute('rotation');
            //console.log('JSON.stringify(data): ',JSON.stringify(data));
            //ws.send(JSON.stringify(data));
        });
    }
}
ws.onopen = function () {
    ws.send('HELPER_WS');
    registerEventListener(allEventTypes, leftHand);
    registerEventListener(allEventTypes, rightHand);
    registerEventListener(leftEventTypes, leftHand);
    registerEventListener(rightEventTypes, rightHand);

    setInterval(() => {
        // data['handId'] = 'left_hand';
        // data['position'] = leftHand.getAttribute('position');
        // data['rotation'] = leftHand.getAttribute('rotation');
        // console.log('position: ', data['position']);
        // console.log('rotation: ', data['rotation']);
        // ws.send(JSON.stringify(data));
        data['handId'] = 'right_hand';
        data['position'] = rightHand.getAttribute('position');
        data['rotation'] = rightHand.getAttribute('rotation');
        //console.log('position: ', data['position']);
        //console.log('rotation: ', data['rotation']);
        // ws.send(JSON.stringify(data));
    }, 2000)

}

ws.onmessage = function (ev) {
    // console.log(ev);
}
