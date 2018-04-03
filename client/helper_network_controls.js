var ws = new WebSocket('ws://' + window.location.host);
ws.onopen = function () {
    ws.send('HELPER_WS');
};

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

var GAMEPAD_ID_PREFIX = 'Oculus Touch';

var PIVOT_OFFSET = {x: 0, y: -0.015, z: 0.04};

registerComponent('remote-oculus-camera', {
  init: function() {
    setInterval(() => {
        ws.send(JSON.stringify({type:'camera', data: {
          position:this.el.getAttribute('position'),
          rotation:this.el.getAttribute('rotation')
        }}));
    }, 50);
  }
});

/**
 * Oculus Touch controls.
 * Interface with Oculus Touch controllers and map Gamepad events to
 * controller buttons: thumbstick, trigger, grip, xbutton, ybutton, surface
 * Load a controller model and highlight the pressed buttons.
 */
registerComponent('remote-oculus-touch-controls', {
  schema: {
    hand: {default: 'left'},
    buttonColor: {type: 'color', default: '#999'},  // Off-white.
    buttonTouchColor: {type: 'color', default: '#8AB'},
    buttonHighlightColor: {type: 'color', default: '#2DF'},  // Light blue.
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

  bindMethods: function () {
    this.onControllersUpdate = bind(this.onControllersUpdate, this);
    this.checkIfControllerPresent = bind(this.checkIfControllerPresent, this);
    this.onAxisMoved = bind(this.onAxisMoved, this);
  },

  init: function () {
    var self = this;
    this.onButtonChanged = bind(this.onButtonChanged, this);
    this.onButtonDown = function (evt) { onButtonEvent(evt.detail.id, 'down', self, self.data.hand); };
    this.onButtonUp = function (evt) { onButtonEvent(evt.detail.id, 'up', self, self.data.hand); };
    this.onButtonTouchStart = function (evt) { onButtonEvent(evt.detail.id, 'touchstart', self, self.data.hand); };
    this.onButtonTouchEnd = function (evt) { onButtonEvent(evt.detail.id, 'touchend', self, self.data.hand); };
    this.controllerPresent = false;
    this.lastControllerCheck = 0;
    this.previousButtonValues = {};
    this.bindMethods();

    // Allow mock.
    this.emitIfAxesChanged = emitIfAxesChanged;
    this.checkControllerPresentAndSetup = checkControllerPresentAndSetup;
    setInterval(() => {
        this.emitOverWebsocket('base', {
          position:this.el.getAttribute('position'),
          rotation:this.el.getAttribute('rotation')
        });
    }, 30);

    //console.log('helper initialized');
    this.serverConnection = new WebSocket('ws://' + window.location.host);
    serverConnection = this.serverConnection;
    this.serverConnection.onmessage = bind(this.gotMessageFromServer, this);
    this.serverConnection.onopen =  () => {
        this.serverConnection.send('WORKER_WS');
        this.el.emit('controllerconnected', {name: this.name, component: this});
    }
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
        let hand = data.data.target;
        let position = data.data.position;
        let rotation = data.data.rotation;
        if (hand === 'left_hand') {
            leftHand.setAttribute('position', position);
            leftHand.setAttribute('rotation', rotation);
            //leftHand.flushToDOM();
        } else if (hand === "right_hand") {
            rightHand.setAttribute('position', position);
            rightHand.setAttribute('rotation', rotation);
        }
    }
  },

  addEventListeners: function () {
    var el = this.el;
    el.addEventListener('buttonchanged', this.onButtonChanged);
    el.addEventListener('buttondown', this.onButtonDown);
    el.addEventListener('buttonup', this.onButtonUp);
    el.addEventListener('touchstart', this.onButtonTouchStart);
    el.addEventListener('touchend', this.onButtonTouchEnd);
    el.addEventListener('axismove', this.onAxisMoved);
    this.controllerEventsActive = true;
  },

  removeEventListeners: function () {
    var el = this.el;
    el.removeEventListener('buttonchanged', this.onButtonChanged);
    el.removeEventListener('buttondown', this.onButtonDown);
    el.removeEventListener('buttonup', this.onButtonUp);
    el.removeEventListener('touchstart', this.onButtonTouchStart);
    el.removeEventListener('touchend', this.onButtonTouchEnd);
    el.removeEventListener('axismove', this.onAxisMoved);
    this.controllerEventsActive = false;
  },

  checkIfControllerPresent: function () {
    this.checkControllerPresentAndSetup(this, GAMEPAD_ID_PREFIX, {
      hand: this.data.hand
    });
  },

  play: function () {
    this.checkIfControllerPresent();
    this.addControllersUpdateListener();
  },

  pause: function () {
    this.removeEventListeners();
    this.removeControllersUpdateListener();
  },

  injectTrackedControls: function () {
    var data = this.data;
    var offset = data.hand === 'right' ? -90 : 90;
  },

  addControllersUpdateListener: function () {
    this.el.sceneEl.addEventListener('controllersupdated', this.onControllersUpdate, false);
  },

  removeControllersUpdateListener: function () {
    this.el.sceneEl.removeEventListener('controllersupdated', this.onControllersUpdate, false);
  },

  onControllersUpdate: function () {
    // Note that due to gamepadconnected event propagation issues, we don't rely on events.
    this.checkIfControllerPresent();
  },

  onButtonChanged: function (evt) {
    var button = this.mapping[this.data.hand].buttons[evt.detail.id];
    if(!button) { return; }
    // Pass along changed event with button state, using the buttom mapping for convenience.
    this.emitOverWebsocket(button + 'changed', evt.detail.state);
  },
  emitOverWebsocket(type, gestureData) {
    var target = this.el.id;
    if (gestureData) {
        let data = {};
        for (let key in gestureData) {
          data[key] = gestureData[key];
        }
        // data['position'] = this.el.getAttribute('position');
        // data['rotation'] = this.el.getAttribute('rotation');
        //console.log('data:', data);

        ws.send(JSON.stringify({type, data, target}));
    } else {
        ws.send(JSON.stringify({type, target}))
    }
  },

  onAxisMoved: function (evt) {
    this.emitIfAxesChanged(this, this.mapping[this.data.hand].axes, evt);
  }
});

