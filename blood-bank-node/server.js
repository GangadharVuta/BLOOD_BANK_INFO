/****************************
 SERVER MAIN FILE
 ****************************/

// Include Modules
let exp = require('express');
let path = require('path');
let http = require('http');

let config = require('./configs/configs');
let express = require('./configs/express');
let mongoose = require('./configs/mongoose');
let initializeSocket = require('./configs/socket');

global.appRoot = path.resolve(__dirname);

db = mongoose();
const app = express();

// Create HTTP server from Express app for Socket.io
const httpServer = http.createServer(app);

// Initialize Socket.io for real-time chat
const io = initializeSocket(httpServer);

// Attach io to app for access in other files
app.io = io;

app.get('/', function (req, res, next) {
    res.send('hello world');
});

/* Old path for serving public folder */
app.use('/public', exp.static(__dirname + '/public'));

// Listening Server
httpServer.listen(parseInt(config.serverPort), async () => {
    console.log('process.env.NODE_ENV', process.env.NODE_ENV);
    console.log(`Server running at http://localhost:${config.serverPort}`);
    console.log('Socket.io server is ready for connections');
});
