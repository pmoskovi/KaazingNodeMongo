var config = require('../conf/config.js');
var RSVP = require('rsvp');
var stomp = require('stomp');

'use strict';

var gateway = {
	connectToKaazing : function (callback) {
		var promise = new RSVP.Promise();
		gateway.client = new stomp.Stomp(config.stomp_args);
		gateway.client.on('connected', function() {
			console.log('Connected to message broker...');
			gateway.initPromise.resolve();
			if (callback)
				callback();
		});
		gateway.client.on('error', function(error_frame) {
			console.log(error_frame.body);
			gateway.client.disconnect();
		});
		process.on('SIGINT', function() {
			console.log('closing gw connection.');
			gateway.client.disconnect();
		});
		gateway.client.connect();
		gateway.initPromise = promise;
		return gateway.initPromise;
	},
	addMessageListener: function(destination,callback){
		var gateway = this;
		if (!gateway.initPromise)
			throw Error('call init function first');
		gateway.initPromise.then(function(){
			try {
				var headers = {
					destination: destination,
					ack: 'auto'
				//    'activemq.prefetchSize': '10'
				};
				gateway.client.subscribe(headers, callback);
				console.log('listening on ',destination);
			} catch(e) {
				console.log(e);
			}
		});
	},
	send: function(destination,message){
		message = (typeof message === "string" ? message : JSON.stringify(message));
		var gateway = this;
		if (!gateway.initPromise)
			throw Error('call init function first');
		gateway.initPromise.then(function(){
			try {
				 gateway.client.send({
					'destination': destination,
					'body': message
//					'persistent': 'true'
				});
				console.log('message sent:',destination,message);
			} catch(e){
				console.log(e);
			}
		});
	}
};

module.exports = gateway;