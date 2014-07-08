/* =========================================================================
 *
 * pub.js 
 *  publishes messages
 *
 * ========================================================================= */
var colors = require('colors');
var amqp = require('amqp');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (var i = 0; i < 16; i++) {
        cluster.fork();
    }
} else {
    var connection = amqp.createConnection({ host: 'localhost' });
    connection.on('error', function(err) {
        if((err+'').match('socket is closed')){
            console.log('Could not connect to AMQP (rabbitmq-server is not running)');
        }
        console.log('Error: ' + (err+'').red);
    });

    connection.on('ready', function(err) {
        //catch redis errors so server doesn't blow up
        console.log('AMQP Server connection established!'.green);

        setInterval(function(){
            connection.publish(
                'pubsub',
                { message: "Hello", token: "test" }, 
                { contentType: 'application/json', contentEncoding: 'utf-8' }
            );
        });
    });
}
