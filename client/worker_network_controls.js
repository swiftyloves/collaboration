var ws = new WebSocket('ws://' + window.location.host);

var registerComponent = AFRAME.registerComponent;

function bind (fn, ctx/* , arg1, arg2 */) {
  return (function (prependedArgs) {
    return function bound () {
      // Concat the bound function arguments with those passed to original bind
      var args = prependedArgs.concat(Array.prototype.slice.call(arguments, 0));
      return fn.apply(ctx, args);
    };
  })(Array.prototype.slice.call(arguments, 2));
};

var TOUCH_CONTROLLER_MODEL_BASE_URL = 'https://cdn.aframe.io/controllers/oculus/oculus-touch-controller-';
var TOUCH_CONTROLLER_MODEL_OBJ_URL_L = TOUCH_CONTROLLER_MODEL_BASE_URL + 'left.obj';
var TOUCH_CONTROLLER_MODEL_OBJ_MTL_L = TOUCH_CONTROLLER_MODEL_BASE_URL + 'left.mtl';
var TOUCH_CONTROLLER_MODEL_OBJ_URL_R = TOUCH_CONTROLLER_MODEL_BASE_URL + 'right.obj';
var TOUCH_CONTROLLER_MODEL_OBJ_MTL_R = TOUCH_CONTROLLER_MODEL_BASE_URL + 'right.mtl';

var GAMEPAD_ID_PREFIX = 'Oculus Touch';

var PIVOT_OFFSET = {x: 0, y: -0.015, z: 0.04};

/**
 * Oculus Touch controls.
 * Interface with Oculus Touch controllers and map Gamepad events to
 * controller buttons: thumbstick, trigger, grip, xbutton, ybutton, surface
 * Load a controller model and highlight the pressed buttons.
 */

 // leftHand = document.getElementById('left_hand');
 // leftHand.setAttribute('position', "1 -1 3");
 // this.el.setAttribute('positoin', 'z', position.z);
 // leftHand.setAttribute('positoin', '0.199 -0.46 -0.3');
 // this.el.flushToDOM();
 // leftHand.flushToDOM();
 // console.log(leftHand);
 // console.log(this.el);
 // console.log(leftHand.getAttribute('position'));
 registerComponent('remote-oculus-camera-receiver', {
   init: function() {
     ws.addEventListener('message',(message) => {
       var data = JSON.parse(message.data);
       if(data.type === 'camera') {
         const {position, rotation} = data.data;
         if(this.el) {
           this.el.setAttribute('position', position);
           this.el.setAttribute('rotation', rotation);
         }
       }
     });
   }
 });

registerComponent('remote-oculus-touch-controls-receiver', {
  schema: {
    hand: {default: 'left'},
    buttonColor: {type: 'color', default: '#999'},  // Off-white.
    buttonTouchColor: {type: 'color', default: '#8AB'},
    buttonHighlightColor: {type: 'color', default: '#2DF'},  // Light blue.
    model: {default: false},
    rotationOffset: {default: 0}
  },

  /**
   * Button IDs:
   * 0 - thumbstick (which has separate axismove / thumbstickmoved events)
   * 1 - trigger (with analog value, which goes up to 1)
   * 2 - grip (with analog value, which goes up to 1)
   * 3 - X (left) or A (right)
   * 4 - Y (left) or B (right)
   * 5 - surface (touch only)
   */
  mapping: {
    left: {
      axes: {thumbstick: [0, 1]},
      buttons: ['thumbstick', 'trigger', 'grip', 'xbutton', 'ybutton', 'surface']
    },
    right: {
      axes: {thumbstick: [0, 1]},
      buttons: ['thumbstick', 'trigger', 'grip', 'abutton', 'bbutton', 'surface']
    }
  },

  init: function () {
    this.serverConnection = ws;
    serverConnection = this.serverConnection;
    this.serverConnection.addEventListener('message', bind(this.gotMessageFromServer, this));
    this.serverConnection.onopen =  () => {
        this.serverConnection.send('WORKER_WS');

        var data = this.data;
        var offset = data.hand === 'right' ? -90 : 90;
        this.el.setAttribute('tracked-controls', {
          id: data.hand === 'right' ? 'Oculus Touch (Right)' : 'Oculus Touch (Left)',
          controller: 0,
          rotationOffset: data.rotationOffset !== -999 ? data.rotationOffset : offset
        });
    }
    setTimeout(() => {
      this.el.emit('controllerconnected', {name: this.name, component: this});
    }, 500)
    this.el.addEventListener('changePosition', (evt) => {
        // var otherBox = document.querySelector('#otherbox');
      //console.log('changePosition~');
        // this.el.setAttribute('position', '-2 1 -3');
      //console.log('evt:', evt);
      //console.log('po:',this)
      //ani_pos = this.el.getElementsByClassName('position')[0];
      //ani_pos.setAttribute('from', ani_pos.getAttribute('to'));
    }, true)
    // this.updateControllerModel();
  },

  updateControllerModel: function () {
    var objUrl, mtlUrl;
    if (!this.data.model) { return; }
    if (this.data.hand === 'right') {
      // controller model
      objUrl = 'url(' + TOUCH_CONTROLLER_MODEL_OBJ_URL_R + ')';
      mtlUrl = 'url(' + TOUCH_CONTROLLER_MODEL_OBJ_MTL_R + ')';
    } else {
      objUrl = 'url(' + TOUCH_CONTROLLER_MODEL_OBJ_URL_L + ')';
      mtlUrl = 'url(' + TOUCH_CONTROLLER_MODEL_OBJ_MTL_L + ')';
    }
    this.el.setAttribute('obj-model', {obj: objUrl, mtl: mtlUrl});
  },

  gotMessageFromServer (message) {
    if(!peerConnection) start(false);

    var data = JSON.parse(message.data);
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
    if (data.type && data.data) {
        // console.log('data.data:',data.data);
        if (!data.data) {
          console.log('!data.data: ', data);
          // break;
        }
        let hand = data.data.target;
        let position = data.data.position;
        let rotation = data.data.rotation;

        let handEl = (hand==='left_hand') ? leftHand : rightHand;
        handEl.setAttribute('position', position);
        handEl.setAttribute('rotation', rotation);
    }
  }

});
