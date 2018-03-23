
const leftHand = document.getElementById('left_hand');
const rightHand = document.getElementById('right_hand');
let ws = new WebSocket('ws://' + window.location.host);

let data = {};
let allEventTypes = [ 'triggerdown', 'triggerup', 'gripdown', 'gripup'];
let leftEventTypes = ['xbuttontouchstart', 'xbuttontouchend'];
let rightEventTypes = ['abuttontouchstart', 'abuttontouchend'];
let registerEventListener = function(eventTypes, hand) {
    for (let i = 0; i < eventTypes.length; i++) {
        let eventType = eventTypes[i];
        hand.addEventListener(eventType, (event) => {
            data = {};
            let hand_id = event['target']['id'];
            data[eventType] = {};
            data[eventType]['hand_id'] = hand_id;
            data['position'] = hand.getAttribute('position');
            data['rotation'] = hand.getAttribute('position');
            //console.log('JSON.stringify(data): ',JSON.stringify(data));
            //ws.send(JSON.stringify(data));
        });
    }
}
ws.onopen = function () {
    ws.send('I AM THE HELPER');
    registerEventListener(allEventTypes, leftHand);
    registerEventListener(allEventTypes, rightHand);
    registerEventListener(leftEventTypes, leftHand);
    registerEventListener(rightEventTypes, rightHand);

    setInterval(() => {
        data['position'] = leftHand.getAttribute('position');
        data['rotation'] = leftHand.getAttribute('rotation');
        //console.log('position: ', data['position']);
        //console.log('rotation: ', data['rotation']);
        // ws.send(JSON.stringify(data));
    }, 2000)

}

ws.onmessage = function (ev) {
    // console.log(ev);
}