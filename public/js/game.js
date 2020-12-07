const socket = io();

var config = {
    type: Phaser.AUTO,
    width: 1400,
    height: 1000,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    },
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);

function preload ()
	{
		var suits = ['diamonds', 'spades', 'clubs', 'hearts'];
		var val = ['ace','2','3','4','5','6','7','8','9','10','jack','queen','king'];
		for (var i = 0; i < suits.length; i++) {
			for (var j = 0; j < val.length; j++) {
				this.load.svg(`${val[j]}_of_${suits[i]}`, `svgs/${val[j]}_of_${suits[i]}.svg`);
		}

	}

}

var dropZoneCards = []  // svg names of cards played 
var dropZoneCardsSprites = []  // game objs of cards played
var cardsPlayed = []
var playerid 
var seatOrder

socket.on('startGame', function(data) {
	// console.log(data)
	playerid = data.id 
	seatOrder = data.order
})

console.log(playerid)

function create ()
    {

    // create group for hand played and round of hands played -- game is undefined??
    // var dropZoneCardsGroup = game.add.group()  // what cards were played in drop zone 
    // var cardRound = game.add.group()

    socket.on('deal', (data)=> {
		// console.log(data)
		var card = this.add.sprite(30 * data.count + 50, 200, data.card).setScale(0.5, 0.5).setInteractive({ draggable: true })
        // card.inputEnabled = true;
        // this.input.enableDrag(true);
        this.input.setDraggable(card);
	})
	
	let dropZone = this.add.zone(700, 375, 900, 250).setRectangleDropZone(900, 250);
    dropZone.setData({ cards: 0 });

	let dropZoneOutline = this.add.graphics();
	dropZoneOutline.lineStyle(4, 0xff69b4);
	dropZoneOutline.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height)
	
    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
    	console.log(gameObject.texture)
    	gameObject.x = dragX;
    	gameObject.y = dragY;

    });


	this.input.on('dragstart', function (pointer, gameObject) {
	    gameObject.setTint(0xff69b4);
	    console.log(this)
	    console.log(gameObject)
	    // self.children.bringToTop(gameObject);
	})

	this.input.on('dragend', function (pointer, gameObject, dropped) {
	    gameObject.setTint();
	    if (!dropped) {
	        gameObject.x = gameObject.input.dragStartX;
	        gameObject.y = gameObject.input.dragStartY;
	    }
	})
	

	this.input.on('drop', function (pointer, gameObject, dropZone) {
		console.log(gameObject)		
		console.log(gameObject.texture.key)
		console.log(dropZone.data)

	    dropZone.data.values.cards++;
	    dropZoneCards.push(gameObject.texture.key)
	    dropZoneCardsSprites.push(gameObject)
	    console.log(dropZoneCards)

	    gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
	    gameObject.y = dropZone.y;
	    // gameObject.disableInteractive();
	    // this.socket.emit('cardPlayed', gameObject, self.isPlayerA);
	})

	socket.on('cardPlayed', (hand)=> {
		// show to everybody which cards server is telling us were played
		
		for (var i = 0; i < hand.length; i++) {
			console.log(hand[i])
			var card = this.add.sprite(30 * i + 100, 700, hand[i]).setScale(0.5, 0.5).setInteractive({ draggable: true })	
			cardsPlayed.push(card)
			console.log(card)
		}
		console.log(cardsPlayed)
	})

	socket.on('clearTable', ()=>{
		// clearRound()
		cardsPlayed.forEach((card)=> card.destroy())
		cardsPlayed = []
	})
}

function playHand() {
	console.log(dropZoneCardsSprites)
	dropZoneCardsSprites.forEach((card)=> card.destroy())
	// tell server what we're playing to tell everybody else
	  socket.emit("playHand", dropZoneCards);
	  dropZoneCards = []
}

function clearTable() {
	// should make sure that everybody has played first 
	socket.emit('clearRound')
	
}

function clearRound(){
	cardsPlayed.forEach((card)=> card.destroy())
	cardsPlayed = []
}

function startCardDraw() {
	setTimeout(function() {
		socket.emit('draw cards')	
	}, 1000)
	console.log('it works')
}