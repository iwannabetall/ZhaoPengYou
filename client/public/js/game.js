window.socket = io(); 
// const socket = require('./helpers/socketConfig')

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
        create: create,
        update: update
    }
};

var cardSize = 0.65

// var game = new Phaser.Game(config);
var game 

function preload ()
	{
		var cards = []
		// rename cards b/c can just sort array with sort func b/c treats as string 
		var suits = ['diamonds', 'spades', 'clubs', 'hearts'];
		var val = ['2','3','4','5','6','7','8','90','910','jack','queen','rking', 'sace'];
		for (var i = 0; i < suits.length; i++) {
			for (var j = 0; j < val.length; j++) {
				this.load.svg(`${val[j]}_of_${suits[i]}`, `svgs/${val[j]}_of_${suits[i]}.svg`);
			}
		}
		
		this.load.svg('vsmall_joker', 'svgs/vsmall_joker.svg')
		this.load.svg('zbig_joker', 'svgs/zbig_joker.svg')

		var avatars = ['charmander_sm', 'squirtle', 'pikachu_sm', 'snorlax', 'psyduck']

		for (var i = 0; i<avatars.length;i++) {
			this.load.image(avatars[i], `svgs/avatars/${avatars[i]}.jpg`)
		}

}

function update() {

	// L/R arrows slide card hand across screen 
	// TODO - MAKE SURE TO STOP IF REACH END OF HAND 
	 if (cursors.left.isDown && cardHandContainer.x < 200)
    {
    	// console.log(maxScroll)
    	// console.log(cardHandContainer.x, cardHandContainer.y)
        cardHandContainer.x += 6
    }
    else if (cursors.right.isDown && cardHandContainer.x > -maxScroll)
    {
     	cardHandContainer.x -= 6
    } else if (cursors.down.isDown && cardHandContainer.y < 250){
    	cardHandContainer.y += 6

    } else if (cursors.up.isDown  && cardHandContainer.y > -450) {
    	cardHandContainer.y -= 6

    }

}

var dropZoneCardsTracker = []  // svg names of cards played -- tracks unique cards ie from which deck 
// should dropZoneCardsTracker be an array of objects???!  going to make it 2 sep arrays b/c it's easier to filter 
var dropZoneCards = [] 
var dropZoneCardsSprites = []  // game objs of cards played
var cardSmaller = []
var cardSmallerSprites = []
var cardSmallerTracker = []

var cardsPlayed = []
var liangCards = []
var playerid 
var seatOrder
var playerOrder
var playerOrderInfo 
var playerInfo  // needs to always be synced with server 
var yourHandList = []  // list of card svg names 
var yourHand  // sprites
var self
var last2ClickedCards = []  // for liang zhu but should really be 3 -- also make sure if clicked 2 zhu, that the most recent one is going to be flipped / make it obvious that 
var kouDiCards
var kouDiSprites
var gameStarted = false  // 
var zhuangJia // if not set, ask if theyre ok with X as it 
var currentZhuang
var currentZhuangId
var zhuCard //set zhu suit
var cursors
var cardHandContainer

var maxScroll = 500

socket.on('playerid', function(id){	
	playerid = id
})

