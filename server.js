// require('ignore-styles')

// require('@babel/register')({
//   ignore: [/(node_modules)/],
//   presets: ['@babel/preset-env', '@babel/preset-react']
// })

// require("core-js/stable");
// require("regenerator-runtime/runtime");

const express = require("express");
const http = require("http");
const socketIo = require("socket.io")
const path = require('path')
// var now = require('performance-now')
const cors = require("cors");
var bodyParser = require('body-parser');

var app = express();

//Port from environment variable or default - 4001
const port = process.env.PORT || 2000;

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
var scoreBoardData = {} // what points and levels each player has.  should track who was zhuang in each game and what the teams were 
var confirmZhuang = [] // track who has confirmed zhuangjia -- needs to match all players??? whati f there's an issue with the server tracking who's connected? or should i just do all player names? what if there's duplicate names? 
var liangData
var firstLiang = {}  // keep track of who flips zhu first case they get flipped and need to set priority 
firstLiang.name = null

var startingLevel = 2 
var gameStarted = false  // 

var numCardsInHand  // how many cards in hand to start
var kouDiCards
var bottom8Cards // cards that go to zhuangjia 
// jiao de pai - track what cards are asked for -- should make it an array of objects case it's 1 or two friends?? !!!TODO
var askedFriend1 //= 'sace_of_diamonds'
var askedFriend2 // = 'sace_of_spades'
var askedFriend1Condition //= 'First'
var askedFriend2Condition // = 'First'
var cardsBefore1 //= 0 // need to track how many of the cards ie Ace of spades have been played to konw if they're on a team -- how many cards of the called card need to be played before theyre on a team -- when it's zero on a played card, theyre on the team 
var cardsBefore2 //= 0
var outsideCondition1  // need to track if the zhuang called for outside first, if they played their ace??  ehh dont think so 
var outsideCondition2
var teamSet = false

var cardVals = ['2','3','4','5','6','7','8','90','910','jack','queen','rking', 'sace'];

var cardDeck = ["sace_of_diamonds", "2_of_diamonds", "3_of_diamonds", "4_of_diamonds", "5_of_diamonds", "6_of_diamonds", "7_of_diamonds", "8_of_diamonds", "90_of_diamonds", "910_of_diamonds", "jack_of_diamonds", "queen_of_diamonds", "rking_of_diamonds", "sace_of_spades", "2_of_spades", "3_of_spades", "4_of_spades", "5_of_spades", "6_of_spades", "7_of_spades", "8_of_spades", "90_of_spades", "910_of_spades", "jack_of_spades", "queen_of_spades", "rking_of_spades", "sace_of_clubs", "2_of_clubs", "3_of_clubs", "4_of_clubs", "5_of_clubs", "6_of_clubs", "7_of_clubs", "8_of_clubs", "90_of_clubs", "910_of_clubs", "jack_of_clubs", "queen_of_clubs", "rking_of_clubs", "sace_of_hearts", "2_of_hearts", "3_of_hearts", "4_of_hearts", "5_of_hearts", "6_of_hearts", "7_of_hearts", "8_of_hearts", "90_of_hearts", "910_of_hearts", "jack_of_hearts", "queen_of_hearts", "rking_of_hearts", 'zbig_joker', 'vsmall_joker']

// var cardDeck = ["sace_of_diamonds", "2_of_diamonds", "90_of_diamonds", "910_of_diamonds", "jack_of_diamonds", "queen_of_diamonds", "rking_of_diamonds", "sace_of_spades", "2_of_spades", "3_of_spades", "4_of_spades", "5_of_spades ","90_of_spades", "910_of_spades", "rking_of_spades", "sace_of_clubs", "2_of_clubs", "5_of_clubs","910_of_clubs", "jack_of_clubs", "queen_of_clubs", "rking_of_clubs", "sace_of_hearts", "90_of_hearts", "910_of_hearts", "jack_of_hearts", "queen_of_hearts", "rking_of_hearts"]

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

function tallyScoreByTeam(scores, winner) {
	// for team not on zhuang jia
	var totalpts = scores.filter(x=> x.joinedZhuang == false).map(x=>x.points).reduce((acc, curr) => acc + curr, 0)
	
	console.log('tallyScoreByTeam', totalpts)
	
	return totalpts
	
}

function convertCardToSVGName(cardVal, suit) {
	if (cardVal == 'Ace') {
		cardVal = 'sace'
	} else if (cardVal == 'King') {
		cardVal = 'rking' 
	} else if (cardVal == "10") {
		cardVal = "910"
	} 

	return `${cardVal}_of_${suit}`
}

