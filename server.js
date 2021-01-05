const socketIo = require("socket.io")
const express = require('express');
const http = require('http')

var app = express();

const server = http.createServer(app); 

const io = socketIo(server, {
    // stop socket from closing automatically 
    pingTimeout: 60000
});  // set io to a socket w/the instance of our server

// app.use(express.logger());
app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.render('/public/index.html');
});

let players = [];  // player ids 
var playerInfo = [];

var gameHistory = [] // array of round History
var roundHistory = {} // contains cardHisotry, points scored and by whom 
var cardHistory = [] // cards played in a round by each player, embedded in roundHistory
var pointsInRound = 0 // points played in a ro`und 
var votes = 0 
var roundWinner // who won the round, either points or team
var scoreBoardData = [] // what points and levels each player has.  should track who was zhuang in each game and what the teams were 
var confirmZhuang = [] // track who has confirmed zhuangjia -- needs to match all players??? whati f there's an issue with the server tracking who's connected? or should i just do all player names? what if there's duplicate names? 
var liangData
var firstLiang = {}  // keep track of who flips zhu first case they get flipped and need to set priority 
firstLiang.name = null

var startingLevel = 2 
var gameStarted = false  // 

var cardDeck = ["zace_of_diamonds", "2_of_diamonds", "3_of_diamonds", "4_of_diamonds", "5_of_diamonds", "6_of_diamonds", "7_of_diamonds", "8_of_diamonds", "90_of_diamonds", "910_of_diamonds", "jack_of_diamonds", "queen_of_diamonds", "rking_of_diamonds", "zace_of_spades", "2_of_spades", "3_of_spades", "4_of_spades", "5_of_spades", "6_of_spades", "7_of_spades", "8_of_spades", "90_of_spades", "910_of_spades", "jack_of_spades", "queen_of_spades", "rking_of_spades", "zace_of_clubs", "2_of_clubs", "3_of_clubs", "4_of_clubs", "5_of_clubs", "6_of_clubs", "7_of_clubs", "8_of_clubs", "90_of_clubs", "910_of_clubs", "jack_of_clubs", "queen_of_clubs", "rking_of_clubs", "zace_of_hearts", "2_of_hearts", "3_of_hearts", "4_of_hearts", "5_of_hearts", "6_of_hearts", "7_of_hearts", "8_of_hearts", "90_of_hearts", "910_of_hearts", "jack_of_hearts", "queen_of_hearts", "rking_of_hearts", 'red_joker', 'black_joker']

function generateDecks(decksNeeded) {
	var fullCardDeck = []	
	for (var j = 0; j < decksNeeded; j++){
		var newDeck = []
		for(var i = 0; i<cardDeck.length; i++){    	
			var newCard = {card: cardDeck[i], deck: j}    				
			newDeck.push(newCard)
		}
		fullCardDeck = fullCardDeck.concat(newDeck)
	}

	return fullCardDeck
}

function shuffle(array) {
    // Fisher-Yates (aka Knuth) Shuffle
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

    // Pick a remaining element...
	    randomIndex = Math.floor(Math.random() * currentIndex);
	    currentIndex -= 1;

	    // And swap it with the current element.
	    temporaryValue = array[currentIndex];
	    array[currentIndex] = array[randomIndex];
	    array[randomIndex] = temporaryValue;
    }

    return array;
}

function countPoints(card) {
	if (card.includes(910) || card.includes('rking')) {		
		return 10
	} else if (card.includes(5)){
		return 5
	} else {
		return 0
	}
}


