import Phaser from 'phaser';
import io from 'socket.io-client';

export default class Gameplay extends Phaser.Scene {
	create() {
		console.log('create');
		this.socket = io('http://localhost:8000');

		//receive all info from the server
		this.socket.on('index', data => {
			this.index = data;
		});

		this.socket.on('clock', data => {
			this.clock = data;
		});

		this.socket.on('state', data => {
			this.state = data;

			//integrate the new data into this client
			Object.values(this.state).forEach(s => {
				if (!s) return; //don't process nulls

				const delta = this.clock - s.seconds;
				s.x += s.xvel * delta;
				s.y += s.yvel * delta;
			});
		});

		this.socket.on('update', data => {
			console.log("update", data);
			this.state[data.index] = data;
			const delta = this.clock - data.seconds; //difference in time between other client and myself

			//integrate the new data into this client
			this.state[data.index].x += this.state[data.index].xvel * delta;
			this.state[data.index].y += this.state[data.index].yvel * delta;
		});

		this.socket.on('disconnection', data => {
			this.state[data] = null;
			this.graphics[data].destroy();
			this.graphics[data] = null;
		});

		//input
		this.cursors = this.input.keyboard.createCursorKeys();

		//containers
		this.graphics = {};
	}

	update() {
		if (this.state === undefined || this.clock === undefined || this.index === undefined) {
			console.log('skipping out');
			return;
		}

		//get a delta
		const delta = 1 / this.game.loop.actualFps * 1000;
		this.clock += delta;

		//simulate every ball by a slice of time
		Object.values(this.state).forEach(s => {
			//don't process nulls
			if (!s) return;

			//create graphic if it doesn't exist
			if (!this.graphics[s.index]) {
				this.graphics[s.index] = this.add.circle(400, 300, 10, 0xFFFFFF);
			}

			//move the graphics
			this.graphics[s.index].x = s.x + s.xvel * 1 / this.game.loop.actualFps;
			this.graphics[s.index].y = s.y + s.yvel * 1 / this.game.loop.actualFps;
		})

		//handle input
		let xvel = 0, yvel = 0;
		if (this.cursors.up.isDown) {
			yvel -= 30;
		}

		if (this.cursors.down.isDown) {
			yvel += 30;
		}

		if (this.cursors.left.isDown) {
			xvel -= 30;
		}

		if (this.cursors.right.isDown) {
			xvel += 30;
		}

		//tick the clock
		this.clock += 1 / this.game.loop.actualFps;

		if (this.state[this.index].xvel != xvel || this.state[this.index].yvel != yvel) {
			console.log("Changing state");
			//alter this client's member
			this.state[this.index].xvel = xvel;
			this.state[this.index].yvel = yvel;
			this.state[this.index].seconds = this.clock;

			//send the update
			this.socket.emit('update', this.state[this.index]);
		}
	}
};