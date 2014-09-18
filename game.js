BunnyDefender.Game = function(game) {
	this.totalBunnies;
	this.bunnyGroup; // kontejner
	this.totalSpaceRock;
	this.SpaceRockGroup; // kontejner
	this.burst;
	this.gameover;
	this.countdown;
	this.overmessage;
	this.secondsElapse;
	this.timer;
	this.music;
	this.ouch;
	this.boom;
	this.ding;
};

BunnyDefender.Game.prototype = {
	
	create: function() {
		this.gameover = false;
		this.secondsElapse = 0;
		this.timer = this.time.create(false); // false znaci da ne zelimo da ga unistimo nakon kraja igre
		this.timer.loop(1000, this.updateSeconds, this); // this je refenca na tajmer i koliko puta da se osvezava
		this.totalBunnies = 20;
		this.totalSpaceRock = 13;
		
		this.music = this.add.audio('game_audio');
		this.music.play('', 0, 0.3, true); // marker za zvuk, pocetaK, jacina zvuka, loop
		this.ouch = this.add.audio('hurt_audio');
		this.boom = this.add.audio('explosion_audio');
		this.ding = this.add.audio('select_audio');
		
		this.buildWorld();
	},
	
	updateSeconds: function() {
		this.secondsElapse++;
	},
	
	buildWorld: function() {
		this.add.image(0, 0, 'sky');
		this.add.image(0, 800, 'hill');
		this.buildBunnies();
		this.buildSpaceRocks();
		this.buildEmitter();
		this.countdown = this.add.bitmapText(10, 10, 'eightbitwonder', 'Bunnies Left ' + this.totalBunnies, 20);
		this.timer.start();
	},
	
	buildBunnies: function() {
		this.bunnyGroup = this.add.group(); // kreiramo grupu
		this.bunnyGroup.enableBody = true; // ovako omogucvamo fizik engine za kolajdere
		for(var i=0; i<this.totalBunnies; i++) {
			var b = this.bunnyGroup.create(this.rnd.integerInRange(-10, this.world.width-50), 
										   this.rnd.integerInRange(this.world.height-180, this.world.height-60), 'bunny', 'Bunny0000'); 
			// bunny0000 oznacava sliku u okviru atlasa
			b.anchor.setTo(0.5, 0.5);
			b.body.moves = false; // kao rigidbody kod Unity ne zelimo da nam fizik engine pomera objekte
			b.animations.add('Rest', this.game.math.numberArray(1, 58)); // 1-58 frejma
			b.animations.add('Walk', this.game.math.numberArray(68, 107)); // 68-107 frejma
			b.animations.play('Rest', 24, true); // 24 FPS nakon pustanja
			this.assignBunnyMovement(b); // pocetak animacije
		}
	} ,
	
	assignBunnyMovement: function(b) {
		bposition = Math.floor(this.rnd.realInRange(50, this.world.width-50)); // pozicija do koje ce zec
		bdelay = this.rnd.integerInRange(2000, 6000); // 2000-6000 ms ili 2-6 sek
		if(bposition < b.x) {
			b.scale.x = 1;
		} else {
			b.scale.x = -1;
		}
		t = this.add.tween(b).to({x:bposition}, 3500, Phaser.Easing.Quadratic.InOut, true, bdelay); // {x:bposition} po x osi do bposition, 3,5 sek traje animacija, easing za sto prirodniji prika animacije na pocetku se ubrza i na kraju uspori, true za auto start i na kraju odlaganje
		t.onStart.add(this.startBunny, this); // this je za b
		t.onComplete.add(this.stopBunny, this);
	},
	
	startBunny: function(b) {
		b.animations.stop('Play');
		b.animations.play('Walk', 24, true);
	},
	
	stopBunny: function(b) {
		b.animations.stop('Walk');
		b.animations.play('Rest', 24, true); // true za auto loop
		this.assignBunnyMovement(b);
	},
	
	buildSpaceRocks: function() {
		this.SpaceRockGroup = this.add.group();
			for(var i=0; i<this.totalSpaceRock; i++) {
			var r = this.SpaceRockGroup.create(this.rnd.integerInRange(0, this.world.width), 
										   this.rnd.integerInRange(-1500, 0), 'spacerock', 'SpaceRock0000'); 
			var scale = this.rnd.realInRange(0.3, 1.0);
			r.scale.x = scale;
			r.scale.y = scale;
			this.physics.enable(r, Phaser.Physics.ARCADE); // aktiviramo gravitaciju
			r.enableBody = true; 
			r.body.velocity.y = this.rnd.integerInRange(200, 400); // brzina
			r.animations.add('Fall');
			r.animations.play('Fall', 24, true);
			// dodato
			r.checkWorldBounds = true; // da li je van ekrana
			r.events.onOutOfBounds.add(this.resetRock, this); // poziva se funkcija	
		}
	},
	resetRock: function(r) {
		if(r.y > this.world.height) {
			this.respawnRock(r);
		}
	},
	
	respawnRock: function(r) {
		if(this.gameover == false) {
			r.reset(this.rnd.integerInRange(0, this.world.width),
				   this.rnd.realInRange(-1500, 0));
			r.body.velocity.y = this.rnd.integerInRange(200,400);
		}
	},
	
	buildEmitter: function() {
		this.burst = this.add.emitter(0, 0, 80); // gore-levo dok je trece kolicina partikla u emiteru znaci 80
		this.burst.minParticleScale = 0.3; // velicina
		this.burst.maxParticleScale = 1.2;
		this.burst.minParticleSpeed.setTo(-30, 30); //brzina
		this.burst.maxParticleSpeed.setTo(30, -30);
		this.burst.makeParticles('explosion');
		this.input.onDown.add(this.fireBurst, this); // this se misli na sam ulaz
	},
	
	fireBurst: function(pointer) {
		if(this.gameover == false) {
			if(this.burst.exists) {
			this.boom.play();
			this.boom.volume = 0.2;
			}
			this.burst.emitX = pointer.x;
			this.burst.emitY = pointer.y;
			this.burst.start(true, 2000, null, 20);
			console.log(this.burst.length);
			// true za eksploziju, 2000 ili 2 sek z a vreme, null je za frekvenciju jer sve eksplodira od jednom, 20 za kvantitet ovo znaci da do 4 puta puca
		}
	},
	
	burstCollision: function(r, b) {
		this.respawnRock(r);
	},
	
	bunnyCollision: function(r, b) {
		if(b.exists) // da li zec postoji
		{
			this.ouch.play();
			this.respawnRock(r);
			this.makeGhost(b);
			b.kill(); // isto sto i Destory u Unity
			this.totalBunnies--; // inkrementiramo
			this.checkBunniesLeft();
		}
	},
	
	checkBunniesLeft: function() {
		if(this.totalBunnies <= 0) {
			this.gameover = true;
			this.music.stop();
			this.countdown.setText('Bunnies Left 0');
			this.overmessage = this.add.bitmapText(this.world.centerX-180, this.world.centerY-40, 'eightbitwonder', 'GAME OVER \n\n' + this.secondsElapse, 42);
			this.overmessage.align = "center"; //centriranje
			this.overmessage.inputEnabled = true; // klikatanje na tekst
			this.overmessage.events.onInputDown.addOnce(this.quitGame, this); // this je pointer ili ulaz
		} else {
			this.countdown.setText('Bunnies Left ' + this.totalBunnies);
		}
	},
	
	quitGame: function(pointer) {
		this.ding.play();
		this.state.start('StartMenu');
	},
	
	friendlyFire: function(b, e) {
		if(b.exists) {
			this.ouch.play();
			this.makeGhost(b);
			b.kill();
			this.totalBunnies--;
			this.checkBunniesLeft();
		}
	},
	
	makeGhost: function(b) {
		bunnyghost = this.add.sprite(b.x-20, b.y-180, 'ghost');
		bunnyghost.anchor.setTo(0.5, 0.5);
		bunnyghost.scale.x = b.scale.x;
		this.physics.enable(bunnyghost, Phaser.Physics.ARCADE);
		bunnyghost.enableBody = true;
		bunnyghost.checkWorldBounds = true;
		bunnyghost.body.velocity.y = -800; // idemo na vise
	},
	
	update: function() {
		this.physics.arcade.overlap(this.SpaceRockGroup, this.burst, this.burstCollision, null, this); 
		// kamen, emiter, kolizija, null proces callback, this je callback context kako bi pristupli elementima koji su se sudarili
		this.physics.arcade.overlap(this.SpaceRockGroup, this.bunnyGroup, this.bunnyCollision, null, this);
		this.physics.arcade.overlap(this.bunnyGroup, this.burst, this.friendlyFire, null, this); //sad ubijamo zeceve 
	}
};