io.on('connection', function (socket) {

    console.log('A user connected: ' + socket.id);
    
    // tell player their socket id when they connect 
    io.to(socket.id).emit('playerid', socket.id)

    var randomNames = ['squirtle', 'pikachu', 'snorlax']
    var basicInfo = {name: randomNames[Math.round(Math.random()*2)], id: socket.id}
    players.push(socket.id);
    playerInfo.push(basicInfo)
    basicInfo.points = 0 
    scoreBoardData.push(basicInfo)

    socket.on('draw cards', function () {

    	// reset in game data 
		liangData = {}
		liangData.numberFlipped = 0
		liangData.flippedBy = null 
		confirmZhuang = []
    	
    	for (var i = 0; i < players.length; i++) {
    		playerInfo[i].zhuang = false
    		io.to(players[i]).emit('startGame', {order: i, players: players, playerInfo: playerInfo})  
    	}

    	// if (players.length > 7)
    	if (true) {
    		// generate 2 decks 
    		var allCards = generateDecks(2)
    		
    	}    	
		
        var shuffledCards = shuffle(allCards)
        // console.log(shuffledCards)
        var cardInd = 0
        var kouDi = 8  // number of cards at bottom 
    	var cardCount = 0

    	var cardInd = 0
        var kouDi = 8  // number of cards at bottom 
        var cardCount = 0
        
		while (cardInd < shuffledCards.length - kouDi) {
			if (cardInd % players.length == 0) {
				cardCount = cardCount + 1
			}
			var whichPlayer = cardInd % players.length			
			io.to(players[whichPlayer]).emit('deal', {card: shuffledCards[cardInd].card, deck:  shuffledCards[cardInd].deck, count: cardCount});
			cardInd = cardInd + 1
		}
   //      var dealer = setInterval(function() {
        	
   //      	console.log(cardInd, cardCount)
   //      	// console.log('wtf', players, shuffledCards)
   //      	if (cardInd < shuffledCards.length - kouDi){
   //      		if (cardInd % players.length == 0) {
			// 		cardCount = cardCount + 1
			// 	}
			// 	var whichPlayer = cardInd % players.length
			// 	io.to(players[whichPlayer]).emit('deal', {card: shuffledCards[cardInd], count: cardCount});
			// 	cardInd = cardInd + 1	
   //      	} else {
   //      		console.log('stop dealing')        		
   //      		clearInterval(dealer)
   //      	}
        	
			// // console.log(`deal ${shuffledCards[cardInd]}`)
   //      }, 1000)
   		
	});

	socket.on('start game', function(){
		io.emit('gameStarted', true)
	})

	socket.on('confirm zhuang', function(data){
		console.log('confirm zhuang', data)
		var order = players.indexOf(data.zhuang.id)
		if (data.response == false){
			// if one person rejects, send message to all players telling them that X is saying wait 
			io.emit('zhuang rejected', {waitingOn: data.responseByPlayer})
		} else {
			confirmZhuang.push(data.responseByPlayer)
			if (confirmZhuang.length == players.length){
				playerInfo[order].zhuang = true 
				io.emit('zhuang confirmed', {playerInfo: playerInfo, zhuang: data.zhuang})		
			}
			
		}
		
	})

	socket.on('call friends', function(data) {
		console.log(data)
		io.emit('jiao', data)
	})

    socket.on('round winner', function(data){
    	// record who won the round 
    	roundHistory.winner = data.id
    	// console.log(data)
    	// make sure at least two people clicked the same person before give them points

    	var scoreBoardOrder = scoreBoardData.map(x => x.id)

    	scoreBoardData[scoreBoardOrder.indexOf(data.id)].points = scoreBoardData[scoreBoardOrder.indexOf(data.id)].points + pointsInRound
    	io.emit('updateScore', {scoreBoard: scoreBoardData})
    })

    socket.on('playHand', function (cardHand) {
    	// server needs to keep track of what cards are played in a round and who plays it so we can clear the hand later / track for history     	
    	//array of objects w/keys where user is the key and cards is the value
    	// check see that it's that player's turn to play their hand 
    	console.log('play', cardHand)
    	for (var i = 0; i < cardHand.cards.length; i++) {    		
    		pointsInRound = pointsInRound + countPoints(cardHand.cards[i])
    	}
    	var hand = {}
    	hand.player = cardHand.player
    	hand.cards = cardHand.cards
    	cardHistory.push(hand)    	
    	roundHistory.points = pointsInRound
    	roundHistory.cards = cardHistory
    	// roundHistory = roundHistory.concat(hand)

        io.emit('cardPlayed', {cards: cardHand.cards, player: cardHand.player, points: pointsInRound});
    });

    socket.on('clearRound', function() {
    	// calculate number of points in the round and who won the points 
    	console.log('clear round', roundHistory, pointsInRound)
    	gameHistory.push(roundHistory)
    	// console.log('clearRound', data)
    	// tell what cards were played that round
    	io.emit('clearTable')


    	// reset round data 
    	pointsInRound = 0
    	roundHistory = {}
    	cardHistory = []
    })

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
    	var competitors = scoreBoardData.map(x => x.id)
    	var removeP = competitors.indexOf(socket.id)

    	scoreBoardData.splice(removeP, 1)
    	// DO I NEED TO UPDATE THE SCOREBOARD WHEN A PLAYER LEAVES??!?  prob no need to?? 

        var index = players.indexOf(socket.id)
        playerInfo.splice(index, 1)  // remove player that just disconnected (if we assign this to a var, it's equal to the item removed)
        // console.log(playerInfo)
        players = players.filter(player => player !== socket.id);
        // console.log(players)
    });

    socket.on('set name', function(data) {  
    	// console.log(data) 
    	var order = players.indexOf(data.id)
    	// console.log('set name', players, playerInfo, data, order)
    	playerInfo[order].name = data.name
    	scoreBoardData[order].name = data.name
    	console.log('scoreBoardData', scoreBoardData)

    	io.emit('playing order', playerInfo)
    })

    socket.on('avatar', function(data){
    	// console.log(data)
    	var order = players.indexOf(data.id)
    	playerInfo[order].avatar = data.avatar    	
    })

    socket.on('set zhuang', function(data) {
    	// console.log('set zhuang', data)
    	io.emit('check zhuang', data)
    })

    socket.on('liang', function(data) {
    	// TODO NEED TO DEAL WITH 3 DECK AND GET ALL 3 ZHU 
    	console.log('liang', data)
    	console.log('liangData', liangData)
    	// check if card already flipped 
    	if (liangData.flippedBy == null && data.card.length == 1) {
    		console.log('first zhu', data.card.includes(startingLevel))
    		// if nobody flipped yet, 
    		if (data.card[0].includes(startingLevel)){
				//TODO need to make sure they haven't already flipped this one ie click same card twice 
				
		    	liangData.numberFlipped = liangData.numberFlipped + 1
		    	liangData.name = data.name
		    	liangData.flippedBy = data.id  // need to announce who flipped it 

		    	var suits = ['diamonds', 'spades', 'clubs', 'hearts'];
		    	for (var i = 0; i < suits.length; i++) {
		    		if (data.card.includes(suits[i])){
		    			liangData.suit = suits[i]		    			
		    		}
		    	}
		    	
		    	if (firstLiang.name == null) {
    				firstLiang.card = data.card[0]
		    		firstLiang.name = data.id
		    	}

		    	liangData.zhuCard = data.card[0]
		    	console.log('zhu flipped', liangData)
		    	io.emit('zhuLiangLe', {liangData: liangData})
    		}

    	}
    	else if (data.card.length > 1){
    		// need to make sure can't change zhu 

    		// check that one of the two cards is a potential zhu
    		var suit1 = data.card[0].split('_')[2]  //TODO need to make sure no jokers or index out of bounds 
    		var suit2 = data.card[1].split('_')[2] 
    		var isZhu1 = data.card[0].includes(startingLevel)
    		var isZhu2 = data.card[1].includes(startingLevel)
    		
    		if (suit1 == suit2 && isZhu1 && isZhu2 && liangData.numberFlipped < 2) {
    			// need to check that hte person isnt flipping their own flipped zhu 

    			// flipped a pair and other person hasnt ding 
    			liangData.numberFlipped = 2
    			liangData.zhuCard = data.card[0]
	    		liangData.suit = suit1
	    		liangData.flippedBy = data.id 
	    		liangData.name = data.name	
	    		if (firstLiang.name == null) {
    				firstLiang.card = data.card[0]
		    		firstLiang.name = data.id
		    	}
	    		io.emit('zhuLiangLe', {liangData: liangData})

    		} else if (isZhu1 && !liangData.zhuCard) {
    			// if either is zhu and havent set a zhu
	    			// index 0 = most recently clicked card
    			liangData.numberFlipped = liangData.numberFlipped + 1
	    		
	    		// if suits don't match, make it the most recent one -- ie pop 		
	    		liangData.zhuCard = data.card[0]
	    		liangData.suit = suit1
	    		liangData.flippedBy = data.id 
	    		liangData.name = data.name
	    		if (firstLiang.name == null) {
    				firstLiang.card = data.card[0]
		    		firstLiang.name = data.id
		    	}
				io.emit('zhuLiangLe', {liangData: liangData})
    		} else if (isZhu2 && !liangData.zhuCard) {
    			// if either is zhu and havent set a zhu
	    			// index 0 = most recently clicked card
    			liangData.numberFlipped = liangData.numberFlipped + 1
	    		
	    		// if suits don't match, make it the most recent one -- ie pop 		
	    		liangData.zhuCard = data.card[1]
	    		liangData.suit = suit2
	    		liangData.flippedBy = data.id
	    		liangData.name = data.name 

	    		if (firstLiang.name == null) {
    				firstLiang.card = data.card[1]
		    		firstLiang.name = data.id
		    	}
				io.emit('zhuLiangLe', {liangData: liangData})
    		} else {
			// reject message ie invalid card
				io.emit('fail', {msg: 'what are you doing??'})
			}
    		
    		
    	}

    	console.log(liangData)    	
    	// need to check that nobody else has flipped and that it's the right level

    })
    // socket.on("disconnect", () => {
    //     console.log(socket.id, "Client disconnected");
    //     // remove player from list when disconnect and update player info 
    //     var sockets = player_list.map(x=>x.id)
    //     player_list = player_list.filter((x)=>x.id != socket.id)
    //     io.emit('join game', player_list)

    //     if (player_list.length == 0) {
    //         // clear chat when everybody leaves
    //         chat = []   
    //     }

    //     delete socket_list[socket.id]; 
        
    // });
});

server.listen(3000, function () {
    console.log('Server started!');
});