var localVideo;
var localStream;
var remoteVideo;
var peerConnection;
var uuid;
var serverConnection;
var leftHand = document.getElementById('left_hand');
var rightHand = document.getElementById('right_hand');

leftHand.emit('controllerconnected', {name: 'manual'});
rightHand.emit('controllerconnected', {name: 'manual'});


var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.stunprotocol.org:3478'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ]
};

rightHand.visible = true;
leftHand.visible = true;

function pageReady() {
    uuid = createUUID();

    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    // serverConnection = new WebSocket('ws://' + window.location.host);
    // serverConnection.onmessage = gotMessageFromServer;
    // serverConnection.onopen = function () {
    //     serverConnection.send('WORKER_WS');
    // }

    var constraints = {
        video: true,
        audio: true,
    };

    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function getUserMediaSuccess(stream) {
  localStream = stream;
  if (localVideo) {
    localVideo.srcObject = stream;
  }
}

function start(isCaller) {
  console.log('start');
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.ontrack = gotRemoteStream;
    peerConnection.addStream(localStream);

    if(isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
}

function gotMessageFromServer(event) {
    if(!peerConnection) start(false);

    var data = JSON.parse(event.data);
    console.log('worker js event.data', data);
    if (data.signal) {
        var signal = JSON.parse(data['signal']);

        // Ignore messages from ourself
        if(signal.uuid == uuid) return;

        if(signal.sdp) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
                // Only create answers in response to offers
                if(signal.sdp.type == 'offer') {
                    peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
                }
            }).catch(errorHandler);
        } else if(signal.ice) {
            peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
        }
    }

    // Hand gesture
    console.log('hand gesture:');
    if (data.type) {
        console.log('data.data:',data.data);
        /*let handId = data['handId'];
        var position = data['position'];
        var rotation = data['rotation'];
        console.log(handId);
        console.log(position);
        console.log(rotation);
        if (handId === 'right_hand') {
            rightHand.setAttribute('position',  position);
            rightHand.setAttribute('rotation',  rotation);
        }*/
    }
}

function gotIceCandidate(event) {
  if(event.candidate != null) {
    serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
  }
}

function createdDescription(description) {
    console.log('got description');

    peerConnection.setLocalDescription(description).then(function() {
       serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
    }
}

function errorHandler(error) {
    console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
