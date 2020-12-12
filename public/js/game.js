const socket = io();

var config = {
    type: Phaser.AUTO,
    width: 1400,
    height: 1000,
    // width: window.innerWidth * window.devicePixelRatio, 
    // height: window.innerHeight * window.devicePixelRatio,
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
var playerOrder
var playerOrderInfo 

socket.on('playerid', function(id){	
	playerid = id
})


function tableSeating (radius, playerId) {
	
	return {x: x, y: y}

}

function create ()
    {
    // var centerX = this.cameras.main.centerX 
    // var centerY = this.cameras.main.centerY 
    // var self = this
    // console.log(self, this)

    // make sure to use arrow function for call back or "this" gets wrong reference 
	socket.on('startGame', (data) => {
		console.log(data)
		// playerid = data.id 
		seatOrder = data.order
		var players = data.players
		var playerList = data.players
		var playerInfo = data.playerInfo

		console.log(playerInfo)
		// var playerInfo2 = data.playerInfo
		// reorder players array such that player is always in same spot ie index 0 but player order is the same
		var sliceInd = playerList.indexOf(playerid)
		playerOrder = playerList.concat(playerList.splice(0, sliceInd))
		playerOrderInfo = playerInfo.concat(playerInfo.splice(0, sliceInd))

		var wedge = 2*Math.PI/playerOrder.length // browser user 0 is at 270 degrees and every 
		var radius = 400
		console.log(playerOrderInfo)	
		// console.log(self, this)
		// self.add.text(340,459, 'wtf')
		for (var i = 0; i < playerOrder.length; i++) {
			// console.log(this)
			// determine where on the "table" name/cards go dependent upon number of players
			// person after is 360/# of players minus 
			var playerIndex = playerOrder.indexOf(playerOrderInfo[i].id)
			// var radius = 300
			var angle = 3 * (Math.PI) / 2 - playerIndex * wedge

			var x = this.cameras.main.centerX + radius * Math.cos(angle) 
			var y = this.cameras.main.centerY - radius * Math.sin(angle)
			this.add.text(x,y, playerOrderInfo[i].name)
			// this.add.text(400, 300, 'wtf')
		console.log(x,y, playerOrderInfo[i].name)	
		}
		
		
	})

    // create group for hand played and round of hands played -- game is undefined??
    // var dropZoneCardsGroup = game.add.group()  // what cards were played in drop zone 
    // var cardRound = game.add.group()


    socket.on('deal', (data)=> {
		// console.log(data)
		var card = this.add.sprite(30 * data.count + 50, 200, data.card).setScale(0.5, 0.5).setName(data.card).setInteractive()
		// var card = this.add.sprite(30 * data.count + 50, 200, data.card).setScale(0.5, 0.5).setInteractive({ draggable: true })
        
        
        // card.on('pointerdown', function(pointer, localX, localY, event) {
        // 	console.log(pointer, localX, localY, event)
        // 	this.setTint(0xff0000)

        // 	this.y = this.y - 20
        // })

        card.on('pointerup', function(pointer){
        	this.clearTint()
        })

        // this.input.setDraggable(card);
	})
	
	this.input.on('gameobjectdown', function (pointer, gameObject) {
	//     gameObject.setTint(0xff69b4);
	    // console.log(this)
	    gameObject.setTint(0xff0000)
	    var cardClicked = gameObject.texture.key
	    console.log(gameObject)
	    if (!dropZoneCards.includes(cardClicked)) {
	    	// if haven't selected this card yet, move it up, add to selected list 
	    	gameObject.y = gameObject.y - 20
	    	dropZoneCards.push(gameObject.texture.key)
	    	dropZoneCardsSprites.push(gameObject)	
	    	// console.log(dropZoneCardsSprites)
	    } else {
	    	// remove and move it back down 
	    	gameObject.y = gameObject.y + 20
	    	var cardIndex = dropZoneCards.indexOf(cardClicked)	    	
	    	dropZoneCards = dropZoneCards.filter(x=> x != cardClicked)
	    	dropZoneCardsSprites.splice(cardIndex, 1)  // remove gameobject from array
	    	// console.log(dropZoneCardsSprites)
	    }	   
	    
	    console.log(gameObject.texture.key)
	//     // self.children.bringToTop(gameObject);
	})

	this.input.on('gameobjectup', function (pointer, gameObject) {
		gameObject.clearTint()
	})
	// let dropZone = this.add.zone(700, 375, 900, 250).setRectangleDropZone(900, 250);
 //    dropZone.setData({ cards: 0 });

	// let dropZoneOutline = this.add.graphics();
	// dropZoneOutline.lineStyle(4, 0xff69b4);
	// dropZoneOutline.strokeRect(dropZone.x - dropZone.input.hitArea.width / 2, dropZone.y - dropZone.input.hitArea.height / 2, dropZone.input.hitArea.width, dropZone.input.hitArea.height)
	
    // this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
    // 	console.log(gameObject.texture)
    // 	gameObject.x = dragX;
    // 	gameObject.y = dragY;

    // });


	// this.input.on('dragstart', function (pointer, gameObject) {
	//     gameObject.setTint(0xff69b4);
	//     console.log(this)
	//     console.log(gameObject)
	//     // self.children.bringToTop(gameObject);
	// })

	// this.input.on('dragend', function (pointer, gameObject, dropped) {
	//     gameObject.setTint();
	//     if (!dropped) {
	//         gameObject.x = gameObject.input.dragStartX;
	//         gameObject.y = gameObject.input.dragStartY;
	//     }
	// })
	

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

	socket.on('cardPlayed', (handPlayed)=> {
		var hand = handPlayed.cards
		var playerId = handPlayed.player
		// show to everybody which cards server is telling us were played -- place card as if you're at the bottom always 
		// console.log(this.cameras.main.centerX, this.cameras.main.centerY)
		// 


		var wedge = 2*Math.PI/playerOrder.length // browser user 0 is at 270 degrees and every person after is 360/# of players minus 
		var playerIndex = playerOrder.indexOf(playerId)
		console.log(playerIndex, playerOrder, playerId)
		var angle = 3 * (Math.PI) / 2 - playerIndex * wedge
		var radius = 300

		var x = this.cameras.main.centerX + radius * Math.cos(angle) 
		var y = this.cameras.main.centerY - radius * Math.sin(angle)
		console.log(self, this)
		for (var i = 0; i < hand.length; i++) {
			console.log(hand[i])
			var card = this.add.sprite(30 * i + x, y, hand[i]).setScale(0.5, 0.5).setInteractive({ draggable: true })	
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
	socket.emit("playHand", {cards: dropZoneCards, player: playerid});
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

// function setName() {
// 	var name = document.getElementById('name').value
// 	socket.emit('set name', {name: name, id: playerid })
// }