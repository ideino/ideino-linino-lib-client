/*	
*	Ideino is based on Noide project by Dave Stone https://github.com/davidjamesstone/noide. 
*	Ideino https://github.com/ideino/ideino-linino is released under the MIT License:
*	
*   Copyright (C) 2014 by Ideino
*
*/

/***
 * file: ideino-linino-lib-client.js
 * authors: https://github.com/sebba,
 *			https://github.com/quasto
 ***/
 
var socket,
	port = '9812',
	isConnected=false,
	layout;

function connect(host)
{
	var url = 'http://' + host + ':' + port;
	socket = io.connect(url,{ rememberTransport: false, transports: ['xhr-polling']});
	socket.on('connect', function(){
		console.log("Connected");
		isConnected = socket.socket.connected;
		getLayout();
		socket.on('disconnect', function(){
			console.log("Disconnect ");
			isConnected = socket.socket.connected;
		});
	});
	socket.on('command', function(msg){
		Object.keys(msg.command).forEach(function(key) {
			var command = msg.command[key];
			if(command.cmd == 'read')
			{
				switch(command.id)
				{
					case "GEO": 
						navigator.geolocation.getCurrentPosition(function(position) {
						var lat = position.coords.latitude;
						var lon = position.coords.longitude;
						
						var json_response = {value: lat+";"+lon};
						socket.emit('read-back-' + command.id + '-' + command.param, json_response);
						});
						break;	
					case "DEVO": 
						if (window.DeviceOrientationEvent) {
						  console.log("Device orientation supported");
						  window.addEventListener('deviceorientation', function(orientation) {
							var response;
							var LR = orientation.gamma;
							var FB = orientation.beta;
							var dir = orientation.alpha

							if(command.param == "LR")
								response = LR;
							if(command.param == "FB")
								response = FB;
							if(command.param == "dir")
								response = dir;							
							
							var json_response = {value: response};
							socket.emit('read-back-' + command.id + '-' + command.param, json_response);
						  }, false);
						} else {
						  console.log("Device orientation NOT supported");
						}
						break;	
					case "LIGHT": 
						window.addEventListener('devicelight', function(light) {
							var lightLevel = light.value;
							var json_response = {value: lightLevel};
							socket.emit('read-back-' + command.id + '-' + command.param, json_response);
						});
						break;
					case "PROX": 
					window.addEventListener('deviceproximity', function(event) {
						var max = event.max;
						var min = event.min;
						var proximity = event.value;
						
						var json_response = {value: "min "+min+"- proximity : "+proximity+" - max : "+max};
						socket.emit('read-back-' + command.id + '-' + command.param, json_response);
					});
						break; 
					case "BATTERY": 
							if(window.navigator.battery|| window.navigator.mozBattery)
							{
								var	response = window.navigator.battery.level * 100 + "%";
								var	json_response = {value : response};
								socket.emit('read-back-' + command.id + '-' + command.param, json_response);
								window.navigator.battery.onlevelchange = function(){								
											response = window.navigator.battery.level * 100 + "%";
											json_response = {value : response};
											socket.emit('read-back-' + command.id + '-' + command.param, json_response);
										 }
							}
							else if(navigator.getBattery())
								{
									navigator.getBattery().then(function(battery){	
										var response = battery.level * 100 + "%";
										var json_response = {value : response};
										socket.emit('read-back-' + command.id + '-' + command.param, json_response);
										battery.onlevelchange = function(){								
											response = battery.level * 100 + "%";
											json_response = {value : response};
											socket.emit('read-back-' + command.id + '-' + command.param, json_response);
										 }
									})
								}				
							else 
								console.log("Battery Status API is not available");
						break;
					default :
						var response = document.getElementById(command.id).getAttribute(command.param);
						var json_response = {value: response};
						socket.emit('read-back-' + command.id + '-' + command.param, json_response);
				}
			}
			else if(command.cmd == 'write')
				switch(command.id)
				{
					case "VIBRO":
						navigator.vibrate(command.value);
						break;
					default:
						try
						{ 
							document.getElementById(command.id).setAttribute(command.param , command.value);
						}
						catch(error)
						{
							console.log(error);
						}
				}
				
		});
	});
	socket.on('write', function(msg){
		Object.keys(msg.command).forEach(function(key) {
			var command = msg.command[key];
			if(command.cmd == 'write')
				document.getElementById(command.id).value = command.value;
		});
	});
}



