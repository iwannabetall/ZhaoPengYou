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
		var cards = []
		// rename cards b/c can just sort array with sort func b/c treats as string 
		var suits = ['diamonds', 'spades', 'clubs', 'hearts'];
		var val = ['zace','2','3','4','5','6','7','8','90','910','jack','queen','rking'];
		for (var i = 0; i < suits.length; i++) {
			for (var j = 0; j < val.length; j++) {
				this.load.svg(`${val[j]}_of_${suits[i]}`, `svgs/${val[j]}_of_${suits[i]}.svg`);
			}
		}

		var avatars = ['charmander_sm', 'squirtle', 'pikachu_sm', 'snorlax']

		for (var i = 0; i<avatars.length;i++) {
			this.load.image(avatars[i], `svgs/avatars/${avatars[i]}.jpg`)
		}

}

var dropZoneCards = []  // svg names of cards played 
var dropZoneCardsSprites = []  // game objs of cards played
var cardsPlayed = []
var playerid 
var seatOrder
var playerOrder
var playerOrderInfo 
var yourHandList = []  
var yourHand
var self

socket.on('playerid', function(id){	
	playerid = id
})

function create ()
    {

	var avatars = ['charmander_sm', 'squirtle', 'pikachu_sm', 'snorlax']
	var avatarGroup = this.add.group()

	for (var i = 0; i < avatars.length; i++) {
		var seatPlacement = this.add.image(100 + i * 170,100, avatars[i]).setInteractive()
		seatPlacement.setData({'group': 'avatar'})
		avatarGroup.add(seatPlacement)
	}

	var avatarBoxGroup = this.add.group()  // group for avatar boxes

    // var centerX = this.cameras.main.centerX 
    // var centerY = this.cameras.main.centerY 
    self = this
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
			var playerAv = this.add.image(x, y, playerOrderInfo[i].avatar).setInteractive()
			playerAv.setData('id', playerOrderInfo[i].id)
			playerAv.setData('x', x)
			playerAv.setData('y', y)
			playerAv.setData('type', 'playingPic')
			var boxLength = 150 
			var highlightPlayer = this.add.rectangle(x, y, boxLength, boxLength)
			highlightPlayer.setStrokeStyle(4, 0xefc53f)
			highlightPlayer.setData('id', playerOrderInfo[i].id).setVisible(false)
			avatarBoxGroup.add(highlightPlayer)

			var text = this.add.text(x - 40,y - 40, playerOrderInfo[i].name).setInteractive()
			text.setData('type', 'playingPic')
			text.setData('id', playerOrderInfo[i].id)

			text.input.hitArea.setSize(400,400)

			text.on('pointerdown', function(data) {
				console.log(data.downX, data.downY)
				console.log(this._text, this.getData('id'))
				console.log(this.data.values)
			})
			// text.inputEnabled = true;
			// text.events.onInputDown.add(function(data) {
			// 	console.log(this, data)
			// }, this);

			// this.add.text(400, 300, 'wtf')
		// console.log(x,y, playerOrderInfo[i].name)	
		}
			
	})

    // create group for hand played and round of hands played -- game is undefined??
    // var dropZoneCardsGroup = game.add.group()  // what cards were played in drop zone 
    // var cardRound = game.add.group()

	// var cardsOnTable = this.add.group()
	// yourHand = this.add.group()
	yourHand = []
	
    socket.on('deal', (data)=> {
		console.log(data.card)
		
		yourHandList.push(data.card)

		var card = this.add.sprite(30 * data.count + 50, 200, data.card).setScale(0.5, 0.5).setName(data.card).setInteractive()

		yourHand.push(card)
        // yourHand.add(card)
        // console.log(yourHandList)
        // card.on('pointerdown', function(pointer, localX, localY, event) {
        // 	console.log(pointer, localX, localY, event)
        // 	this.setTint(0xff0000)

        // this.input.setDraggable(card);
	})
	
	this.input.on('gameobjectdown', function (pointer, gameObject) {
		console.log(gameObject.getData('type') )
		
		// when picking avatars at the beg
		if (gameObject.getData('group') == 'avatar') {
			// tell server which avatar you picked and remove 
			avatarGroup.clear(true, true)			
			socket.emit('avatar', {avatar: gameObject.texture.key, id: playerid})
		}

		// when clicking avatars to select who won 
		if (gameObject.getData('type') == 'playingPic') {
			var winner = gameObject.getData('id')
			avatarBoxGroup.setVisible(false)
			console.log(avatarBoxGroup.getChildren(), avatarBoxGroup.length)
			var avatarBorders = avatarBoxGroup.getChildren()
			
			for (var i = 0; i<avatarBorders.length; i++) {				
				console.log(avatarBorders[i].getData('id'))
				if (avatarBorders[i].getData('id') == winner){
					avatarBorders[i].setVisible(true)
				}
			}
			
			// need to eventually check to see that everybody has played before letting people click 
			socket.emit('round winner', {id: winner})

		}
		// need to check if it's a card b/c will also trigger for clicked text
	    if(gameObject.type == "Sprite") {
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
	

	// this.input.on('drop', function (pointer, gameObject, dropZone) {
	// 	console.log(gameObject)		
	// 	console.log(gameObject.texture.key)
	// 	console.log(dropZone.data)

	//     dropZone.data.values.cards++;
	//     dropZoneCards.push(gameObject.texture.key)
	//     dropZoneCardsSprites.push(gameObject)
	//     console.log(dropZoneCards)

	//     gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
	//     gameObject.y = dropZone.y;	
	//     // gameObject.disableInteractive();
	//     // this.socket.emit('cardPlayed', gameObject, self.isPlayerA);
	// })

	socket.on('cardPlayed', (handPlayed)=> {
		var hand = handPlayed.cards
		var playerId = handPlayed.player
		// show to everybody which cards server is telling us were played -- place card as if you're at the bottom always 
		// console.log(this.cameras.main.centerX, this.cameras.main.centerY)
		// 
		var cardRound = this.add.group()


		var wedge = 2*Math.PI/playerOrder.length // browser user 0 is at 270 degrees and every person after is 360/# of players minus 
		var playerIndex = playerOrder.indexOf(playerId)
		console.log(playerIndex, playerOrder, playerId)
		var angle = 3 * (Math.PI) / 2 - playerIndex * wedge
		var radius = 250

		var x = this.cameras.main.centerX + radius * Math.cos(angle) 
		var y = this.cameras.main.centerY - radius * Math.sin(angle)
		console.log(self, this)
		for (var i = 0; i < hand.length; i++) {
			// console.log(hand[i])
			var card = this.add.sprite(30 * i + x, y, hand[i]).setScale(0.5, 0.5)
			cardsPlayed.push(card)
			// console.log(card)
		}
		console.log(cardsPlayed)
	})

	socket.on('clearTable', ()=>{
		// clearRound()
		avatarBoxGroup.setVisible(false)

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

function sortHand(cards, currentCardObj, zhuSuit) {

	// pass zhu in as paramter 
	yourHand.forEach((card)=> card.destroy())

	var zhu = '2'
	var suits = ['diamonds', 'spades', 'clubs', 'hearts'];
	var val = ['zace','2','3','4','5','6','7','8','90','910','jack','queen','rking'];
	var sortedHand = []

	for (var i = 0; i < suits.length; i++) {
		// sort by suit 
		var cardsBySuit = yourHandList.filter(x=>x.includes(suits[i]))
		sortedHand = sortedHand.concat(cardsBySuit.sort())
	}
	// handle zhu number and jokers
	var jokers = yourHandList.filter(x=>x.includes('joker'))
	sortedHand = sortedHand.concat(jokers)
	console.log(sortedHand)

	for (var i = 0; i < sortedHand.length; i++){
		self.add.sprite(30 * i + 50, 200, sortedHand[i]).setScale(0.5, 0.5).setName(sortedHand[i]).setInteractive()	
	}

	// how do i update yourHandList mid deal w/o missing a card??? --should prob sort server side?? 
	
}
// function setName() {
// 	var name = document.getElementById('name').value
// 	socket.emit('set name', {name: name, id: playerid })
// }