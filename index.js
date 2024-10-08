const express = require('express');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();

const app = express();
const APPName = "Chat Whirl";
const UserName = "Krish";
const server = http.createServer(app);

const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/image',express.static(path.join(__dirname,'image')));
app.use('/public',express.static(path.join(__dirname,'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    try{
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.connection.remoteAddress || null;
        if(ip.includes('::ffff:')){
            ip = ip.split('::ffff:')[1];
        }
        if(ip=='::1'){
            ip = "127.0.0.1:"+PORT;
        }
        req.userIp = ip;
    }catch(e){
        console.log("Error to execute middleware!");
    }
    next();
});

app.get('/', (req, res) => {
    res.redirect('/join');
});

app.get('/create', (req, res) => {
    res.render('creatchat',{ip: req.userIp, APPName, UserName});
});

app.get('/join', (req, res) => {
    res.render('joinchat',{ip: req.userIp, APPName, UserName});
});

app.get('/chat', (req, res) => {
    const { key } = req.query;
    if(!key){
        return res.redirect('/');
    }
    const requirements = [
		{regex: /.{7,}/, index: 0},
		{regex: /[0-9]/, index: 1},
		{regex: /[a-z]/, index: 2},
		{regex: /[A-Z]/, index: 3}
	];
    let requirementItem=0;
	requirements.forEach((item)=>{
		let isValid = item.regex.test(key);
		if(isValid){
			requirementItem++;	
		}
	});
    if(requirementItem >= requirements.length && key.length<=7 && key.length>=5){
        let roomName = APPName;
        res.render('chat', { key , roomName});
    }else{
        return res.redirect('*');
    }
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
        console.log('A user message ',message);
        io.to(key).emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, (err) => {
    if(err) console.log("Oops an error occure:  "+err);
    console.log(`Compiled successfully!\n\nYou can now view \x1b[33m./${path.basename(__filename)}\x1b[0m in the browser.`);
    console.info(`\thttp://localhost:${PORT}`);
    console.log("\n\x1b[32mNode web compiled!\x1b[0m \n");
});
