var gateway = require('../lib/gateway');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var destination = '/topic/drawTopic';
var recording = false;
var drawArr = [];
var speed;

var trimColon = function(text)
{
    return text.toString().replace(/^(.*?):*$/, '$1');
}

gateway.connectToKaazing();

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
    if (!err) {
        gateway.addMessageListener(destination, function(body, headers) {
            var msg = trimColon(body[0]).split(":");
            if (msg[0] === 'control') {
                switch (msg[1]) {
                    case 'startRecording':
                    console.log ("startRecording");
                    recording = true;
                    break;
                    case 'stopRecording':
                    console.log ("stopRecording");
                    recording = false;
                    break;
                    case 'playBack':
                    speed = msg[2];
                    console.log ("playBack with speed: " + speed);
                    doPlayBack (db, playBack);
                    break;
                    case 'deleteRecording':
                    console.log ("deleteRecording");
                    deleteRecording (db);
                    break;
                }
            }
            else if (recording) {
                doRecord (db, msg);
            }
        });
    }
});    

var doRecord = function (db, point) {
    db.collection("draw").insert({
        x : point[0],
        y : point[1],
        mouseState : point[2],
        timeStamp : new Date().getTime()
    }, function(err, inserted) {
        if (err) {
            console.log("Error inserting: " + err);
        }
    });
};

var doPlayBack = function (db, callback) {
    drawArr = [];
    db.collection("draw", function (err, collection) {
        collection.find({}, function (err, points) {
            points.each(function(err, point) {
                if (point) {
                    drawArr.push({
                        msg : point.x + ':' + point.y + ':' + point.mouseState, 
                        timeStamp : point.timeStamp
                    });
                }
                else {
                    callback();
                }
            });
        });
    });
};

var playBack = function() {
    var delay = 0;
    drawArr.sort(function (a,b) {
        return a.timeStamp - b.timeStamp;
    });
    for (var i=0; i<drawArr.length; i++) {
        setTimeout (function (n) {
            gateway.send('/topic/drawTopic', drawArr[n].msg + ':' + drawArr[n].timeStamp);
        }, delay, i);
        delay = delay + ((i === 0) ? 0 : drawArr[i].timeStamp - drawArr[i-1].timeStamp) / speed;
    }            
};

var deleteRecording = function (db) {
    db.collection("draw", function (err, collection) {
        collection.remove({}, function (err, points) {});
    });
};