function determineFriends(condition) {
	// find out how many times the card needs to be played before somebody is on your team
	
	var first = ['First', 'Outside first', 'Dead']
	if (first.includes(condition)) {
		return 0
	} else if (condition == 'Second') {
		return 1
	} else if (condition == 'Third') {
		return 2
	}
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

function getPatternFreq(playedStats, trumpCard) {	

	
	if (playedStats.allSameSuit) {
		// if theyre all the same suit, check to see if it's a tuolaji ie they played more than one pair 
		var cards = Object.keys(playedStats.cards).sort()
		if (freq[2] > 1 || freq[3] > 1){
			// if played more than one card 
			var initInd = cardValsWithoutTrump.indexOf(cards[0].split('_')[0])

			for (var i = 1; i < cards.length; i++) {
				var ind = cardValsWithoutTrump.indexOf(cards[i].split('_')[0])	
			}	
		}
		
	}
	// MAKE SURE TO CHECK FOR CONSECUTIVE PAIRS OR CONNECTED ACE
	return freq
}


function checkIfPatternsMatch(pattern1, pattern2) {

	// returns true if same patterns 

	if (pattern1.length != pattern2.length){
		return false
	} else {
		for (var i = 0; i < pattern1.length; i++){
			if (pattern1[i] != pattern2[i]){
				return false
			}
		}
	}

	return true
}

function beatHand(originalHand, newHand, biAttempt, trumpCard) {
	// biAttempt = true if original hand is fu and new hand is all zhu
	// FOR FU PAI ONLY that match suit - OR IF ALL ZHU??? 
	// given stats of 2 card hands, find the bigger zhaopengyou hand 
	// returns true if new hand beats previous high hand 
	var patternMatch = checkIfPatternsMatch(originalHand.freq, newHand.freq)
	
	var trumpSuit = trumpCard.split('_')[2]
	var trumpCardNum = trumpCard.split('_')[0]

	// make sure suits match unless it's a biattempt 
	if (newHand.allSameSuit && Object.keys(newHand.suits)[0] == Object.keys(originalHand.suits)[0]) {
		var matchingSuit = true
	}
	console.log('beat hand', newHand)
	console.log("pattern match status ", patternMatch)

	if (matchingSuit || biAttempt) {
		if (originalHand.zimeidui.length > 0) {

			// if highest hand was a zimeidui, check to make sure pattern matches 
			var zimeiduiPatternOK = checkIfPatternsMatch(originalHand.zimeiduiPattern, newHand.zimeiduiPattern)
			
			if (zimeiduiPatternOK) {
				// if pattern matches, find higher hand	
				if (!biAttempt) {
					if (newHand.zimeidui > originalHand.zimeidui){
						return true
					} else {
						return false
					}	
				} else {
					// if zhu vs fu, return true if pattern matches (***including if they tacked on an ace***)
					if (patternMatch) {
						return true
					} else {
						return false
					}
				} 
			} else {
				return false
			}
			
		} 

		if (originalHand.triples.length > 0) {
		// if original highest hand is just a triple 
			if (!biAttempt) {
				if (newHand.triples > originalHand.triples) {
					return true
				} else {
					return false
				}	
			} else if (patternMatch){
				// if bi attempt and pattern matches
				return true
			} else {
				// don't think this triggers ever 
				return false
			}
			
		} 

		if (originalHand.pairs.length > 0) {
		// if original highest hand is just a pair
			if (!biAttempt) {
				if (newHand.pairs > originalHand.pairs) {
					return true
				} else {
					return false
				}	
			} else if (patternMatch) {
				// if bi attempt, just need to match the pattern 
				return true
			} else {
				return false
			}

		} 

		if (originalHand.singles.length > 0) {
			if (!biAttempt){				
				if (newHand.singles > originalHand.singles) {
					return true
				} else {
					return false
				}	
			} else if (patternMatch) {				
				return true
			} else {
				return false
			}
			
		}
	}
	
}


function getCardStats(cards, trumpCard) {

	var trumpSuit = trumpCard.split('_')[2]
	var trumpCardNum = trumpCard.split('_')[0]

	var cardVals = ['2','3','4','5','6','7','8','90','910','jack','queen','rking', 'sace', `t${trumpCardNum}`, `u${trumpCardNum}`, 'vsmall', 'zbig'];
	
	var cardValsWithoutTrump = cardVals.filter(x=>x != trumpCardNum)
	
	var freq = [0, 0, 0, 0] // placeholder for 0 index, index refers to singles/pairs/triples ie freq[1] is how many single cards played 

	// get stats on cards played 
	var cardStats = {} 
	cardStats.cards = {} // track how many of each card played (eg pairs, triples)
	cardStats.suits = {}
	cardStats.trumpCards = 0
	cardStats.allZhu = false
	cardStats.allSameSuit = false
	cardStats.hand = cards
	cardStats.singles = []
	cardStats.pairs = []
	cardStats.triples = []
	cardStats.zimeidui = [] // detect zimeidui, if zimeidui, remove from pairs/triples 
	cardStats.zimeiduiPattern = []  // need sep freq for zimeidui so 
	cardStats.patternType = []

	for (var i = 0; i < cards.length; i++){
		var s = cards[i].split('_')[2]		

		var cardName = cards[i]

		// check to see if matching suit or all trump cards -- undefined = joker 
		if (s == undefined || s == trumpSuit || cards[i].includes(trumpCardNum)) {
			cardStats.trumpCards = cardStats.trumpCards + 1

			// deal with trump eg if fu zhu 8 or zhu 8 -- append u or t to make it sort 
			if (cards[i].includes(trumpCardNum)){
				if (s == trumpSuit) {
					// rename card b/c it's zhu 8					
					cardName = `u${cards[i]}`
				} else {
					// fu zhu 	
					cardName = `t${cards[i]}`
				}
			}
		} else if (!cardStats.suits[s]) {
			// console.log('no joker, new suit') 
			cardStats.suits[s] = 1
		} else if (s != undefined) {
			// make sure not joker 
			cardStats.suits[s] = cardStats.suits[s] + 1	
		}

		if (!cardStats.cards[cardName]) {
 			cardStats.cards[cardName] = 1
		} else {
			cardStats.cards[cardName] = cardStats.cards[cardName] + 1 
		}
	
	}

	var cardTypes = Object.keys(cardStats.cards)

	for (var i = 0; i < cardTypes.length; i++) {
		freq[cardStats.cards[cardTypes[i]]]++ 
		if (cardStats.cards[cardTypes[i]] == 1) {
			cardStats.singles.push(cardTypes[i])
			cardStats.patternType.push('singles')
		} else if (cardStats.cards[cardTypes[i]] == 2) {
			cardStats.pairs.push(cardTypes[i])
			cardStats.patternType.push('pairs')
		} else if (cardStats.cards[cardTypes[i]] == 3) {
			cardStats.triples.push(cardTypes[i])
			cardStats.patternType.push('triples')
		}
	}

	cardStats.freq = freq

	// find zimeidui
	if (cardStats.pairs.length > 1 || cardStats.triples.length > 1) {
		var zimeidui = cardStats.pairs.concat(cardStats.triples).sort()
		var zimeiduiVals = []
		for (var i = 0; i < zimeidui.length - 1; i++){				

			var dist = cardValsWithoutTrump.indexOf(zimeidui[i+1].split('_')[0]) - cardValsWithoutTrump.indexOf(zimeidui[i].split('_')[0])

			if (dist == 1) {
				// if connected pairs/triples, remove from pairs/triples list 
				cardStats.pairs = cardStats.pairs.filter(x=> x != zimeidui[i+1] && x != zimeidui[i])
				cardStats.triples = cardStats.triples.filter(x=> x != zimeidui[i+1] && x != zimeidui[i])
				
				//create a zimeidui list 
				if (!zimeiduiVals.includes(zimeidui[i])) {
					zimeiduiVals.push(zimeidui[i])

					if (!cardStats.patternType.includes('zimeidui')){
						cardStats.patternType.push('zimeidui')
					}
					
				}

				if (!zimeiduiVals.includes(zimeidui[i+1])) {
					zimeiduiVals.push(zimeidui[i+1])

					if (!cardStats.patternType.includes('zimeidui')){
						cardStats.patternType.push('zimeidui')
					}
				}
				cardStats.zimeidui = zimeiduiVals.sort()
			}

		}

		for (var j = 0; j< cardStats.zimeidui.length; j++){
			// get zimeidui pattern 
			cardStats.zimeiduiPattern.push(cardStats.cards[cardStats.zimeidui[j]])
		}
		
	}

	if (cardStats.trumpCards == cards.length){
		cardStats.allZhu = true
		cardStats.allSameSuit = true
	} 

	if (Object.keys(cardStats.suits).length == 1 && (cards.length == cardStats.suits[cards[0].split('_')[2]])) {
		cardStats.allSameSuit = true
	}

	return cardStats
}


function areYouOnMyTeam(cardsPlayed, cardSought, cardsBefore) {
	// console.log('are you on my team', cardsPlayed, cardSought, cardsBefore)
	var onTheTeam = false
	if (cardsPlayed.includes(cardSought)) {

		// make sure that it's not the zhuangjia playing that's affecting cardsbefore!!!*** TODO
		if (cardsBefore == 0){
			console.log('youre on my team')
			// whoever played is is on their team as long as it's not an 'outside and they're not zhuang jia so need ot track who zhuang jia is 
			onTheTeam = true
		} else {			
			cardsBefore = cardsBefore - 1
		}
	}

	return {cardsBefore: cardsBefore, onTheTeam: onTheTeam}
}

function updateWhoseTurn(gameData, playerid) {
	// need to determine end of round and reset turn tracker
	var scoreBoardOrder = gameData.players.map(x => x.id)
	// update whose turn it is 
	var turn = scoreBoardOrder.indexOf(playerid)
	gameData.players[turn].playedHand = true

	if (turn + 1 > scoreBoardOrder.length - 1) {
		// check if it's the last one in order 
		turn = 0
		gameData.whoseTurn = gameData.players[turn].id
	} else {
		// else next person in line 
		turn = turn + 1
		gameData.whoseTurn = gameData.players[turn].id
	}	// 
	return gameData
}

io.on('connection', function (socket){

	console.log('A user connected: ' + socket.id);
	
	// tell player their socket id when they connect 
	io.to(socket.id).emit('playerid', socket.id)

	var randomNames = ['squirtle', 'pikachu', 'snorlax']

	// joinedZhuang to make it easier to determine who is zhuangjia after first; lastRound to determine when the game is over 
	var basicInfo = {name: randomNames[Math.round(Math.random()*2)], id: socket.id, joinedZhuang: false, lastRound: false, points: 0, level: null, playedHand: false, yourTurn: false}
	  // leadsRound = who plays first 
	players.push(socket.id);
	// basicInfo.points = 0 
	// basicInfo.joinedZhuang = false round	 
	playerInfo.push(basicInfo)   // **playerInfo is where order of seating is set.

	// set scoreboard levels 

	socket.on('draw cards', function () {
		// reset in game data 
		scoreBoardData.players = []
		scoreBoardData.players = playerInfo
		scoreBoardData.zhuangJia = {}
		scoreBoardData.whoseTurn = null 
		scoreBoardData.firstSuit = null // what was the suit of the first played hand 
		scoreBoardData.highestHand = {}
		scoreBoardData.highestHand.cards = []

		console.log('reset scoreBoardData', scoreBoardData)
		
		liangData = {}
		liangData.numberFlipped = 0
		liangData.flippedBy = null 
		confirmZhuang = []
		kouDiCards = []  // cards being discarded 

		for (var i = 0; i < players.length; i++) {
			if (scoreBoardData.players[i].level == null){
				scoreBoardData.players[i].level = 2 
			}
			playerInfo[i].zhuang = false
			io.to(players[i]).emit('startGame', {order: i, players: players, playerInfo: playerInfo})  
		}

		// if (players.length > 7)
		if (true) {
			// generate 2 decks 
			var allCards = generateDecks(2)
			numCardsInHand = 23
		}		
		
		var shuffledCards = shuffle(allCards)
		// console.log(shuffledCards)
		var cardInd = 0
		var kouDi = 8  // number of cards at bottom 
		var cardCount = 0
		console.log('shuffledCards', shuffledCards.length)
		bottom8Cards = shuffledCards.splice(shuffledCards.length - 8)
		console.log('bottom8Cards', bottom8Cards)
		console.log('shuffledCards', shuffledCards.length)
		while (cardInd < shuffledCards.length - kouDi) {
		// while (cardInd < 15){
			if (cardInd % players.length == 0) {
				cardCount = cardCount + 1
			}
			var whichPlayer = cardInd % players.length
			// console.log('deal', shuffledCards[cardInd].card)
			io.to(players[whichPlayer]).emit('deal', {card: shuffledCards[cardInd].card, deck:  shuffledCards[cardInd].deck, count: cardCount});
			cardInd = cardInd + 1
		}
   //	  var dealer = setInterval(function() {
			
   //	  	console.log(cardInd, cardCount)
   //	  	// console.log('wtf', players, shuffledCards)
   //	  	if (cardInd < shuffledCards.length - kouDi){
   //	  		if (cardInd % players.length == 0) {
			// 		cardCount = cardCount + 1
			// 	}
			// 	var whichPlayer = cardInd % players.length
			// 	io.to(players[whichPlayer]).emit('deal', {card: shuffledCards[cardInd], count: cardCount});
			// 	cardInd = cardInd + 1	
   //	  	} else {
   //	  		console.log('stop dealing')				
   //	  		clearInterval(dealer)
   //	  	}
			
			// // console.log(`deal ${shuffledCards[cardInd]}`)
   //	  }, 1000)
   		
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
				playerInfo[order].joinedZhuang = true 
				playerInfo[order].yourTurn = true
				scoreBoardData.whoseTurn = data.zhuang.id
				scoreBoardData.zhuangJia = {name: playerInfo[order].name, id: data.zhuang.id, teammates: []}
				// remove zhuangjia from the players list, don't need to track for her ?? or just mark her as zhuangjia team and don't display?  prob the latter just in case we wan ot display it later? 	
				var pts = tallyScoreByTeam(scoreBoardData.players)		
				console.log(pts)
				io.emit('zhuang confirmed', {playerInfo: playerInfo, zhuang: data.zhuang})
				io.to(data.zhuang.id).emit('send bottom 8', {bottom8Cards: bottom8Cards, numCardsInHand: numCardsInHand})
				io.emit('updateScore', {scoreBoard: scoreBoardData})
			}
			
		}
		
	})

	socket.on('call friends', function(data) {
		askedFriend1 = convertCardToSVGName(data.firstAskVal, data.firstAskSuit)
		askedFriend2 = convertCardToSVGName(data.secondAskVal, data.secondAskSuit)

		askedFriend1Condition = data.condition1
		askedFriend2Condition = data.condition2

		cardsBefore1 = determineFriends(data.condition1)
		cardsBefore2 = determineFriends(data.condition2)

		console.log(askedFriend1, askedFriend1Condition, cardsBefore1)
		console.log(askedFriend2, askedFriend2Condition, cardsBefore2)

		io.emit('jiao', data)
	})

	// socket.on('round winner', function(data){
	// 	// record who won the round 
	// 	roundHistory.winner = data.id
	// 	// make sure at least two people clicked the same person before give them points
	// 	var scoreBoardOrder = scoreBoardData.players.map(x => x.id)

	// 	scoreBoardData.players[scoreBoardOrder.indexOf(data.id)].points = scoreBoardData.players[scoreBoardOrder.indexOf(data.id)].points + pointsInRound

	// 	var pts = tallyScoreByTeam(scoreBoardData.players)		
	// 	console.log(pts)

	// 	io.emit('updateScore', {scoreBoard: scoreBoardData})
	// })

	socket.on('can I go', function (cardHand) {

		var playedCards = cardHand.cards.map(x=>x.card)

		if (cardHand.cards.length > 0) {

			// check see that it's that player's turn to play their hand, dont let people play out of order		and don't let ppl play out of suit 
			// make sure theyve played the right number of cards or that they're the first to play
			if (cardHand.player == scoreBoardData.whoseTurn && (playedCards.length == scoreBoardData.highestHand.cards.length || scoreBoardData.highestHand.cards.length == 0)) {

				var followedSuit = false

				if (scoreBoardData.players.filter(x=>x.playedHand == true).length == 0) {
					// first person played, set them as highest hand
					// first play has to be all the same suit 
					scoreBoardData.highestHand.playedBy = cardHand.player
					scoreBoardData.highestHand.cards = playedCards.sort()
					scoreBoardData.highestHand.cardStats = getCardStats(playedCards, scoreBoardData.zhuCard)
						
					// set what leading suit is to make sure ppl follow suit later
					var firstSuit = scoreBoardData.highestHand.cardStats.allZhu ? 'zhu' : Object.keys(scoreBoardData.highestHand.cardStats.suits)[0]
					scoreBoardData.firstSuit = firstSuit

					followedSuit = true
				} else {
					// for all hands played after the first person
					// need to make sure that they play either correct suit or zhu pai or are out of suit if they play zhu pai 
					// check that they followed suit or dont have that suit if theyre not going first 
					var playedStats = getCardStats(playedCards, scoreBoardData.zhuCard)
					var remainingCardStats = getCardStats(cardHand.remainingCards.map(x=>x.card), scoreBoardData.zhuCard)


					if (playedStats.allZhu && scoreBoardData.firstSuit != 'zhu') {
						// make sure that they're out of cards of the suit theyre supposed to play if theyre trying to bi
						followedSuit = cardHand.remainingCards.map(x=>x.card.split('_')[2]).filter(x=>x == scoreBoardData.firstSuit).length == 0 ? true : false

						var errMsg = !followedSuit ? `You cannot bi while you still have ${scoreBoardData.firstSuit} in your hand.` : ''
						console.log('bi attempt ok? ', followedSuit)
					} else if (!playedStats.allZhu && scoreBoardData.firstSuit == 'zhu') {
						// if they lead wit zhu, make sure they dont have zhu left 		
						followedSuit = remainingCardStats.trumpCards == 0 ? true : false
						var errMsg = !followedSuit ? "Check your hand and play a trump card. Diao Zhu." : ''
						console.log('out of zhu', followedSuit)
					} else if (playedStats.allZhu && scoreBoardData.firstSuit == 'zhu'){
						// leading suit is fu card, just check if suit matches 
						followedSuit = true
						console.log('lead with zhu', followedSuit)
					} else if (scoreBoardData.firstSuit != 'zhu'){
						// you either follow suit or are out of the suit 
						followedSuit = playedStats.allSameSuit && Object.keys(playedStats.suits)[0] == scoreBoardData.firstSuit ? true : !remainingCardStats.suits[scoreBoardData.firstSuit] ? true : false

						var errMsg = !followedSuit ? `Check your hand and play your ${scoreBoardData.firstSuit}` : ''

						console.log('regular card play follow suit? ', followedSuit, scoreBoardData.firstSuit, Object.keys(playedStats.suits)[0])
						console.log('remaining cards', !remainingCardStats.suits[scoreBoardData.firstSuit])
					}
				}
							
				if (followedSuit){
					socket.emit('play your cards')		
				} else {
					io.to(cardHand.player).emit('error', errMsg)
					console.log('follow suit')
				}
			} else if (playedCards.length != scoreBoardData.highestHand.cards.length) {
				// 
				console.log('not the right number of cards')			
				console.log(playedCards, scoreBoardData.highestHand.cards, scoreBoardData.whoseTurn, scoreBoardData.highestHand.cards.length == 0)
				
			} else {
				console.log('not your turn')
			}
		}
		
	})

	socket.on('take back hand', function(cards) {
		console.log(cards)
		// need to make sure that higher hand is higher and that the style matches, ie can't select a pair of a zimeidui
		var higherHand = cards.higherHand.map(x=>x.card)
		var lowerHand = cards.lowerHand.map(x=>x.card)

		var challengeStats = getCardStats(higherHand, scoreBoardData.zhuCard)

		var validChallenge = false

		// then make sure that the challenger has higher cards for the cards they challenge 
		for (var i = 0; i < cardHistory[0].stats.patternType.length; i++) {

			// console.log('match pattern', challengeStats.patternType[0], cardHistory[0].stats.patternType[i])
			if (challengeStats.patternType[0] == cardHistory[0].stats.patternType[i] && higherHand.length == lowerHand.length){
				validChallenge = true
			}
			
		}
			
		if (validChallenge){

			console.log("take it back", cardHistory)
			
			var origStats = getCardStats(lowerHand, scoreBoardData.zhuCard)

			var challengeHand = beatHand(origStats, challengeStats, false, scoreBoardData.zhuCard)

			if (challengeHand) {
				// send id of first person 
				io.emit('play smaller', { cardHistory: cardHistory})
				// return cards 
				for (var j = 0; j < cardHistory.length; j++) {
					io.to(cardHistory[j].player).emit('return cards', {cards: cardHistory[j].cards, lowerHand: cards.lowerHand, lowerHandId: cardHistory[0].player})
						
				}

				// reset data
				scoreBoardData.highestHand = {}
				scoreBoardData.highestHand.cards = []
				scoreBoardData.whoseTurn = cardHistory[0].player

				// reset round data 
				pointsInRound = 0
				roundHistory = {}
				cardHistory = []
				scoreBoardData.players.forEach(x=> x.playedHand = false)

			}
			// reset card/round history
			// console.log(cardHistory[0].stats)
			console.log('challengeHand', challengeHand)
			console.log('challengeStats', challengeStats)
			
		}


		
	})

	socket.on('playHand', function (cardHand) {

		var playedCards = cardHand.cards.map(x=>x.card)

		// need to determine 3 main things - whose turn it is, are they joining a team, is it the end of the game
		// server needs to keep track of what cards are played in a round and who plays it so we can clear the hand later / track for history	 	
		//array of objects w/keys where user is the key and cards is the value

		var playedStats = getCardStats(playedCards, scoreBoardData.zhuCard)

		// for non round leading hands, check to see whose is higher
		// if (followedSuit) {
		if (scoreBoardData.highestHand.cardStats.allZhu) {
			// highest hand is zhu, need to beat the card, but must have zhu 
			if (playedStats.allZhu) {
				var newLeader = beatHand(scoreBoardData.highestHand.cardStats, playedStats, false, scoreBoardData.zhuCard)
				if (newLeader){
					// if new highest hand, update data 
					scoreBoardData.highestHand.cardStats = playedStats
					scoreBoardData.highestHand.playedBy = cardHand.player
					scoreBoardData.highestHand.cards = playedCards  
				}	
			}
			
		} else {
			// highest hand is a fu card, need to beat the card if not playing zhu.  if zhu, then can match value (ie both play 3s but diff suit) as long as pattern matches 

			if (playedStats.allZhu) {
				// attempt to bi
				var newLeader = beatHand(scoreBoardData.highestHand.cardStats, playedStats, true, scoreBoardData.zhuCard)
			} else {
				// regular card play
				console.log('regular card play')
				var newLeader = beatHand(scoreBoardData.highestHand.cardStats, playedStats, false, scoreBoardData.zhuCard)
			}
			
			if (newLeader){
				// if new highest hand, update data 
				scoreBoardData.highestHand.cardStats = playedStats
				scoreBoardData.highestHand.playedBy = cardHand.player
				scoreBoardData.highestHand.cards = playedCards  
			}	
		}

		for (var i = 0; i < playedCards.length; i++) { 
			pointsInRound = pointsInRound + countPoints(playedCards[i])
		}

		var hand = {}
		hand.player = cardHand.player
		hand.cards = cardHand.cards
		hand.stats = playedStats
		cardHistory.push(hand)	  
		roundHistory.points = pointsInRound
		roundHistory.cardHistory = cardHistory

		var pts = tallyScoreByTeam(scoreBoardData.players)
		console.log(pts)

		// // update whose turn it is 
		scoreBoardData = updateWhoseTurn(scoreBoardData, cardHand.player)
			
		// // need to determine end of round and reset turn tracker
		var scoreBoardOrder = scoreBoardData.players.map(x => x.id)			 
		
		if (scoreBoardData.players.filter(x=>x.playedHand == true).length == scoreBoardData.players.length) {
			//everybody has played a hand, determine winner of round and set who's playing first
			var winnerID = scoreBoardData.highestHand.playedBy
			
			scoreBoardData.whoseTurn = winnerID
			console.log('winner ', winnerID)

			scoreBoardData.players[scoreBoardOrder.indexOf(winnerID)].points = scoreBoardData.players[scoreBoardOrder.indexOf(winnerID)].points + pointsInRound

			gameHistory.push(roundHistory)

			// clear the board after 2 seconds 
			setTimeout(function() {
				io.emit('clearTable')

				scoreBoardData.highestHand = {}
				scoreBoardData.highestHand.cards = []

				// reset round data 
				pointsInRound = 0
				roundHistory = {}
				cardHistory = []
				scoreBoardData.players.forEach(x=> x.playedHand = false)

			}, 2000)	
			
		} 

		// console.log('play', cardHand)
		console.log('playhand scoreBoard', scoreBoardData)
		
		// roundHistory = roundHistory.concat(hand)

		// check to see if they played a called card to be on a team if teams arent set yet 
		if (!teamSet) {
			// check to see if they're on your team 
			// (cardsPlayed, cardSought, condition, cardsBefore)
			var friend1 = areYouOnMyTeam(playedCards, askedFriend1, cardsBefore1)
			cardsBefore1 = friend1.cardsBefore
			var friend2 = areYouOnMyTeam(playedCards, askedFriend2, cardsBefore2)
			cardsBefore2 = friend2.cardsBefore

			if (friend1.onTheTeam == true || friend2.onTheTeam == true) {
				scoreBoardData.players[scoreBoardOrder.indexOf(cardHand.player)].joinedZhuang = true
				scoreBoardData.zhuangJia.teammates.push(scoreBoardData.players[scoreBoardOrder.indexOf(cardHand.player)].name)
			}
			
			console.log(friend1, friend2) 
		}

		// if everybody has played their last hand, check koudi, add points depending on which team won
		if (cardHand.lastRound == true) {
			scoreBoardData.players[scoreBoardOrder.indexOf(cardHand.player)].lastRound = true
			// add kou di points -- track kou di on server side??? 
			// calculate points by team --
			var totalPoints = tallyScoreByTeam(scoreBoardData.players)
			console.log('final score', totalPoints)

			var kouDiPoints = 0
			for(var i = 0; i < kouDiCards.length; i++) {
				kouDiPoints = kouDiPoints + countPoints(kouDiCards[i])
			}
			// NEED TO DEAL WITH WHO WON THE LAST HAND FOR KOUDI
			// change levels and set zhuangjia 
			if (totalPoints == 0) {
				// zhuangjia goes up 3 
				scoreBoardData.players.filter(x=> x.joinedZhuang == true).map(x => x.level = x.level + 3)

			} else if (totalPoints < 60) {
				//zhuang jia team goes up 2 levels 
				scoreBoardData.players.filter(x=> x.joinedZhuang == true).map(x => x.level = x.level + 2)


			} else if (totalPoints < 110) {
				//zhuang jia team goes up 1 level
				scoreBoardData.players.filter(x=> x.joinedZhuang == true).map(x => x.level = x.level + 1)


			} else if (totalPoints < 160) {
				// between 110-160, shangtai 
				

			} else if (totalPoints < 210) {
				//between 160 and 210, go up one, switch zhuangjia sides 
				scoreBoardData.players.filter(x=> x.joinedZhuang == false).map(x => x.level = x.level + 1)

			} else if (totalPoints < 260) {
				// btwn 210-260, zhuangjia flips, team goes up 2 levels 
				scoreBoardData.players.filter(x=> x.joinedZhuang == false).map(x => x.level = x.level + 2)
				
			} else {
				// 260+, go up 3 levels 
				scoreBoardData.players.filter(x=> x.joinedZhuang == false).map(x => x.level = x.level + 3)

			}
			
			console.log('koudi points', kouDiPoints)
			 
		} 

		// need to track scores by team once teams are found 

		io.emit('updateScore', {scoreBoard: scoreBoardData})
		io.emit('cardPlayed', {cards: playedCards, player: cardHand.player, points: pointsInRound, detailed: cardHand.cards});
		
	});

	socket.on('kouDi', function(discardedCards) {
		console.log('koudi', discardedCards) 
		kouDiCards = discardedCards
		
		// return how many points discarded?? 
		io.emit('')

	})

	// socket.on('clearRound', function() {
	// 	// calculate number of points in the round and who won the points 
	// 	console.log('clear round', roundHistory, pointsInRound)
	// 	// gameHistory.push(roundHistory)
	// 	// console.log('clearRound', data)
	// 	// tell what cards were played that round
	// 	io.emit('clearTable')

	// 	scoreBoardData.highestHand = {}
	// 	scoreBoardData.highestHand.cards = []

	// 	// reset round data 
	// 	pointsInRound = 0
	// 	roundHistory = {}
	// 	cardHistory = []
	// 	scoreBoardData.players.forEach(x=> x.playedHand = false)

	// })

	socket.on('disconnect', function () {
		console.log('A user disconnected: ' + socket.id);
		// var competitors = scoreBoardData.map(x => x.id)
		// var removeP = competitors.indexOf(socket.id)

		// scoreBoardData.splice(removeP, 1)
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
		// scoreBoardData.players[order].name = data.name   // DO I NEED THIS???
		
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
		// console.log('liang', data)
		// console.log('liangData', liangData)
		console.log('liang data', data)
		var scoreBoardOrder = scoreBoardData.players.map(x => x.id)
		// update whose turn it is 
		var p = scoreBoardOrder.indexOf(data.id)
		// console.log(p)
		if (data.card.length > 0) {
				// check if card already flipped 
			if (liangData.flippedBy == null) {
				// console.log('first zhu', scoreBoardData.players[p].level, data.card.includes(scoreBoardData.players[p].level), data.card[0])
				// if nobody flipped yet, make sure they flipped right level
				if (data.card[0].includes(scoreBoardData.players[p].level) && data.card.length == 1) {
					//TODO need to make sure they haven't already flipped this one ie click same card twice 
					
					liangData.numberFlipped = 1
					liangData.name = data.name
					liangData.flippedBy = data.id  // need to announce who flipped it 

					var suits = ['diamonds', 'spades', 'clubs', 'hearts'];
					for (var i = 0; i < suits.length; i++) {
						if (data.card.includes(suits[i])){
							liangData.suit = suits[i]
							scoreBoardData.trumpSuit = suits[i]
						}
					}
					
					firstLiang.card = data.card[0]
					firstLiang.name = data.id
				
					scoreBoardData.zhuCard = data.card[0]

					liangData.zhuCard = data.card[0]
					// console.log('zhu flipped', liangData)
					io.emit('zhuLiangLe', {liangData: liangData})
				} else if (data.card.length > 1){
					// check that all cards match 
					var allMatch = true
					for (var i = 0; i < data.card.length; i++) {
						if (data.card[0] != data.card[i]) {
							allMatch = false
						}
					}

					firstLiang.card = data.card[0]
					firstLiang.name = data.id

					liangData.numberFlipped = data.card.length
					liangData.name = data.name
					liangData.flippedBy = data.id  // need to announce who flipped it 
					
					liangData.suit = suit
					scoreBoardData.trumpSuit = suit

					scoreBoardData.zhuCard = data.card[0]
					liangData.zhuCard = data.card[0]

					io.emit('zhuLiangLe', {liangData: liangData})

				}

			} else if (data.card.length > 1) {
				// if somebody already flipped, need more than 1 zhu 
				// need to make sure can't change zhu 

				// check that all cards match 
				var allMatch = true
				for (var i = 0; i < data.card.length; i++) {
					if (data.card[0] != data.card[i]) {
						allMatch = false
					}
				}
				var suit = data.card[0].split('_')[2]

				// priority matching --must be same suit and have equal number or more 
				if (allMatch && firstLiang.card == data.card[0] && firstLiang.name == data.id && (data.card.length >= liangData.numberFlipped)) {
					// console.log('priority')
					liangData.numberFlipped = data.card.length
					liangData.name = data.name
					liangData.flippedBy = data.id  // need to announce who flipped it 
					
					liangData.suit = suit
					scoreBoardData.trumpSuit = suit

					scoreBoardData.zhuCard = data.card[0]
					liangData.zhuCard = data.card[0]

				} else if (allMatch && firstLiang.card != data.card[0] && firstLiang.name != data.id && (data.card.length > liangData.numberFlipped)) {
					
					// console.log('beating zhu')
					// flipping diff zhu 
					liangData.numberFlipped = data.card.length
					liangData.name = data.name
					liangData.flippedBy = data.id  // need to announce who flipped it 
					
					liangData.suit = suit
					scoreBoardData.trumpSuit = suit

					scoreBoardData.zhuCard = data.card[0]
					liangData.zhuCard = data.card[0]

				} else {
					io.emit('fail', {msg: 'have you already liang'})
				}
				io.emit('zhuLiangLe', {liangData: liangData})

			} else {
			// reject message ie invalid card
				io.emit('fail', {msg: 'what are you doing??'})
			}
		}
		
		// console.log(liangData, firstLiang)		
	})	
		// need to check that nobody else has flipped and that it's the right level

	// })
	// socket.on("disconnect", () => {
	//	 console.log(socket.id, "Client disconnected");
	//	 // remove player from list when disconnect and update player info 
	//	 var sockets = player_list.map(x=>x.id)
	//	 player_list = player_list.filter((x)=>x.id != socket.id)
	//	 io.emit('join game', player_list)

	//	 if (player_list.length == 0) {
	//		 // clear chat when everybody leaves
	//		 chat = []   
	//	 }

	//	 delete socket_list[socket.id]; 
		
	// });
});

server.listen(port, function () {
	console.log('Server started!');
});