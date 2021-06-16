import Phaser from 'phaser';

import Gameplay from './scenes/gameplay.js';

//minimal config
const config = {
	width: 800,
	height: 600,
	type: Phaser.AUTO,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { x: 0, y: 0 }
		}
	}
};

const game = new Phaser.Game(config);

game.scene.add('gameplay', Gameplay);

game.scene.start('gameplay');