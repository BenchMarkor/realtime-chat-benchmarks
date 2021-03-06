/* =========================================================================
 * 
 * server-simple.js
 *  Simple express - eventsource server
 *
 *  ======================================================================== */
var express = require('express');
var winston = require('winston');
var expressWinston = require('express-winston');
var compression = require('compression');
var colors = require('colors');
var http = require('http');

var totalClients = 0;


var port = process.argv[2] || 8010;

http.globalAgent.maxSockets = 10000;
 


function format (val){
    return Math.round(((val / 1024 / 1024) * 1000) / 1000) + 'mb';
}

var statsId = setInterval(function () {
    console.log('Memory Usage :: '.bold.green.inverse +
        ("\tRSS: " + format(process.memoryUsage().rss)).blue +
        ("\tHeap Total: " + format(process.memoryUsage().heapTotal)).yellow +
        ("\tHeap Used: " + format(process.memoryUsage().heapUsed)).magenta +
        ("\t\tNr Clients: " + (""+totalClients).white)
    );

    
    console.log("http.globalAgent", http.globalAgent.sockets);

}, 1500);


console.log('Server starting...');

// Setup routes
var app = express();

// App config
app.set('showStackError', true);
app.locals.pretty = true;

//// CORs support
app.use(compression());
app.use(function(req, res, next){
    // Enable CORs support
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    // use utf8 encoding
    res.charset = 'utf-8';
    next();
});


// Log requests
var routeLogTransports = 
app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: false, colorize: true
        })
    ],
    meta: true,
    level: 'verbose'
}));
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname); 

// --------------------------------------
//
// App routes
//
// --------------------------------------
app.get('/', function routeHome(req, res){
    return res.render('html-client.html');
});


var id = 0;



app.get('/eventsource', function routeEventsource(req, res, next){
    //console.log('>> EventSource connected');
    totalClients++;
    var color = "hello";
    req.socket.setTimeout(Infinity);
    //req.socket.setNoDelay(true);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write("retry: 10000\n");
    //res.write("event: hello\n");
    res.write('data: START SENDING\n\n');

    
    id++;

    var sendMessages = setInterval(function(){
        id++;
        res.write('id: '+(id)+' \n');
        res.write("retry: 100000\n");
        //res.write("event: hello\n");
        res.write('data: ERSTE NACHRICHT\n\n');

        // id++;
        
        // res.write('id: '+(id)+' \n');
        // res.write("retry: 1000\n");
        // res.write("event: room-1\n");
        // res.write('data: ZWEITE NACHRICHT\n\n');

    }, 1000);

    




    // If the client disconnects, let's not leak any resources
    res.on('close', function() {
        console.log('[x] Res disconnected!');
        totalClients--;
        clearInterval(sendMessages);
    });

    

});

// Then, handle missing pages
// ----------------------------------
app.use(function handleError(err, req, res, next){
    winston.error('(in handleError) Error with request: ' + req.url + ' | ' + err, {
        error: err
    });
    // Don't set status for cloudfront
    return res.send(500, err+'');
});

// Finally, handle any errors
// -----------------------------------
app.use(function handleMissingPage(req, res, next){
    winston.error('Invalid page requested: ' + req.url);
    res.send(404, 'Invalid page');
});
console.log("Running on port: ", port);
var server = app.listen(port);
