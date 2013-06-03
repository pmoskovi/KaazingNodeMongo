// Keep everything in anonymous function, called on window load.
// if(window.addEventListener) {
// window.addEventListener('load', function doDraw() {
  var canvas, context, tool;

  // Variables you can change
  //
  var MY_WEBSOCKET_URL = "ws://tutorial.kaazing.com/jms";
  var TOPIC_NAME = "/topic/drawTopic";
  var IN_DEBUG_MODE = true;
  var DEBUG_TO_SCREEN = false;

  var MESSAGE_PROPERTIES = {
    "userId": "USERID"
  };

  var userId = Math.random(100000).toString();
  var recording = false;

  // WebSocket and JMS variables
  //
  var connection;
  var session;
  var wsUrl;

  var WEBSOCKET_URL = "ws://" + window.location.hostname + ((window.location.port === '') ? '' : ':' + window.location.port) + "/jms";

  // Variable for log messages
  //
  var screenMsg = "";

  var clearScreen = function () {
    canvas.width = canvas.width;
  };

  var toggleRecording = function () {
    var recButton = document.getElementById('recordButton');
    var msg;
    if (!recording) {
      msg = session.createTextMessage('control:startRecording');
      doSend(msg);
      recButton.innerHTML='Stop Recording...';
      recButton.style.background='orange';
      recording = true;   
    } else {      
      msg = session.createTextMessage('control:stopRecording');
      doSend(msg);
      recButton.innerHTML='Start Recording';
      recButton.style.background='none';
      recording = false;
    }
  };

  var playBack = function(speed) {
    var msg;
    speed = (speed <= 5) ? speed/10 : speed-5;
    msg = session.createTextMessage('control:playBack:' + speed);
    doSend(msg);
  };

  var eraseDB = function() {
    var msg;
    msg = session.createTextMessage('control:deleteRecording');
    doSend(msg);
  };

  var trimColon = function(text)
  {
    return text.toString().replace(/^(.*?):*$/, '$1');
  }; 

// Used for development and debugging. All logging can be turned
// off by modifying this function.
//
var consoleLog = function(text) {
  if (IN_DEBUG_MODE) {
    if (DEBUG_TO_SCREEN) {
            // Logging to the screen
            screenMsg = screenMsg + text + "<br>";
            $("#logMsgs").html(screenMsg);
          } else {
            // Logging to the browser console
            console.log(text);
          }
        }
      };

      var handleException = function (e) {
        consoleLog("EXCEPTION: " + e);
      };

      var handleTopicMessage = function(message) {
        if (message.getStringProperty(MESSAGE_PROPERTIES.userId) != userId) {
          var _x, _y, _mouseState, _timeStamp, _msg;
          _msg = (trimColon (message.getText())).split(':');
          if (_msg[0] != 'control') {
            _x = _msg[0];
            _y = _msg[1];
            _mouseState = _msg[2];
            _timeStamp = _msg[3];
            context.lineWidth = 5;
            context.strokeStyle = 'yellow';
            switch (_mouseState) {
              case "mousedown" :
              context.beginPath();
              context.moveTo(_x, _y);
              break;
              case "mousemove" :
              context.lineTo(_x, _y);
              context.stroke();
              break;
            }
          }  
        }
      };

      var doSend = function(message) {
        message.setStringProperty(MESSAGE_PROPERTIES.userId, userId);
        topicProducer.send(null, message, DeliveryMode.NON_PERSISTENT, 3, 1, function() {
        //yourCallBack();
      });
        consoleLog("Message sent: " + message.getText());
      };

// Connecting...
//
var doConnect = function() {
    // Connect to JMS, create a session and start it.
    //
    var stompConnectionFactory = new StompConnectionFactory(WEBSOCKET_URL);
    try {
      var connectionFuture = stompConnectionFactory.createConnection(function() {
        if (!connectionFuture.exception) {
          try {
            connection = connectionFuture.getValue();
            connection.setExceptionListener(handleException);

            consoleLog("Connected to " + WEBSOCKET_URL);
            session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
            consoleLog("JMS session created");
            canvas.style.background = "#444";
            var myTopic = session.createTopic(TOPIC_NAME);
            consoleLog("Topic created...");
            topicProducer = session.createProducer(myTopic);
            consoleLog("Topic producer created...");
            topicConsumer = session.createConsumer(myTopic);
            consoleLog("Topic consumer created...");

            topicConsumer.setMessageListener(handleTopicMessage);

            connection.start(function() {
                        // Put any callback logic here.
                        //
                      });
          } catch (e) {
            handleException(e);
          }
        } else {
          handleException(connectionFuture.exception);
        }
      });
} catch (e) {
  handleException(e);
}
};

function init () {
  doConnect();

    // Find the canvas element.
    canvas = document.getElementById('imageView');
    if (!canvas) {
      alert('Error: I cannot find the canvas element!');
      return;
    }
    canvas.onselectstart = function () { return false; } // ie
    canvas.onmousedown = function () { return false; } // mozilla

    if (!canvas.getContext) {
      alert('Error: no canvas.getContext!');
      return;
    }

    // Get the 2D canvas context.
    context = canvas.getContext('2d');
    if (!context) {
      alert('Error: failed to getContext!');
      return;
    }

    // Pencil tool instance.
    tool = new tool_pencil();

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener('mousedown', ev_canvas, false);
    canvas.addEventListener('mousemove', ev_canvas, false);
    canvas.addEventListener('mouseup',   ev_canvas, false);
  }

  // This painting tool works like a drawing pencil which tracks the mouse 
  // movements.
  function tool_pencil () {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
      context.beginPath();
      context.lineWidth = 5;
      context.strokeStyle = '#f00';
      context.moveTo(ev._x, ev._y);
      tool.started = true;
      canvas.style.cursor = 'pointer';
      var msg = session.createTextMessage(ev._x + ":" + ev._y + ":" + "mousedown" + ":" + (new Date()).getTime());
        // msg.setStringProperty (MESSAGE_PROPERTIES.mouseState, "mousedown");
        doSend(msg);
      };

    // This function is called every time you move the mouse. Obviously, it only 
    // draws if the tool.started state is set to true (when you are holding down 
    // the mouse button).
this.mousemove = function (ev) {
  if (tool.started) {
    context.lineTo(ev._x, ev._y);
    context.stroke();
    // console.log (ev._x, ev._y, Date());
    var msg = session.createTextMessage(ev._x + ":" + ev._y + ":" + "mousemove" + ":" + (new Date()).getTime());
        // msg.setStringProperty (MESSAGE_PROPERTIES.mouseState, "mousemove");
        doSend(msg);
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        canvas.style.cursor = 'default';
      }
    };
  }

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  function ev_canvas (ev) {
    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  init();

// }, false); }

// var doDrawObj = new doDraw();