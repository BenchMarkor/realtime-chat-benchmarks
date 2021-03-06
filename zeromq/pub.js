/* =========================================================================
 *
 * pub.js 
 *  sends messages. subs consume them
 *
 * ========================================================================= */
var zmq = require('zmq');
var colors = require('colors');

var socket = zmq.socket('pub');
var port = 'tcp://127.0.0.1:12345';

socket.identity = 'publisher' + process.pid;

var messagesSent = 0;

socket.bind(port, function(err) {
    console.log('bound!');

    while(true){
        socket.send('roomid: test');
    }
});
