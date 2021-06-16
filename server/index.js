//global variables
const http = require('http').Server();
const io = require('socket.io')(http, {
	cors: {
		origin: '*'
	}
});

let playerCount = 0;
const states = {}; //hold the game state (last input commands, positions, etc.)

//time is a pain in node
const getUptime = () => {
	const hrTime = process.hrtime();
	return (hrTime[0] + hrTime[1] / 1000) / 1000;
};

//setup socket.io
io.on('connect', socket => {
	//connection time
	const uptime = getUptime();

	//create a new player state
	states[playerCount] = {
		index: playerCount,
		x: 0,
		y: 0,
		xvel: 0,
		yvel: 0,
		seconds: uptime
	};

	//send all information
	socket.emit('index', playerCount);
	socket.emit('clock', uptime);
	socket.emit('state', states);

	//react to player input
	socket.on('update', handleUpdate(socket, playerCount));
	socket.on('disconnect', handleDisconnect(socket, playerCount));

	//ready for the next connection
	playerCount++;

	console.log('player created: ' + (playerCount - 1));
});

//implement the helpers
const handleUpdate = (socket, index) => data => {
	console.log(data)
	io.emit('update', data); //bounce to the other players
	states[index] = data; //update internal state
};

const handleDisconnect = (socket, index) => data => {
	socket.broadcast.emit('disconnection', index); //bounce the disconnection
	states[index] = null; //wipe the internal info
}

http.listen(8000, () => {
	console.log('listening on port 8000');
});