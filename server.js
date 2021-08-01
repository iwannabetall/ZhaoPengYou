const socketIo = require("socket.io")
const express = require('express');
const http = require('http')
const randomWords = require('random-words')
const { v4: uuidv4 } = require('uuid');

var app = express();

//Port from environment variable or default - 4001
const port = process.env.PORT || 3000;

const server = http.createServer(app); 

const io = socketIo(server, {
	// stop socket from closing automatically 
	pingTimeout: 60000
});  // set io to a socket w/the instance of our server

const gamedata = require('./controllers/gamedata.js')(io)
const axios = require('axios')

// app.use(express.logger());
app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));

// app.get('/', function(req, res){
// 	res.render('/public/index.html');
// });
// tell reach router to serve index.html for all routes
app.get('*', function(req,res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/savegamedata', gamedata.saveGameData)
app.post('/resavedata', gamedata.resaveData)

function createGameData(roomId){
	console.log('createGameData', roomId)
	// gamedata key passed back and forth to client 
	allGameData[roomId] = {}
	allGameData[roomId].gamedata = {}
	allGameData[roomId].gamedata.players = []  // player order 
	allGameData[roomId].gamedata.playerInfo = [];
	allGameData[roomId].gamedata.gameHistory = []  // array of round History
	allGameData[roomId].gamedata.roundHistory = {}   // contains cardHisotry, points scored and by whom 
	allGameData[roomId].gamedata.cardHistory = []  // cards played in a round by each player, embedded in roundHistory
	allGameData[roomId].gamedata.pointsInRound = 0
	allGameData[roomId].gamedata.roundWinner = null// who won the round, either points or team
// var scoreBoardData = {} // what points and levels each player has.  should track who was zhuang in each game and what the teams were 
	allGameData[roomId].gamedata.gameNumber = 1 // track how many games they've played, if it's the first, need to fight for zhuang jia 
	allGameData[roomId].gamedata.scoreBoardData = {} // what points and levels each player has.  should track who was zhuang in each game and what the teams were 	
	allGameData[roomId].gamedata.scoreBoardData.players = []
	// allGameData[roomId].gamedata.scoreBoardData.players = playerInfo
	allGameData[roomId].gamedata.scoreBoardData.zhuangJia = {}
	allGameData[roomId].gamedata.scoreBoardData.whoseTurn = null 
	allGameData[roomId].gamedata.scoreBoardData.firstSuit = null // what was the suit of the first played hand for that round 
	allGameData[roomId].gamedata.scoreBoardData.highestHand = {}
	allGameData[roomId].gamedata.scoreBoardData.highestHand.cards = []
	// console.log('reset scoreBoardData', scoreBoardData)	

	allGameData[roomId].gamedata.confirmZhuang = [] // track who has confirmed zhuangjia -- needs to match all players??? whati f there's an issue with the server tracking who's connected? or should i just do all player names? what if there's duplicate names? 
	allGameData[roomId].gamedata.liangData = {}
	allGameData[roomId].gamedata.liangData.numberFlipped = 0
	allGameData[roomId].gamedata.liangData.suitsFlipped = [] // make sure you dont flip one back 
	allGameData[roomId].gamedata.liangData.flippedBy = null 
	allGameData[roomId].gamedata.firstLiang = {}
	allGameData[roomId].gamedata.firstLiang.name = null
	allGameData[roomId].gamedata.gameLevel = 2 // what level are we playing 
	allGameData[roomId].gamedata.gameStarted = false	
	allGameData[roomId].gamedata.askedFriend1 //= 'sace_of_diamonds'
	allGameData[roomId].gamedata.askedFriend2 // = 'sace_of_spades'
	allGameData[roomId].gamedata.askedFriend1Condition //= 'First'
	allGameData[roomId].gamedata.askedFriend2Condition // = 'First'
	allGameData[roomId].gamedata.cardsBefore1 //= 0 // need to track how many of the cards ie Ace of spades have been played to konw if they're on a team -- how many cards of the called card need to be played before theyre on a team -- when it's zero on a played card, theyre on the team 
	allGameData[roomId].gamedata.cardsBefore2 //= 0
	allGameData[roomId].gamedata.outsideCondition1  // need to track if the zhuang called for outside first, if they played their ace??  ehh dont think so 
	allGameData[roomId].gamedata.outsideCondition2
	
	// keep this in a sep key -- pass game data to client, but not this one.  only stored for backup 
	allGameData[roomId].allPlayerCards = {} // track what cards each player has.  map keyed by playerid with array of cards
	allGameData[roomId].kouDiCards // cards being discarded for the bottom 8
	allGameData[roomId].bottom8Cards

}

var globalPlayers = {}
var allSockets = {}

var allGameData = {}  // keyed by room id 

// let players = [];  // player ids 
// var playerInfo = [];

// var gameHistory = [] // array of round History
// var roundHistory = {} // contains cardHisotry, points scored and by whom 
// var cardHistory = [] // cards played in a round by each player, embedded in roundHistory
// var pointsInRound = 0 // points played in a ro`und 
// // var votes = 0 
// var roundWinner // who won the round, either points or team
// // var scoreBoardData = {} // what points and levels each player has.  should track who was zhuang in each game and what the teams were 
// var confirmZhuang = [] // track who has confirmed zhuangjia -- needs to match all players??? whati f there's an issue with the server tracking who's connected? or should i just do all player names? what if there's duplicate names? 
// var liangData
// var firstLiang = {}  // keep track of who flips zhu first case they get flipped and need to set priority 
// firstLiang.name = null

// var startingLevel = 2 
// var gameStarted = false  // 

// var numCardsInHand  // how many cards in hand to start
// var kouDiCards
// var bottom8Cards // cards that go to zhuangjia 
// // jiao de pai - track what cards are asked for -- should make it an array of objects case it's 1 or two friends?? !!!TODO
// var askedFriend1 //= 'sace_of_diamonds'
// var askedFriend2 // = 'sace_of_spades'
// var askedFriend1Condition //= 'First'
// var askedFriend2Condition // = 'First'
// var cardsBefore1 //= 0 // need to track how many of the cards ie Ace of spades have been played to konw if they're on a team -- how many cards of the called card need to be played before theyre on a team -- when it's zero on a played card, theyre on the team 
// var cardsBefore2 //= 0
// var outsideCondition1  // need to track if the zhuang called for outside first, if they played their ace??  ehh dont think so 
// var outsideCondition2
var roomId 
var teamSet = false

var cardVals = ['2','3','4','5','6','7','8','90','910','jack','queen','rking', 'sace'];

// var cardDeck = ["sace_of_diamonds", "2_of_diamonds", "3_of_diamonds", "4_of_diamonds", "5_of_diamonds", "6_of_diamonds", "7_of_diamonds", "8_of_diamonds", "90_of_diamonds", "910_of_diamonds", "jack_of_diamonds", "queen_of_diamonds", "rking_of_diamonds", "sace_of_spades", "2_of_spades", "3_of_spades", "4_of_spades", "5_of_spades", "6_of_spades", "7_of_spades", "8_of_spades", "90_of_spades", "910_of_spades", "jack_of_spades", "queen_of_spades", "rking_of_spades", "sace_of_clubs", "2_of_clubs", "3_of_clubs", "4_of_clubs", "5_of_clubs", "6_of_clubs", "7_of_clubs", "8_of_clubs", "90_of_clubs", "910_of_clubs", "jack_of_clubs", "queen_of_clubs", "rking_of_clubs", "sace_of_hearts", "2_of_hearts", "3_of_hearts", "4_of_hearts", "5_of_hearts", "6_of_hearts", "7_of_hearts", "8_of_hearts", "90_of_hearts", "910_of_hearts", "jack_of_hearts", "queen_of_hearts", "rking_of_hearts", 'zbig_joker', 'vsmall_joker']

var cardDeck = ["sace_of_diamonds", "2_of_diamonds", "90_of_diamonds", "910_of_diamonds", "jack_of_diamonds", "queen_of_diamonds", "rking_of_diamonds", "sace_of_spades", "2_of_spades", "3_of_spades", "4_of_spades", "5_of_spades ","90_of_spades", "queen_of_hearts", "rking_of_hearts"]

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

	console.log(cards, trumpCard)
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

	// turn = calcTurnCycle(turn, scoreBoardOrder.length)
	gameData.whoseTurn = gameData.players[turn].id

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

// function calcTurnCycle(ind, arrayLength) {
// 	// minus 1 b/c 0 indexed
// 	let ind = ind + 1 > arrayLength - 1 ? 0 : ind + 1
// 	return ind
// }

function getNextZhuang(gameData, currentZhuang, zhuangJiaWon) {

	if (zhuangJiaWon) {
		var zhuangJiaTeam = gameData.scoreBoardData.players.filter(x=> x.joinedZhuang == true).map(x=>x.id)

		var zhuangId = gameData.scoreBoardData.zhuangJia.id
		var zhuangIndex = zhuangJiaTeam.indexOf(zhuangId)
		zhuangIndex = zhuangIndex + 1 > zhuangJiaTeam.length - 1 ? 0 : zhuangIndex + 1
		// zhuangIndex = calcTurnCycle(zhuangIndex, zhuangJiaTeam.length)
		var nextZhuang = zhuangJiaTeam[zhuangIndex].id

	} else { 
		//for losing team -- have to find where zhuangjia was sitting 
		var findZhuang = gameData.scoreBoardData.players.map(x=>x.id).indexOf(zhuangId)
		while (gameData.scoreBoardData.players[findZhuang].joinedZhuang == true) {

			if (findZhuang + 1 > gameData.scoreBoardData.players.length - 1) {
				findZhuang = 0
			} else {
				findZhuang = findZhuang + 1	
			}
			console.log('findZhuang', findZhuang)
		}
		console.log(gameData.scoreBoardData.players)

		console.log(gameData.scoreBoardData.players[findZhuang])
		var nextZhuang = gameData.scoreBoardData.players[findZhuang].id
	}	
	
	return nextZhuang

	console.log('zhuangJiaTeam', zhuangJiaTeam)

	console.log('notZhuangTeam', notZhuangTeam)
	console.log('next zhuang if win', zhuangJiaTeam[zhuangIndex])

}

function setZhuangJiaInfo(roomId, pInd, zhuangId) {

	allGameData[roomId].gamedata.scoreBoardData.players[pInd].zhuang = true 
	allGameData[roomId].gamedata.scoreBoardData.players[pInd].joinedZhuang = true 
	allGameData[roomId].gamedata.scoreBoardData.players[pInd].yourTurn = true
	allGameData[roomId].gamedata.scoreBoardData.whoseTurn = zhuangId
	allGameData[roomId].gamedata.scoreBoardData.zhuangJia = {name: allGameData[roomId].gamedata.scoreBoardData.players[pInd].name, id: zhuangId, teammates: []}
	
}




function addPlayerToGame(roomId, playerid) {

	var randomNames = ['squirtle', 'pikachu', 'snorlax']

	// also resets basic game info 
	var basicInfo = {name: randomNames[Math.round(Math.random()*2)], id: playerid, joinedZhuang: false, lastRound: false, points: 0, level: null, playedHand: false, yourTurn: false}

	allGameData[roomId].gamedata.players.push(playerid);
	// basicInfo.points = 0 
	// basicInfo.joinedZhuang = false round	 
	allGameData[roomId].gamedata.scoreBoardData.players.push(basicInfo)   // **playerInfo is where order of seating is set.
	allGameData[roomId].allPlayerCards[playerid] = []

}


function resetGameData(roomId) {
	// var basicInfo = {name: randomNames[Math.round(Math.random()*2)], id: , joinedZhuang: false, lastRound: false, points: 0, level: null, playedHand: false, yourTurn: false}
	for (var i = 0; i < allGameData[roomId].gamedata.scoreBoardData.players.length; i++) {
		allGameData[roomId].gamedata.scoreBoardData.players[i].joinedZhuang = false
		allGameData[roomId].gamedata.scoreBoardData.players[i].lastRound = false
		allGameData[roomId].gamedata.scoreBoardData.players[i].points = 0
		allGameData[roomId].gamedata.scoreBoardData.players[i].yourTurn = false
		allGameData[roomId].gamedata.scoreBoardData.players[i].playedHand = false
	}

	allGameData[roomId].gamedata.scoreBoardData.whoseTurn = null 
	allGameData[roomId].gamedata.scoreBoardData.firstSuit = null // what was the suit of the first played hand 
	allGameData[roomId].gamedata.scoreBoardData.highestHand = {}
	allGameData[roomId].gamedata.scoreBoardData.highestHand.cards = []
	// console.log('reset scoreBoardData', scoreBoardData)
	
	allGameData[roomId].gamedata.liangData = {}
	allGameData[roomId].gamedata.liangData.numberFlipped = 0
	allGameData[roomId].gamedata.liangData.flippedBy = null 
	allGameData[roomId].gamedata.confirmZhuang = []
	allGameData[roomId].kouDiCards = []  // cards being discarded 

	var players = Object.keys(allGameData[roomId].allPlayerCards)

	for (var i = 0; i < players.length; i++) {
		allGameData[roomId].allPlayerCards[players[i]] = []
	}
}

io.on('connection', function (socket){

	// set playerid/cookie/see if they already have one 
	var playeruuid = uuidv4()
	// tell player their socket id when they connect 
	io.to(socket.id).emit('playerid', playeruuid)

	console.log('does socket exist', io.sockets.sockets[socket.id])

	socket.on('create uuid', function() {
		// create reference between socket and player
		globalPlayers[playeruuid] = socket.id	
		allSockets[socket.id] = playeruuid	
		console.log('create id')
	})

	socket.on('has uuid', function(id){
		// console.log('has uuid', id, roomId)

		console.log('has cookie, update socket id')
		playeruuid = id.origid
		// if has id, change the socket that's associated with it 
		globalPlayers[id.origid] = socket.id
		// allSockets[socket.id] = playeruuid
	})
	// console.log(socket.request.headers.referer)
	// console.log(socket.request.url)
	
	console.log('id', playeruuid)
	var url = socket.request.headers.referer 
	
	// joining room via url, ie not creating new room 
	url = url.split('/room/')
	if (url.length > 1) {
		console.log('room id', url[1], allGameData)
		roomId = url[1]
		if (allGameData[roomId]){
			socket.emit('assign room', {roomId: roomId, data: allGameData[roomId]})
			socket.join(roomId)	
			
		} else {
			// if joining a game via a link ie reopening a page via link, need to create url
			console.log('join existing game url')
			createGameData(roomId)
			socket.emit('assign room', {roomId: roomId, data: allGameData[roomId]})
			
		}
		
		// io.to(socket.id).emit('loadGame')
	}

	console.log('A user connected: ' + socket.id);
	
	socket.on('new room', function() {
		// creating new room 
		var roomId = randomWords({exactly: 3, join:'-'})
		var tries = 0

		// make sure the room id is unique
		while (allGameData[roomId] && tries < 10){
			tries ++
			roomId = randomWords({exactly: 3, join:'-'})		
			console.log(tries, roomId)
		}

		if (!allGameData[roomId]) {
			createGameData(roomId)	
			// create new data obj 
			socket.emit('go to room', {roomId: roomId, data: allGameData[roomId]})
			socket.join(roomId)				

		} else {
			console.log('NEED TO HANDLE NO RANDOM WORDS AVAIL')

		}
		// save game data 
		axios({
				method: "POST",
				url: "http://localhost:3000/savegamedata",
				headers: {
				"Content-Type": "application/json"
				},          
				params: {data: allGameData[roomId], gameid: roomId},           
			})
			.then(res => {
				// game data saved 
			})
			.catch(e => {
				console.error(e)
			})

	})

	
	// joinedZhuang to make it easier to determine who is zhuangjia after first; lastRound to determine when the game is over 
	// var basicInfo = {name: randomNames[Math.round(Math.random()*2)], id: socket.id, joinedZhuang: false, lastRound: false, points: 0, level: null, playedHand: false, yourTurn: false}
	//   // leadsRound = who plays first 
	// players.push(socket.id);
	// // basicInfo.points = 0 
	// // basicInfo.joinedZhuang = false round	 
	// playerInfo.push(basicInfo)   // **playerInfo is where order of seating is set.

	// set scoreboard levels 

	socket.on('draw cards', function (roomId) {
		// def need the room info 
		// reset in game data 
		// scoreBoardData.players = []
		// scoreBoardData.players = playerInfo
		// scoreBoardData.zhuangJia = {}
		// scoreBoardData.whoseTurn = null 
		// scoreBoardData.firstSuit = null // what was the suit of the first played hand 
		// scoreBoardData.highestHand = {}
		// scoreBoardData.highestHand.cards = []
		// // console.log('reset scoreBoardData', scoreBoardData)
		
		// liangData = {}
		// liangData.numberFlipped = 0
		// liangData.flippedBy = null 
		// confirmZhuang = []
		// kouDiCards = []  // cards being discarded 
		// console.log(roomId)
		console.log(allGameData[roomId])
		// console.log(allGameData[roomId].gamedata.scoreBoardData.players)
		var players = allGameData[roomId].gamedata.players
		for (var i = 0; i < players.length; i++) {
			if (allGameData[roomId].gamedata.scoreBoardData.players[i].level == null){
				allGameData[roomId].gamedata.scoreBoardData.players[i].level = 2 
			}
			console.log(players[i])
			// playerInfo[i].zhuang = false
			io.to(globalPlayers[players[i]]).emit('startGame', {order: i, players: allGameData[roomId].gamedata.players, playerInfo: allGameData[roomId].gamedata.scoreBoardData.players})  
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
		// console.log('shuffledCards count', shuffledCards.length)
		// console.log(shuffledCards)
		bottom8Cards = shuffledCards.splice(shuffledCards.length - 8)
		console.log('bottom8Cards', bottom8Cards)

		io.in(roomId).emit('gameStatus', 'dealing') 

		while (cardInd < shuffledCards.length) {
		// while (cardInd < 15){
			// console.log(cardInd, shuffledCards[cardInd].card, shuffledCards[cardInd].deck)
			if (cardInd % allGameData[roomId].gamedata.players.length == 0) {
				cardCount = cardCount + 1
			}
			var whichPlayer = cardInd % allGameData[roomId].gamedata.players.length
			var dealToPlayer = allGameData[roomId].gamedata.players[whichPlayer]
			
			allGameData[roomId].allPlayerCards[dealToPlayer].push(`${shuffledCards[cardInd].card}-${shuffledCards[cardInd].deck}`)
			io.to(globalPlayers[dealToPlayer]).emit('deal', {card: shuffledCards[cardInd].card, deck: shuffledCards[cardInd].deck, count: cardCount});
			cardInd = cardInd + 1

			if (cardInd == shuffledCards.length - kouDi) {
				console.log('done dealing')
	   		  // after all cards dealt, emit status update that it's snack time
   				io.in(roomId).emit('gameStatus', 'snack_time') 

			}
		}
   	   		
   // 	  var dealer = setInterval(function() {
			
   // 	  	console.log(cardInd, cardCount)
   // 	  	// console.log('wtf', players, shuffledCards)
   // 	  	if (cardInd < shuffledCards.length - kouDi){
   // 	  		if (cardInd % allGameData[roomId].gamedata.players.length == 0) {
			// 	cardCount = cardCount + 1
			// }
			// var whichPlayer = cardInd % allGameData[roomId].gamedata.players.length
			// var dealToPlayer = allGameData[roomId].gamedata.players[whichPlayer]
			
			// allGameData[roomId].allPlayerCards[dealToPlayer].push(`${shuffledCards[cardInd].card}-${shuffledCards[cardInd].deck}`)
			// io.to(globalPlayers[dealToPlayer]).emit('deal', {card: shuffledCards[cardInd].card, deck: shuffledCards[cardInd].deck, count: cardCount});
			// cardInd = cardInd + 1	

   // 	  	} else {
   // 	  		console.log('stop dealing')				
   // 	  		clearInterval(dealer)
   // 	  	}
			
			// console.log(`deal ${shuffledCards[cardInd]}`)
   	  // }, 1000)


   		
	});

	socket.on('start game', function(){
		io.in(roomId).emit('gameStarted', true)
	})

	socket.on('confirm zhuang', function(data){
		console.log('confirm zhuang', data)
		var order = allGameData[data.roomId].gamedata.players.indexOf(data.zhuang.id)
		if (data.response == false){
			// if one person rejects, send message to all players telling them that X is saying wait 
			io.in(data.roomId).emit('zhuang rejected', {waitingOn: data.responseByPlayer})
		} else {
			allGameData[data.roomId].gamedata.confirmZhuang.push(data.responseByPlayer)
			if (allGameData[data.roomId].gamedata.confirmZhuang.length == allGameData[data.roomId].gamedata.players.length){

				setZhuangJiaInfo(data.roomId, order, data.zhuang.id)
				// allGameData[data.roomId].gamedata.scoreBoardData.players[order].zhuang = true 
				// allGameData[data.roomId].gamedata.scoreBoardData.players[order].joinedZhuang = true 
				// allGameData[data.roomId].gamedata.scoreBoardData.players[order].yourTurn = true
				// allGameData[data.roomId].gamedata.scoreBoardData.whoseTurn = data.zhuang.id
				// allGameData[data.roomId].gamedata.scoreBoardData.zhuangJia = {name: allGameData[data.roomId].gamedata.scoreBoardData.players[order].name, id: data.zhuang.id, teammates: []}
				// remove zhuangjia from the players list, don't need to track for her ?? or just mark her as zhuangjia team and don't display?  prob the latter just in case we wan ot display it later? 	
				var pts = tallyScoreByTeam(allGameData[data.roomId].gamedata.scoreBoardData.players)

				console.log('zhuang confirmed ????')
				io.in(data.roomId).emit('zhuang confirmed', {playerInfo: allGameData[data.roomId].gamedata.scoreBoardData.players, zhuang: data.zhuang})
				io.to(globalPlayers[data.zhuang.id]).emit('send bottom 8', {bottom8Cards: bottom8Cards, numCardsInHand: numCardsInHand})
				io.in(data.roomId).emit('updateScore', {scoreBoard: allGameData[data.roomId].gamedata.scoreBoardData})
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

		io.in(data.roomId).emit('jiao', data)
	})

	// socket.on('round winner', function(data){
	// 	// record who won the round 
	// 	roundHistory.winner = data.id
	// 	// make sure at least two people clicked the same person before give them points
	// 	var scoreBoardOrder = scoreBoardData.players.map(x => x.id)

	// 	scoreBoardData.players[scoreBoardOrder.indexOf(data.id)].points = scoreBoardData.players[scoreBoardOrder.indexOf(data.id)].points + pointsInRound

	// 	var pts = tallyScoreByTeam(scoreBoardData.players)		
	// 	console.log(pts)

	// 	io.in(roomId).emit('updateScore', {scoreBoard: scoreBoardData})
	// })

	socket.on('can I go', function (cardHand) {
		console.log('can i go', cardHand)
		console.log('scoreBoardData.players', allGameData[cardHand.roomId])
		console.log('allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard', allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard)
		var playedCards = cardHand.cards.map(x=>x.card)

		if (cardHand.cards.length > 0) {

			// check see that it's that player's turn to play their hand, dont let people play out of order		and don't let ppl play out of suit 
			// make sure theyve played the right number of cards or that they're the first to play
			if (cardHand.player == allGameData[cardHand.roomId].gamedata.scoreBoardData.whoseTurn && (playedCards.length == allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards.length || allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards.length == 0)) {

				var followedSuit = false

				if (allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=>x.playedHand == true).length == 0) {
					// first person played, set them as highest hand
					// first play has to be all the same suit 
					allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.playedBy = cardHand.player
					allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards = playedCards.sort()
					allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats = getCardStats(playedCards, allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard.card)
						
					// set what leading suit is to make sure ppl follow suit later
					var firstSuit = allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats.allZhu ? 'zhu' : Object.keys(allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats.suits)[0]
					allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit = firstSuit

					followedSuit = true
					console.log('followed suit')
				} else {
					// for all hands played after the first person
					// need to make sure that they play either correct suit or zhu pai or are out of suit if they play zhu pai 
					// check that they followed suit or dont have that suit if theyre not going first 
					var playedStats = getCardStats(playedCards, allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard.card)
					var remainingCardStats = getCardStats(cardHand.remainingCards.map(x=>x.card), allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard.card)


					if (playedStats.allZhu && allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit != 'zhu') {
						// make sure that they're out of cards of the suit theyre supposed to play if theyre trying to bi
						followedSuit = cardHand.remainingCards.map(x=>x.card.split('_')[2]).filter(x=>x == allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit).length == 0 ? true : false

						var errMsg = !followedSuit ? `You cannot bi while you still have ${allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit} in your hand.` : ''
						console.log('bi attempt ok? ', followedSuit)
					} else if (!playedStats.allZhu && allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit == 'zhu') {
						// if they lead wit zhu, make sure they dont have zhu left 		
						followedSuit = remainingCardStats.trumpCards == 0 ? true : false
						var errMsg = !followedSuit ? "Check your hand and play a trump card. Diao Zhu." : ''
						console.log('out of zhu', followedSuit)
					} else if (playedStats.allZhu && allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit == 'zhu'){
						// leading suit is fu card, just check if suit matches 
						followedSuit = true
						console.log('lead with zhu', followedSuit)
					} else if (allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit != 'zhu'){
						// you either follow suit or are out of the suit 
						followedSuit = playedStats.allSameSuit && Object.keys(playedStats.suits)[0] == allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit ? true : !remainingCardStats.suits[allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit] ? true : false

						var errMsg = !followedSuit ? `Check your hand and play your ${allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit}` : ''

						console.log('regular card play follow suit? ', followedSuit, allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit, Object.keys(playedStats.suits)[0])
						console.log('remaining cards', !remainingCardStats.suits[allGameData[cardHand.roomId].gamedata.scoreBoardData.firstSuit])
					}
				}

				if (followedSuit){
					socket.emit('play your cards')		
				} else {
					io.to(cardHand.player).emit('error', errMsg)
					console.log('follow suit')
				}
			} else if (playedCards.length != allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards.length) {
				// 
				console.log('not the right number of cards')			
				console.log(playedCards, allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards, allGameData[cardHand.roomId].gamedata.scoreBoardData.whoseTurn, allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards.length == 0)
				
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

		var challengeStats = getCardStats(higherHand, allGameData[data.roomId].gamedata.scoreBoardData.zhuCard.card)

		var validChallenge = false

		// then make sure that the challenger has higher cards for the cards they challenge 
		for (var i = 0; i < allGameData[data.roomId].gamedata.cardHistory[0].stats.patternType.length; i++) {

			// console.log('match pattern', challengeStats.patternType[0], cardHistory[0].stats.patternType[i])
			if (challengeStats.patternType[0] == allGameData[data.roomId].gamedata.cardHistory[0].stats.patternType[i] && higherHand.length == lowerHand.length){
				validChallenge = true
			}
			
		}
			
		if (validChallenge){

			console.log("take it back", cardHistory)
			
			var origStats = getCardStats(lowerHand, allGameData[data.roomId].gamedata.scoreBoardData.zhuCard.card)

			var challengeHand = beatHand(origStats, challengeStats, false, allGameData[data.roomId].gamedata.scoreBoardData.zhuCard.card)

			if (challengeHand) {
				// send id of first person 
				io.in(data.roomId).emit('play smaller', { cardHistory: allGameData[data.roomId].gamedata.cardHistory})
				// return cards 
				for (var j = 0; j < cardHistory.length; j++) {
					io.to(allGameData[data.roomId].gamedata.cardHistory[j].player).emit('return cards', {cards: allGameData[data.roomId].gamedata.cardHistory[j].cards, lowerHand: cards.lowerHand, lowerHandId: allGameData[data.roomId].gamedata.cardHistory[0].player})
						
				}

				// reset data
				allGameData[data.roomId].gamedata.scoreBoardData.highestHand = {}
				allGameData[data.roomId].gamedata.scoreBoardData.highestHand.cards = []
				allGameData[data.roomId].gamedata.scoreBoardData.whoseTurn = cardHistory[0].player

				// reset round data 
				allGameData[data.roomId].gamedata.pointsInRound = 0
				allGameData[data.roomId].gamedata.roundHistory = {}
				allGameData[data.roomId].gamedata.cardHistory = []
				allGameData[data.roomId].gamedata.scoreBoardData.players.forEach(x=> x.playedHand = false)

			}
			// reset card/round history
			// console.log(cardHistory[0].stats)
			console.log('challengeHand', challengeHand)
			console.log('challengeStats', challengeStats)
			
		}


		
	})

	socket.on('playHand', function (cardHand) {

		console.log('playHand', cardHand)
		var playedCards = cardHand.cards.map(x=>x.card)

		// need to determine 3 main things - whose turn it is, are they joining a team, is it the end of the game
		// server needs to keep track of what cards are played in a round and who plays it so we can clear the hand later / track for history	 	
		//array of objects w/keys where user is the key and cards is the value

		var playedStats = getCardStats(playedCards, allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard.card)

		// for non round leading hands, check to see whose is higher
		// if (followedSuit) {
		if (allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats.allZhu) {
			// highest hand is zhu, need to beat the card, but must have zhu 
			if (playedStats.allZhu) {
				var newLeader = beatHand(allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats, playedStats, false, allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard.card)
				if (newLeader){
					// if new highest hand, update data 
					allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats = playedStats
					allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.playedBy = cardHand.player
					allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards = playedCards  
				}	
			}
			
		} else {
			// highest hand is a fu card, need to beat the card if not playing zhu.  if zhu, then can match value (ie both play 3s but diff suit) as long as pattern matches 

			if (playedStats.allZhu) {
				// attempt to bi
				var newLeader = beatHand(allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats, playedStats, true, allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard.card)
			} else {
				// regular card play
				console.log('regular card play')
				var newLeader = beatHand(allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats, playedStats, false, allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuCard.card)
			}
			
			if (newLeader){
				// if new highest hand, update data 
				allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cardStats = playedStats
				allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.playedBy = cardHand.player
				allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards = playedCards  
			}	
		}

		for (var i = 0; i < playedCards.length; i++) { 
			pointsInRound = pointsInRound + countPoints(playedCards[i])
		}

		var hand = {}
		hand.player = cardHand.player
		hand.cards = cardHand.cards
		hand.stats = playedStats
		allGameData[cardHand.roomId].gamedata.cardHistory.push(hand)	  
		allGameData[cardHand.roomId].gamedata.roundHistory.points = pointsInRound
		allGameData[cardHand.roomId].gamedata.roundHistory.cardHistory = cardHistory

		var pts = tallyScoreByTeam(allGameData[cardHand.roomId].gamedata.scoreBoardData.players)
		console.log(pts)

		// // update whose turn it is 
		allGameData[cardHand.roomId].gamedata.scoreBoardData = updateWhoseTurn(allGameData[cardHand.roomId].gamedata.scoreBoardData, cardHand.player)
			
		// // need to determine end of round and reset turn tracker
		var scoreBoardOrder = allGameData[cardHand.roomId].gamedata.scoreBoardData.players
		
		if (allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=>x.playedHand == true).length == allGameData[cardHand.roomId].gamedata.scoreBoardData.players.length) {
			//everybody has played a hand, determine winner of round and set who's playing first
			var winnerID = allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.playedBy
			
			allGameData[cardHand.roomId].gamedata.scoreBoardData.whoseTurn = winnerID
			console.log('winner ', winnerID)

			allGameData[cardHand.roomId].gamedata.scoreBoardData.players[scoreBoardOrder.indexOf(winnerID)].points = allGameData[cardHand.roomId].gamedata.scoreBoardData.players[scoreBoardOrder.indexOf(winnerID)].points + pointsInRound

			allGameData[cardHand.roomId].gamedata.gameHistory.push(roundHistory)

			// clear the board after 2 seconds 
			setTimeout(function() {
				io.in(cardHand.roomId).emit('clearTable')

				allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand = {}
				allGameData[cardHand.roomId].gamedata.scoreBoardData.highestHand.cards = []

				// reset round data 
				allGameData[cardHand.roomId].gamedata.pointsInRound = 0
				allGameData[cardHand.roomId].gamedata.roundHistory = {}
				allGameData[cardHand.roomId].gamedata.cardHistory = []
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players.forEach(x=> x.playedHand = false)

			}, 2000)	
			
		} 

		// console.log('play', cardHand)
		console.log('playhand scoreBoard', scoreBoardData)
		
		// roundHistory = roundHistory.concat(hand)

		// check to see if they played a called card to be on a team if teams arent set yet 
		if (!teamSet) {
			// check to see if they're on your team 
			// (cardsPlayed, cardSought, condition, cardsBefore)
			var friend1 = areYouOnMyTeam(playedCards, allGameData[cardHand.roomId].gamedata.askedFriend1, allGameData[cardHand.roomId].gamedata.cardsBefore1)
			cardsBefore1 = friend1.cardsBefore
			var friend2 = areYouOnMyTeam(playedCards, allGameData[cardHand.roomId].gamedata.askedFriend2, allGameData[cardHand.roomId].gamedata.cardsBefore2)
			cardsBefore2 = friend2.cardsBefore

			if (friend1.onTheTeam == true || friend2.onTheTeam == true) {
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players[scoreBoardOrder.indexOf(cardHand.player)].joinedZhuang = true

				// wait do i actually need ids here?? or can i just down names 
				allGameData[cardHand.roomId].gamedata.scoreBoardData.zhuangJia.teammates.push({'name': allGameData[cardHand.roomId].gamedata.scoreBoardData.players[scoreBoardOrder.indexOf(cardHand.player)].name, 'id': allGameData[cardHand.roomId].gamedata.scoreBoardData.players[scoreBoardOrder.indexOf(cardHand.player)].id})
			}
			
			console.log(friend1, friend2) 
		}

		// if everybody has played their last hand, check koudi, add points depending on which team won
		if (cardHand.lastRound == true) {
			allGameData[cardHand.roomId].gamedata.scoreBoardData.players[scoreBoardOrder.indexOf(cardHand.player)].lastRound = true
			// add kou di points -- track kou di on server side??? 
			// calculate points by team --
			var totalPoints = tallyScoreByTeam(allGameData[cardHand.roomId].gamedata.scoreBoardData.players)
			console.log('final score', totalPoints)

			var kouDiPoints = 0
			for(var i = 0; i < allGameData[cardHand.roomId].kouDiCards.length; i++) {
				kouDiPoints = kouDiPoints + countPoints(allGameData[cardHand.roomId].kouDiCards[i])
			}
			// NEED TO DEAL WITH WHO WON THE LAST HAND FOR KOUDI
			// change levels and set zhuangjia 		

			if (totalPoints == 0) {
				// zhuangjia team goes up 3 
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=> x.joinedZhuang == true).map(x => x.level = x.level + 3)
				// change zhuangjia, change game level number 
				var nextZhuang = getNextZhuang(gameData, currentZhuang, zhuangJiaWon) 
				var newInd = allGameData[cardHand.roomId].gamedata.players.indexOf(nextZhuang)
				
				setZhuangJiaInfo(cardHand.roomId, newInd, nextZhuang)

			} else if (totalPoints < 60) {
				//zhuang jia team goes up 2 levels 
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=> x.joinedZhuang == true).map(x => x.level = x.level + 2)

			} else if (totalPoints < 110) {
				//zhuang jia team goes up 1 level
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=> x.joinedZhuang == true).map(x => x.level = x.level + 1)


			} else if (totalPoints < 160) {
				// between 110-160, shangtai 
				

			} else if (totalPoints < 210) {
				//between 160 and 210, go up one, switch zhuangjia sides 
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=> x.joinedZhuang == false).map(x => x.level = x.level + 1)

			} else if (totalPoints < 260) {
				// btwn 210-260, zhuangjia flips, team goes up 2 levels 
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=> x.joinedZhuang == false).map(x => x.level = x.level + 2)
				
			} else {
				// 260+, go up 3 levels 
				allGameData[cardHand.roomId].gamedata.scoreBoardData.players.filter(x=> x.joinedZhuang == false).map(x => x.level = x.level + 3)

			}
			
			console.log('koudi points', kouDiPoints)
			 
		} 

		// need to track scores by team once teams are found 

		io.in(roomId).emit('updateScore', {scoreBoard: allGameData[cardHand.roomId].gamedata.scoreBoardData})
		io.in(roomId).emit('cardPlayed', {cards: playedCards, player: cardHand.player, points: pointsInRound, detailed: cardHand.cards});
		
	});

	socket.on('kouDi', function(data) {
		console.log('koudi', data) 
		allGameData[data.roomId].kouDiCards = data.kouDiCards
		
		// return how many points discarded?? 
		io.in(roomId).emit('')

	})

	// socket.on('clearRound', function() {
	// 	// calculate number of points in the round and who won the points 
	// 	console.log('clear round', roundHistory, pointsInRound)
	// 	// gameHistory.push(roundHistory)
	// 	// console.log('clearRound', data)
	// 	// tell what cards were played that round
	// 	io.in(roomId).emit('clearTable')

	// 	scoreBoardData.highestHand = {}
	// 	scoreBoardData.highestHand.cards = []

	// 	// reset round data 
	// 	pointsInRound = 0
	// 	roundHistory = {}
	// 	cardHistory = []
	// 	scoreBoardData.players.forEach(x=> x.playedHand = false)

	// })

	socket.on('disconnect', function () {
		console.log(io.sockets.sockets[socket.id])
		console.log('A user disconnected: ' + socket.id);

		var user = allSockets[socket.id]
		console.log(socket.rooms)
		// var competitors = scoreBoardData.map(x => x.id)
		// var removeP = competitors.indexOf(socket.id)

		// scoreBoardData.splice(removeP, 1)
		// DO I NEED TO UPDATE THE SCOREBOARD WHEN A PLAYER LEAVES??!?  prob no need to?? 

		// var index = allGameData[data.roomId].gamedata.players.indexOf(socket.id)
		// playerInfo.splice(index, 1)  // remove player that just disconnected (if we assign this to a var, it's equal to the item removed)
		// console.log(playerInfo)
		// players = allGameData[data.roomId].players.filter(player => player !== socket.id);
		// console.log(players)
	});

	socket.on('set name', function(data) {  
		console.log('set name', data) 
		console.log(allGameData)
		// console.log(socket.rooms)
		// check to make sure theyre not reconnecting ie accidentally closed tab 
		var alreadyJoined = allGameData[data.roomId].gamedata.players.indexOf(data.id) > -1 
		console.log(alreadyJoined)
		if (alreadyJoined) {
			// just set name ??
		} else {
			// add player to game 
			addPlayerToGame(data.roomId, data.id) 
		}
		var order = allGameData[data.roomId].gamedata.players.indexOf(data.id)		
		console.log('order', order, allGameData[data.roomId].gamedata.players)
		console.log(allGameData[data.roomId].gamedata.scoreBoardData.players)

		allGameData[data.roomId].gamedata.scoreBoardData.players[order].name = data.name
		// console.log('set name', allGameData[data.roomId].gamedata.scoreBoardData.players)
		// playerInfo[order].name = data.name
		// scoreBoardData.players[order].name = data.name   // DO I NEED THIS???		
		io.in(roomId).emit('playing order', allGameData[data.roomId].gamedata.scoreBoardData.players)
	})

	socket.on('avatar', function(data){
		// console.log(data)
		// console.log('roomId', roomId) // not a global var 
		var order = allGameData[data.roomId].gamedata.players.indexOf(data.id)
		allGameData[data.roomId].gamedata.scoreBoardData.players[order].avatar = data.avatar		
	})

	socket.on('set zhuang', function(data) {
		console.log('set zhuang', data)
		io.in(data.roomId).emit('check zhuang', data)
	})

	socket.on('liang', function(data) {
		// TODO NEED TO DEAL WITH 3 DECK AND GET ALL 3 ZHU 
		// console.log('liang', data)
		// console.log('liangData', liangData)
		console.log('liang data', data)

		//check to see if suit matches and if number flipped > previous number
		// if number isnt enough, check to see if it's equal and has priority 
		// make sure they flipped all matching cards 
		// check that all cards match and flipped the right level 
		var allMatch = true

		for (var i = 0; i < data.card.length; i++) {

			if (data.card[0] != data.card[i]) {
				allMatch = false
			}

			// make sure the card they flipped was for the right level --THIS IS WRONG - NEED TO TRACK WHO IS ZHUANG JIA 
			var p = allGameData[data.roomId].gamedata.players.indexOf(data.id)
			console.log('level needed to flip', allGameData[data.roomId].gamedata.scoreBoardData.players[p].level)
			if (!data.card[0].card.includes(allGameData[data.roomId].gamedata.gameLevel)){
				allMatch = false
			}

		}

		let zhuFlipped = false
		// all cards match and are the right level
		if (allMatch) {
			var suit = allGameData[data.roomId].gamedata.liangData.suit = suit
			// if nobody's flipped so far, set it as zhu 
			if (allGameData[data.roomId].gamedata.liangData.flippedBy == null) {

				allGameData[data.roomId].gamedata.liangData.numberFlipped = 1
				allGameData[data.roomId].gamedata.liangData.name = data.name
				allGameData[data.roomId].gamedata.liangData.flippedBy = data.id  // need to announce who flipped it 

				allGameData[data.roomId].gamedata.firstLiang.card = data.card[0]
				allGameData[data.roomId].gamedata.firstLiang.name = data.id
			
				allGameData[data.roomId].gamedata.scoreBoardData.zhuCard = data.card[0]

				allGameData[data.roomId].gamedata.liangData.zhuCard = data.card[0]
				// console.log('zhu flipped', liangData)
				zhuFlipped = true

			} else if (allGameData[data.roomId].gamedata.firstLiang.card == data.card[0] && allGameData[data.roomId].gamedata.firstLiang.name == data.id && (data.card.length >= allGameData[data.roomId].gamedata.liangData.numberFlipped)) {
				// priority matching --must be same suit and have equal number or more 
					// console.log('priority')
					allGameData[data.roomId].gamedata.liangData.numberFlipped = data.card.length
					allGameData[data.roomId].gamedata.liangData.name = data.name
					allGameData[data.roomId].gamedata.liangData.flippedBy = data.id  // need to announce who flipped it 
					
					allGameData[data.roomId].gamedata.liangData.suit = suit
					allGameData[data.roomId].gamedata.scoreBoardData.trumpSuit = suit

					allGameData[data.roomId].gamedata.scoreBoardData.zhuCard = data.card[0]
					allGameData[data.roomId].gamedata.liangData.zhuCard = data.card[0]

					zhuFlipped = true

				} else if (allGameData[data.roomId].gamedata.firstLiang.card != data.card[0] && allGameData[data.roomId].gamedata.firstLiang.name != data.id && (data.card.length > allGameData[data.roomId].gamedata.liangData.numberFlipped)) 
				{
					//not the first person to flip -> either have to flip more than prev flipped and a diff suit that before 
					// console.log('beating zhu')
					// flipping diff zhu 
					allGameData[data.roomId].gamedata.liangData.numberFlipped = data.card.length
					allGameData[data.roomId].gamedata.liangData.name = data.name
					allGameData[data.roomId].gamedata.liangData.flippedBy = data.id  // need to announce who flipped it 
					
					allGameData[data.roomId].gamedata.liangData.suit = suit
					allGameData[data.roomId].gamedata.scoreBoardData.trumpSuit = suit

					allGameData[data.roomId].gamedata.scoreBoardData.zhuCard = data.card[0]
					allGameData[data.roomId].gamedata.liangData.zhuCard = data.card[0]

					zhuFlipped = true

				}				
				
				// OR - you have priority and flipped first originally 
			} else {
				// no match w/suit 
				io.in(roomId).emit('fail', {msg: 'what are you doing??'})
			}

			console.log('zhuFlipped', zhuFlipped)
			console.log('allMatch', allMatch)
			if (zhuFlipped) {
				io.in(roomId).emit('zhuLiangLe', {liangData: allGameData[data.roomId].gamedata.liangData})

			}

		})

		// var scoreBoardOrder = allGameData[data.roomId].gamedata.players
		// update whose turn it is 
		// var p = allGameData[data.roomId].gamedata.players.indexOf(data.id)
		// // if (data.card.length > 0) {
		// // 		// check if card already flipped 
		// 	if (allGameData[data.roomId].gamedata.liangData.flippedBy == null) {
		// 		console.log('first zhu', scoreBoardData.players[p].level, data.card.includes(scoreBoardData.players[p].level), data.card[0])
		// // 		// if nobody flipped yet, make sure they flipped right level
		// 		if (data.card[0].includes(allGameData[data.roomId].gamedata.scoreBoardData.players[p].level) && data.card.length == 1) {
		// // 			//TODO need to make sure they haven't already flipped this one ie click same card twice 
		// 			var suits = ['diamonds', 'spades', 'clubs', 'hearts'];
		// 			for (var i = 0; i < suits.length; i++) {
		// 				if (data.card.includes(suits[i])){
		// 					allGameData[data.roomId].gamedata.liangData.suit = suits[i]
		// 					allGameData[data.roomId].gamedata.scoreBoardData.trumpSuit = suits[i]
		// 				}
		// 			}					

		// 		} else if (data.card.length > 1){
					// // check that all cards match 
					// var allMatch = true
					// for (var i = 0; i < data.card.length; i++) {
					// 	if (data.card[0] != data.card[i]) {
					// 		allMatch = false
					// 	}
					// }

		// 			allGameData[data.roomId].gamedata.firstLiang.card = data.card[0]
		// 			allGameData[data.roomId].gamedata.firstLiang.name = data.id

		// 			allGameData[data.roomId].gamedata.liangData.numberFlipped = data.card.length
		// 			allGameData[data.roomId].gamedata.liangData.name = data.name
		// 			allGameData[data.roomId].gamedata.liangData.flippedBy = data.id  // need to announce who flipped it 
					
		// 			allGameData[data.roomId].gamedata.liangData.suit = suit
		// 			allGameData[data.roomId].gamedata.scoreBoardData.trumpSuit = suit

		// 			allGameData[data.roomId].gamedata.scoreBoardData.zhuCard = data.card[0]
		// 			allGameData[data.roomId].gamedata.liangData.zhuCard = data.card[0]

		// 			io.in(roomId).emit('zhuLiangLe', {liangData: allGameData[data.roomId].gamedata.liangData})

		// 		}

		// 	} else if (data.card.length > 1) {
		// 		// if somebody already flipped, need more than 1 zhu 
		// 		// need to make sure can't change zhu 

		// 		// check that all cards match 
		// 		var allMatch = true
		// 		for (var i = 0; i < data.card.length; i++) {
		// 			if (data.card[0] != data.card[i]) {
		// 				allMatch = false
		// 			}
		// 		}
		// 		var suit = data.card[0].split('_')[2]

				// // priority matching --must be same suit and have equal number or more 
				// if (allMatch && allGameData[data.roomId].gamedata.firstLiang.card == data.card[0] && allGameData[data.roomId].gamedata.firstLiang.name == data.id && (data.card.length >= allGameData[data.roomId].gamedata.liangData.numberFlipped)) {
				// 	// console.log('priority')
				// 	allGameData[data.roomId].gamedata.liangData.numberFlipped = data.card.length
				// 	allGameData[data.roomId].gamedata.liangData.name = data.name
				// 	allGameData[data.roomId].gamedata.liangData.flippedBy = data.id  // need to announce who flipped it 
					
				// 	allGameData[data.roomId].gamedata.liangData.suit = suit
				// 	allGameData[data.roomId].gamedata.scoreBoardData.trumpSuit = suit

				// 	allGameData[data.roomId].gamedata.scoreBoardData.zhuCard = data.card[0]
				// 	allGameData[data.roomId].gamedata.liangData.zhuCard = data.card[0]

				// } else if (allMatch && allGameData[data.roomId].gamedata.firstLiang.card != data.card[0] && allGameData[data.roomId].gamedata.firstLiang.name != data.id && (data.card.length > allGameData[data.roomId].gamedata.liangData.numberFlipped)) {
					
					// console.log('beating zhu')
					// flipping diff zhu 
					// allGameData[data.roomId].gamedata.liangData.numberFlipped = data.card.length
					// allGameData[data.roomId].gamedata.liangData.name = data.name
					// allGameData[data.roomId].gamedata.liangData.flippedBy = data.id  // need to announce who flipped it 
					
					// allGameData[data.roomId].gamedata.liangData.suit = suit
					// allGameData[data.roomId].gamedata.scoreBoardData.trumpSuit = suit

					// allGameData[data.roomId].gamedata.scoreBoardData.zhuCard = data.card[0]
					// allGameData[data.roomId].gamedata.liangData.zhuCard = data.card[0]

				// } else {
				// 	io.in(roomId).emit('fail', {msg: 'have you already liang'})
				// }
				// io.in(roomId).emit('zhuLiangLe', {liangData: allGameData[data.roomId].gamedata.liangData})

			// } else {
			// reject message ie invalid card
				// io.in(roomId).emit('fail', {msg: 'what are you doing??'})
			// }
		// }
		
		// console.log(liangData, firstLiang)		
	// })	
		// need to check that nobody else has flipped and that it's the right level

	// })
	// socket.on("disconnect", () => {
	//	 console.log(socket.id, "Client disconnected");
	//	 // remove player from list when disconnect and update player info 
	//	 var sockets = player_list.map(x=>x.id)
	//	 player_list = player_list.filter((x)=>x.id != socket.id)
	//	 io.in(roomId).emit('join game', player_list)

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