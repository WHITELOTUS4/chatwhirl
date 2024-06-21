const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const isHttps = process.env.HTTPS === 'true';
// Load SSL certificates if HTTPS is enabled
let server;
// if (isHttps) {
//     const options = {
//         key: fs.readFileSync('key.pem'),
//         cert: fs.readFileSync('cert.pem')
//     };
//     server = https.createServer(options, app);
// } else {
    server = http.createServer(app);
// }

const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/image',express.static(path.join(__dirname,'image')));
app.use('/public',express.static(path.join(__dirname,'public')));

app.use((req,res,next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.connection.remoteAddress || null;
    if(ip.includes('::ffff:')){
        ip = ip.split('::ffff:')[1];
    }
    if(ip=='::1'){
        ip = "127.0.0.1:"+PORT;
    }
    req.userIp = ip;
    next();
});

app.get('/', (req, res) => {
    res.render('joinchat',{ip: req.userIp});
});

app.get('/chat', (req, res) => {
    const { key } = req.query;
    if (!key) {
        return res.redirect('/');
    }
    let roomName = "White Chat";
    res.render('chat', { key , roomName});
});

app.get('*', (req, res) => {
    res.status(404).render('notfound');
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (key) => {
        socket.join(key);
        console.log(`User joined room: ${key}`);
    });

    socket.on('message', ({ key, message }) => {
        io.to(key).emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, (err) => {
    if(err) console.log("Oops an error occure:  "+err);
    console.log(`Compiled successfully!\n\nYou can now view ./${path.basename(__filename)} in the browser.`);
    console.info(`\thttp://localhost:${PORT}`);
    console.log("\nNode web compiled!\n");
});