function create ()
    {

    cursors = this.input.keyboard.createCursorKeys();

	var avatars = ['charmander_sm', 'squirtle', 'pikachu_sm', 'snorlax', 'psyduck']
	var avatarGroup = this.add.group()  // need groups as global vars 
	var liangGroup = this.add.group()
	cardHandContainer = this.add.container(40, 200)
	cardHandContainer.setInteractive()
	// cardHandContainer.setInteractive({draggable: true, hitArea: cardHandContainer})

	// 	// this.input.setDraggable(cardHandContainer)

	// this.input.on('drag', function (pointer, gameObject, dragX, dragY) {

	// 	gameObject.setInteractive({draggable: true, hitArea: cardHandContainer})

 //        gameObject.x = dragX;
 //        gameObject.y = dragY;

 //    });


	for (var i = 0; i < avatars.length; i++) {
		var seatPlacement = this.add.image(100 + i * 170,100, avatars[i]).setInteractive()
		seatPlacement.setData({'group': 'avatar'})
		avatarGroup.add(seatPlacement)
	}

	var avatarBoxGroup = this.add.group()  // group for avatar boxes

    // var centerX = this.cameras.main.centerX 
    // var centerY = this.cameras.main.centerY 
    self = this
    console.log(self, this)

    // make sure to use arrow function for call back or "this" gets wrong reference 
	socket.on('startGame', (data) => {
		kouDiSprites = []
		kouDiCards = []
		console.log(data)
		// playerid = data.id 
		seatOrder = data.order
		var players = data.players
		var playerList = data.players
		playerInfo = data.playerInfo

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
			// var boxLength = 150 
			// var highlightPlayer = this.add.rectangle(x, y, boxLength, boxLength)
			// highlightPlayer.setStrokeStyle(4, 0xefc53f)
			// highlightPlayer.setData('id', playerOrderInfo[i].id).setVisible(false)
			// avatarBoxGroup.add(highlightPlayer)

			var text = this.add.text(x - 40,y - 40, playerOrderInfo[i].name)
			// .setInteractive()
			// text.setData('type', 'playingPic')
			// text.setData('id', playerOrderInfo[i].id)

			// text.input.hitArea.setSize(400,400)

			// text.on('pointerdown', function(data) {
			// 	console.log(data.downX, data.downY)
			// 	console.log(this._text, this.getData('id'))
			// 	console.log(this.data.values)
			// })
			// text.inputEnabled = true;
			// text.events.onInputDown.add(function(data) {
			// 	console.log(this, data)
			// }, this);

			// this.add.text(400, 300, 'wtf')
		// console.log(x,y, playerOrderInfo[i].name)	
		}
			
	})

    // create group for hand played and round of hands played -- game is undefined??
    // var dropZoneCardsTrackerGroup = game.add.group()  // what cards were played in drop zone 
    // var cardRound = game.add.group()

	// var cardsOnTable = this.add.group()
	// yourHand = this.add.group()
	yourHand = []
	
    socket.on('deal', (data)=> {
		// console.log(data.card)
		
		yourHandList.push({card: data.card, deck: data.deck})

		var card = this.add.sprite(400, 200, data.card).setScale(cardSize, cardSize).setName(data.card).setInteractive()
		card.setData('card', 'flip')


		var newCard 
		setTimeout(()=> {
			card.destroy()
			newCard = this.add.sprite(30 * data.count + 50, 600, data.card).setScale(cardSize, cardSize).setName(`${data.card}${data.deck}`).setInteractive()
			newCard.setData('card', 'inHand')
			newCard.setData('deck', data.deck)
			yourHand.push(newCard)
			cardHandContainer.add(newCard)  // can also pass as array
		}, 1500)
			
		maxScroll = (data.count * 30)/5
		// console.log(maxScroll)
        // yourHand.add(card)
        // console.log(yourHandList)
        // card.on('pointerdown', function(pointer, localX, localY, event) {
        // 	console.log(pointer, localX, localY, event)
        // 	this.setTint(0xff0000)

        // this.input.setDraggable(card);
	})
	

	// this.input.keyboard.on('keydown', function(e) {

	// })

	this.input.on('gameobjectdown', function (pointer, gameObject) {
		// console.log(gameObject.getData('type'), gameObject.type, gameObject.getData('card'))
		
		// when picking avatars at the beg
		if (gameObject.getData('group') == 'avatar') {
			// tell server which avatar you picked and remove 
			avatarGroup.clear(true, true)			
			socket.emit('avatar', {avatar: gameObject.texture.key, id: playerid})
		}

		// // when clicking avatars to select who won 
		// if (gameObject.getData('type') == 'playingPic') {
		// 	var winner = gameObject.getData('id')
		// 	avatarBoxGroup.setVisible(false)
		// 	console.log(avatarBoxGroup.getChildren(), avatarBoxGroup.length)
		// 	var avatarBorders = avatarBoxGroup.getChildren()
			
		// 	for (var i = 0; i<avatarBorders.length; i++) {				
		// 		console.log(avatarBorders[i].getData('id'))
		// 		if (avatarBorders[i].getData('id') == winner){
		// 			avatarBorders[i].setVisible(true)
		// 		}
		// 	}
			
		// 	// need to eventually check to see that everybody has played before letting people click 
		// 	socket.emit('round winner', {id: winner})

		// }
		// need to check if it's a card b/c will also trigger for clicked text
	    if(gameObject.type == "Sprite" && gameObject.getData('card') == 'inHand') {
	    	gameObject.setTint(0xff0000)
		    var cardClicked = gameObject.name  // unique id ie 2 of hearts from deck 1
		    var cardVal = gameObject.texture.key  // ie 2 of hearts 
		    // console.log(gameObject)
		    console.log(cardClicked, cardVal, gameObject.getData('deck'))
		    if (!dropZoneCardsTracker.includes(cardClicked)) {
		    	// if haven't selected this card yet, move it up, add to selected list 
		    	gameObject.y = gameObject.y - 20
		    	dropZoneCards.push({card: cardVal, deck: gameObject.getData('deck')})  // eg king of spades 
		    	dropZoneCardsTracker.push(gameObject.name)  // unique name ie might have 0 or 1 to indicate deck
		    	dropZoneCardsSprites.push(gameObject)	
		    	kouDiSprites.push(gameObject)  // dont need cardstracker -- just need one thing 
		    	kouDiCards.push(cardVal)

		    	// track for liang purposes - remove first added one, add just clicked
		    	if (last2ClickedCards.length == 2) {
		    		last2ClickedCards.pop() 
		    	}

		    	last2ClickedCards.unshift(gameObject.texture.key)  // just need to know the card, not which deck 
		    	// console.log(dropZoneCardsSprites)
		    } else {
		    	// remove and move it back down 
		    	gameObject.y = gameObject.y + 20
		    	var cardIndex = dropZoneCardsTracker.indexOf(cardClicked)	    	
		    	dropZoneCardsTracker = dropZoneCardsTracker.filter(x=> x != cardClicked)

		    	var removeCardInd = dropZoneCards.map(x=>x.card).indexOf(cardVal)
		    	dropZoneCards.splice(removeCardInd, 1)
		    	kouDiCards.splice(removeCardInd, 1)

		    	// console.log('remove', dropZoneCardsSprites.length, dropZoneCardsTracker, cardIndex)

		    	dropZoneCardsSprites.splice(cardIndex, 1)  // remove gameobject from array
		    	kouDiSprites.splice(cardIndex, 1)  // remove gameobject from array

		    	// console.log('remove', cardIndex, dropZoneCardsSprites.length)

		    	// console.log(dropZoneCardsSprites)
		    }	   
		    
	    }

	    if(gameObject.type == "Sprite" && gameObject.getData('card') == 'oppHand') {
	    	// gameObject.setTint(0xff0000)
	    	// selecting opponent card 
	    	var cardClicked = gameObject.name  // unique id ie 2 of hearts from deck 1
		    var cardVal = gameObject.texture.key  // ie 2 of hearts 
		    // console.log(gameObject)
		    if (!cardSmallerTracker.includes(cardClicked)) {
		    	gameObject.setTint(0xff0000)
		    	cardSmaller.push({card: cardVal, deck: gameObject.getData('deck')})  // eg king of spades 
		    	cardSmallerTracker.push(cardClicked)  // unique name ie might have 0 or 1 to indicate deck
		    	cardSmallerSprites.push(gameObject)	
		    	
		    } else {
		    	gameObject.clearTint()
		    	var cardIndex = cardSmallerTracker.indexOf(cardClicked)	    	
		    	cardSmallerTracker = cardSmallerTracker.filter(x=> x != cardClicked)

		    	var removeCardInd = cardSmaller.map(x=>x.card).indexOf(cardVal)
		    	cardSmaller.splice(removeCardInd, 1)
		    	cardSmallerSprites.splice(cardIndex, 1)  // remove gameobject from array
		    	
		    }
		    console.log(cardClicked, cardVal, cardSmaller)
		    console.log(cardSmallerTracker)
	    }

	    if (gameObject.getData('card') == 'flip') {
	    	var clicker = getPlayerById()
	    	socket.emit('liang', {card: [gameObject.texture.key], id: playerid, name: clicker})

	    }
	    
	    // console.log(gameObject.texture.key)
	//     // self.children.bringToTop(gameObject);
	})

	this.input.on('gameobjectup', function (pointer, gameObject) {
		if(gameObject.type == "Sprite" && gameObject.getData('card') == 'inHand') {
			gameObject.clearTint()
		}
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
	//     dropZoneCardsTracker.push(gameObject.texture.key)
	//     dropZoneCardsSprites.push(gameObject)
	//     console.log(dropZoneCardsTracker)

	//     gameObject.x = (dropZone.x - 350) + (dropZone.data.values.cards * 50);
	//     gameObject.y = dropZone.y;	
	//     // gameObject.disableInteractive();
	//     // this.socket.emit('cardPlayed', gameObject, self.isPlayerA);
	// })

	socket.on('send bottom 8', (cards) => {
		console.log(cards.bottom8Cards)

		yourHandList = yourHandList.concat(cards.bottom8Cards)

		sortHand()
		maxScroll = (yourHandList.length * 30)/5		
		
	})

	socket.on('play smaller', (data) => {
		// redo round clear screen, 
		cardsPlayed.forEach((card)=> card.destroy())
		cardsPlayed = []

		// showPlayedCards(data.lowerHand, data.lowerHandId)
		// play cards 
		console.log(data)
	})

	socket.on("return cards", (data) => {
		console.log(data)
		// console.log(yourHandList)
		// return cards to peoples hands and sort their cards
		yourHandList = yourHandList.concat(data.cards)
		sortHand()

		var remaining = yourHandList

		for (var i = 0; i < data.lowerHand.length; i++) {
			var remaining = remaining.filter(x=>x.card != data.lowerHand[i].card)
			yourHandList = yourHandList.filter(x=>x.card != data.lowerHand[i].card)
		}

		dropZoneCards = data.lowerHand

		socket.emit('can I go', {player: data.lowerHandId, cards: data.lowerHand, remainingCards: remaining})

		// console.log(yourHandList)
		// console.log(data)

	})

	socket.on('cardPlayed', (handPlayed)=> {
		var detailedHand = handPlayed.detailed  
		var hand = handPlayed.cards
		var playerId = handPlayed.player
		
		showPlayedCards(detailedHand, playerId)

		console.log(cardsPlayed)
	})

	socket.on('clearTable', ()=>{
		// clearRound()
		avatarBoxGroup.setVisible(false)

		cardsPlayed.forEach((card)=> card.destroy())
		cardsPlayed = []
	})

	socket.on('zhuLiangLe', (data)=> {
		if (liangGroup.children.entries.length > 0) {
			liangGroup.clear(true, true)
		}
		console.log(data)
		var gameInfo = data.liangData 
		currentZhuangId = gameInfo.flippedBy
		currentZhuang = gameInfo.name
		var zhu = this.add.sprite(50, 100, gameInfo.zhuCard).setScale(cardSize * 0.7, cardSize * 0.7).setName(`Zhu${gameInfo.zhuCard}`)
		liangGroup.add(zhu)
		var zhulabel = this.add.text(50, 20, `Zhu flipped by ${gameInfo.name}`)
		liangGroup.add(zhulabel)

		zhuCard = data.liangData.zhuCard  // set this for sorting purposes
		console.log(zhuCard)
		// console.log(liangGroup.length)
		// console.log(liangGroup.children.entries.length)
		// console.log(liangGroup.getLength())
	})

	socket.on('jiao', (data) => {
		// DO I NEED TO DISPLAY IT??		
		console.log(data)
	})

	socket.on('fail', (data) => {
		// failed liang attempt 
		console.log(data)
	})

	socket.on('gameStarted', (data)=> {
		console.log(data)
	})

	socket.on('error', (msg) => {
		console.log(msg)
	})

	socket.on('play your cards', () => {
		var lastRound = false
		for (var i = 0; i < dropZoneCards.length; i++) {
			var playedInd = yourHandList.map(x=>x.card).indexOf(dropZoneCards[i].card)	
			yourHandList.splice(playedInd, 1)
		}
		// dropzone cards 
		if(yourHandList.length == 0) {
			lastRound = true
		}

		maxScroll = (yourHandList.length * 30)/5
		console.log(maxScroll)

		dropZoneCardsSprites.forEach((card)=> card.destroy())
		console.log(dropZoneCardsSprites)

		socket.emit("playHand", {cards: dropZoneCards, player: playerid, lastRound: lastRound, remainingCards: yourHandList});
	
		// tell server what we're playing to tell everybody else
		dropZoneCardsTracker = []
		dropZoneCards = []
		dropZoneCardsSprites = []
	})
}

function playHand() {
	console.log(dropZoneCardsTracker)
	console.log(dropZoneCardsSprites)
	console.log(dropZoneCards)
	console.log(yourHandList)

	var remaining = yourHandList
	for (var i = 0; i < dropZoneCards.length; i++) {
		var remaining = remaining.filter(x=>x.card != dropZoneCards[i].card)
	}
	// console.log(remaining)
	socket.emit('can I go', {player: playerid, cards: dropZoneCards, remainingCards: remaining})	
}

function showPlayedCards(detailedHand, playerId) {
	// detailed hand has deck info 
	// show to everybody which cards server is telling us were played -- place card as if you're at the bottom always 
	// console.log(this.cameras.main.centerX, this.cameras.main.centerY)
	// 
	var cardRound = self.add.group()

	var wedge = 2*Math.PI/playerOrder.length // browser user 0 is at 270 degrees and every person after is 360/# of players minus 
	var playerIndex = playerOrder.indexOf(playerId)
	// console.log(playerIndex, playerOrder, playerId)
	var angle = 3 * (Math.PI) / 2 - playerIndex * wedge
	var radius = 250

	var x = self.cameras.main.centerX + radius * Math.cos(angle) 
	var y = self.cameras.main.centerY - radius * Math.sin(angle)
	// console.log(self, this)
	for (var i = 0; i < detailedHand.length; i++) {
		console.log(detailedHand[i])
		// place opponent card on table 
		var card = self.add.sprite(30 * i + x, y, detailedHand[i].card).setScale(cardSize, cardSize)
		.setName(`${detailedHand[i].card}${detailedHand[i].deck}`).setData('card', 'oppHand').setInteractive()
		card.setData('deck', detailedHand[i].deck)
		cardsPlayed.push(card)
		// console.log(card)
	}

}

// function clearTable() {
// 	// should make sure that everybody has played first 
// 	socket.emit('clearRound')
	
// }

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

function sortHand() {

	// pass zhu in as parameter 
	// console.log(yourHand)
	console.log(yourHandList)

	yourHand.forEach((card)=> card.destroy())

	var cardsInHand = yourHandList.map(x=> `${x.card}-${x.deck}`)
	var suits = ['diamonds', 'spades', 'hearts', 'clubs'];
	
	// if zhu is set, sort according to zhu 
	if (zhuCard) {
		// sort so that blacks/red suits arent next to each other?? 
		var zhuSuit = zhuCard.split('_')[2]	
		suits = suits.filter(x => x != zhuSuit)
		suits.push(zhuSuit)		

		// deal with separating zhu card from regular cards
		var zhuNums = cardsInHand.filter(x=> x.includes(zhuCard.split('_')[0]))
		var theZhuNum = zhuNums.filter(x=> x.includes(zhuSuit))  // concatenate before jokers 
		zhuNums = zhuNums.filter(x=> !x.includes(zhuSuit)).sort()
		zhuNums = zhuNums.concat(theZhuNum)

	}
		
	var sortedHand = []
	
	for (var i = 0; i < suits.length; i++) {
		// sort by suit 
		var cardsBySuit = cardsInHand.filter(x=>x.includes(suits[i]))		
		// remove zhu card 
		if (zhuCard) {
			cardsBySuit = cardsBySuit.filter(x=> !x.includes(zhuCard.split('_')[0]))
			// console.log(cardsBySuit)
		}
		sortedHand = sortedHand.concat(cardsBySuit.sort())	
	}


	// handle zhu number and jokers
	var jokers = cardsInHand.filter(x=>x.includes('joker'))
	if (zhuCard) {
		sortedHand = sortedHand.concat(zhuNums)
	}
	sortedHand = sortedHand.concat(jokers.sort())
	// console.log(sortedHand)

	for (var i = 0; i < sortedHand.length; i++){
		var deck = sortedHand[i].split('-')[1]
		var cardName = sortedHand[i].split('-')[0]

		// console.log(cardName, deck)
		var sortedCard = self.add.sprite(30 * i + 50, 200, cardName).setScale(cardSize, cardSize).setName(`${cardName}${deck}`).setData('card', 'inHand').setInteractive()
		sortedCard.setData('deck', deck)
		// sortedCard.setData('card', 'inHand')
		cardHandContainer.add(sortedCard)
		yourHand.push(sortedCard)
	}

	// cardHandContainer.bringToTop1

	// how do i update yourHandList mid deal w/o missing a card??? --should prob sort server side?? 
	// reset hand
	dropZoneCardsTracker = []
	dropZoneCards = []
	
}

function getPlayerById(){
	var ids = playerOrderInfo.map(x=>x.id)
	var names = playerOrderInfo.map(x=>x.name) 
	var ind = ids.indexOf(playerid)
	var clicker = names[ind]
	return clicker
}

function liang() {
	var clicker = getPlayerById()
	socket.emit('liang', {'card': last2ClickedCards, id: playerid, name: clicker})
}
// function setName() {
// 	var name = document.getElementById('name').value
// 	socket.emit('set name', {name: name, id: playerid })
// }

function startGame(){
	game = new Phaser.Game(config);
	// liangGroup.clear(true, true)
	// liangGroup.forEach((liang)=> liang.destroy())	
	socket.emit('start game')
}

function setZhuang() {	
	console.log(currentZhuangId, currentZhuang)
	// allows zhuang to kou di 
	socket.emit('set zhuang', {id: currentZhuangId, name: currentZhuang})
}