function digitalRead(pin, callback){
	if(isConnected)
	{
		var tPin = testPin(layout, pin);
		if(typeof tPin !== 'undefined')
		{
			var json_message = { command :[{func:"dr", pin:tPin}]};
			socket.emit('command',json_message);
			socket.removeAllListeners('read-back-'+tPin);
			socket.on('read-back-'+tPin, function(data){
				callback(data);
			});

		}
	}
	else
		console.log('No connection revealed');
}
function digitalWrite(pin, value){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin !== 'undefined')
		{		
			var json_message = { command :[{func:"dw", pin:tPin, value:value}]};
			socket.emit('command',json_message);
		}
	}
	else
		console.log('No connection revealed');
}
function analogRead(pin, callback){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin !== 'undefined')
		{		
			var json_message = { command :[{func:"ar", pin:tPin}]};
			socket.emit('command',json_message);
			socket.removeAllListeners('read-back-'+tPin);
			socket.on('read-back-'+tPin, function(data){
				callback(data);
			});
		}
	}
	else
		console.log('No connection revealed');
}
function analogWrite(pin, value){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin !== 'undefined')
		{		
			var json_message = { command :[{func:"aw",pin:tPin, value: value}]};
			socket.emit('command',json_message);
		}
	}
	else
		console.log('No connection revealed');
}
function servoWrite(pin, angle){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		var tAngle = isNaN(angle); 
		if(typeof tPin !== 'undefined')
		{		
			if(!tAngle)
			{
				var json_message = { command :[{func:"sw",pin:tPin, value: angle}]};
				socket.emit('command',json_message);
			}
			else
				console.log('Error found in angle value');
		}
	}
	else
		console.log('No connection revealed');
}
function virtualRead(pin){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin !== 'undefined')
		{		
			var json_message = { command :[{func:"vr", pin:tPin}]};
			socket.emit('command',json_message);
			socket.removeAllListeners('read-back-'+tPin);
			socket.on('read-back-'+tPin, function(data){
				callback(data);
			});
		}
	}
	else
		console.log('No connection revealed');
}
function virtualWrite(pin, value){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		var tValue = isNaN(value); 
		if(typeof tPin !== 'undefined')
		{		
			if(!tAngle)
			{
				var json_message = { command :[{func:"vw",pin:tPin, value: tValue}]};
				socket.emit('command',json_message);
			}
			else
				console.log('Error found in insert value');
		}
	}
	else
		console.log('No connection revealed');
}
function pinMode(pin, mode){
	if(isConnected)
	{
		var tPin = testPin(layout, pin);
		var tMode = testMode(mode);
		if(typeof tPin !== 'undefined' && typeof tMode !== 'undefined')
		{		
			var json_message = {command : [{func: "pm",pin: tPin, mode: tMode}] };
			socket.emit('command',json_message);
		}
	}
	else
		console.log('No connection revealed');
}

function getLayout(){
	if(isConnected)
	{
		socket.emit('info', { info : "layout"});
		socket.on('info-back-layout', function(data){
			layout = data.value;
		});
	}
	else
		console.log('No connection revealed');
}
function testMode(mode){
	mode = mode.toUpperCase();
	
	if(mode == 'INPUT' || mode == 'OUTPUT' || mode == 'PWM' || mode == 'SERVO' )
		return mode;
	else
	{
		console.log('Wrong pin mode');
		return ;
	}
}
function testPin(obj, val){
	val = val.toUpperCase();
    for(var prop in obj) 
	{
        if(obj.hasOwnProperty(prop) && obj[prop].hasOwnProperty(val)) 
		{
			return val;   
        }
    }
	return ;
}

function writeData(id, param, value){
	
	if(isConnected)
	{	var json_message = {id:	id, 
							param:	param, 
							value:	value
							};
		socket.emit('read-back-' + id + '-' + param, json_message);
	}
}
function tone(pin, freq, duration){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin !== 'undefined')
		{		
			var json_message = { command :[{func:"tn", pin:tPin, frequency:freq, duration: duration}]};
            socket.emit('command',json_message);
		}
	}
	else
		console.log('No connection revealed');
}
function noTone(pin){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin !== 'undefined')
		{		
			var json_message = { command :[{func:"ntn", pin:tPin}]};
			socket.emit('command',json_message);
		}
	}
	else
		console.log('No connection revealed');
}
function analogWritens(pin, value, period){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin !== 'undefined')
		{		
			var json_message = { command :[{func:"awn",pin:tPin, value: value, period: period}]};
			socket.emit('command',json_message);
		}
	}
	else
		console.log('No connection revealed');
}
function blink(delay, duration, pin){
	if(isConnected)
	{
		var tPin = testPin(layout,pin);
		if(typeof tPin == 'undefined')
		{		
            tPin = 'D13'
		}
        var json_message = { command :[{func:"bl", pin:tPin, duration: duration, delay: delay}]};
        socket.emit('command',json_message);
	}
	else
		console.log('No connection revealed');
}