var AXIS_LABELS = ['x', 'y', 'z', 'w'];
function emitIfAxesChanged (component, axesMapping, evt) {
  var axes;
  var buttonType;
  var changed;
  var detail;
  var j;

  for (buttonType in axesMapping) {
    axes = axesMapping[buttonType];

    changed = false;
    for (j = 0; j < axes.length; j++) {
      if (evt.detail.changed[axes[j]]) { changed = true; }
    }

    if (!changed) { continue; }

    // Axis has changed. Emit the specific moved event with axis values in detail.
    detail = {};
    for (j = 0; j < axes.length; j++) {
      detail[AXIS_LABELS[j]] = evt.detail.axis[axes[j]];
    }
    component.emitOverWebsocket(buttonType + 'moved', detail);
  }
};
function onButtonEvent (id, evtName, component, hand) {
  var mapping = hand ? component.mapping[hand] : component.mapping;
  var buttonName = mapping.buttons[id];
  component.emitOverWebsocket(buttonName + evtName);
};
function checkControllerPresentAndSetup(component, idPrefix, queryObject) {
  var el = component.el;
  var isPresent = isControllerPresent(component, idPrefix, queryObject);

  // If component was previously paused and now playing, re-add event listeners.
  // Handle the event listeners here since this helper method is control of calling
  // `.addEventListeners` and `.removeEventListeners`.
  if (component.controllerPresent && !component.controllerEventsActive) {
    component.addEventListeners();
  }

  // Nothing changed, no need to do anything.
  if (isPresent === component.controllerPresent) { return isPresent; }

  component.controllerPresent = isPresent;

  // Update controller presence.
  if (isPresent) {
    component.injectTrackedControls();
    component.addEventListeners();
    el.emit('controllerconnected', {name: component.name, component: component});
  } else {
    component.removeEventListeners();
    el.emit('controllerdisconnected', {name: component.name, component: component});
  }
};

function isControllerPresent (component, idPrefix, queryObject) {
  var gamepads;
  var sceneEl = component.el.sceneEl;
  var trackedControlsSystem;
  var filterControllerIndex = queryObject.index || 0;

  if (!idPrefix) { return false; }

  trackedControlsSystem = sceneEl && sceneEl.systems['tracked-controls'];
  if (!trackedControlsSystem) { return false; }

  gamepads = trackedControlsSystem.controllers;
  if (!gamepads.length) { return false; }

  return !!findMatchingController(gamepads, null, idPrefix, queryObject.hand,
                                  filterControllerIndex);
}

function findMatchingController (controllers, filterIdExact, filterIdPrefix, filterHand,
                                 filterControllerIndex) {
  var controller;
  var filterIdPrefixes;
  var i;
  var j;
  var matches;
  var matchingControllerOccurence = 0;
  var prefix;
  var targetControllerMatch = filterControllerIndex || 0;

  // Check whether multiple prefixes.
  if (filterIdPrefix && filterIdPrefix.indexOf('|') >= 0) {
    filterIdPrefixes = split(filterIdPrefix, '|');
  }

  for (i = 0; i < controllers.length; i++) {
    controller = controllers[i];

    // Determine if the controller ID matches our criteria.
    if (filterIdPrefixes) {
      matches = false;
      for (j = 0; j < filterIdPrefixes.length; j++) {
        prefix = filterIdPrefixes[j];
        if (prefix && controller.id.startsWith(prefix)) {
          matches = true;
          break;
        }
      }
      if (!matches) { continue; }
    } else if (filterIdPrefix && controller.id.indexOf(filterIdPrefix)) {
      continue;
    }

    if (!filterIdPrefix && controller.id !== filterIdExact) { continue; }

    // If the hand filter and controller handedness are defined we compare them.
    if (filterHand && controller.hand && filterHand !== controller.hand) { continue; }

    // If we have detected an unhanded controller and the component was asking
    // for a particular hand, we need to treat the controllers in the array as
    // pairs of controllers. This effectively means that we need to skip
    // NUM_HANDS matches for each controller number, instead of 1.
    if (filterHand && !controller.hand) {
      targetControllerMatch = NUM_HANDS * filterControllerIndex + ((filterHand === DEFAULT_HANDEDNESS) ? 0 : 1);
    }

    // We are looking for the nth occurence of a matching controller
    // (n equals targetControllerMatch).
    if (matchingControllerOccurence === targetControllerMatch) { return controller; }
    ++matchingControllerOccurence;
  }
  return undefined;
}
