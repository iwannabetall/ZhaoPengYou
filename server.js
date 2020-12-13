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

let players = [];
var playerInfo = [];

var gameHistory = [] //array of round History
var roundHistory = {} // contains cardHisotry, points scored and by whom 
var cardHistory = [] // cards played in a round by each player, embedded in roundHistory
var pointsInRound = 0 // 
var roundWinner // who won the round, either points or team

var cardDeck = ['ace_of_spades', '2_of_spades', '3_of_spades', '4_of_spades', '5_of_spades', '6_of_spades', '7_of_spades', '8_of_spades', '9_of_spades', '10_of_spades', 'jack_of_spades', 'queen_of_spades', 'king_of_spades', 'ace_of_diamonds', '2_of_diamonds', '3_of_diamonds', '4_of_diamonds', '5_of_diamonds', '6_of_diamonds', '7_of_diamonds', '8_of_diamonds', '9_of_diamonds', '10_of_diamonds', 'jack_of_diamonds', 'queen_of_diamonds', 'king_of_diamonds', 'ace_of_clubs', '2_of_clubs', '3_of_clubs', '4_of_clubs', '5_of_clubs', '6_of_clubs', '7_of_clubs', '8_of_clubs', '9_of_clubs', '10_of_clubs', 'jack_of_clubs', 'queen_of_clubs', 'king_of_clubs', 'ace_of_hearts', '2_of_hearts', '3_of_hearts', '4_of_hearts', '5_of_hearts', '6_of_hearts', '7_of_hearts', '8_of_hearts', '9_of_hearts', '10_of_hearts', 'jack_of_hearts', 'queen_of_hearts', 'king_of_hearts', 'red_joker', 'black_joker']

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
	if (card.includes(10) || card.includes('king')) {		
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

    players.push(socket.id);
    playerInfo.push({name: null, id: socket.id})

    socket.on('draw cards', function () {

    	for (var i = 0; i < players.length; i++) {
    		io.to(players[i]).emit('startGame', {order: i, players: players, playerInfo: playerInfo})  	
    	}    	
	
        var shuffledCards = shuffle(cardDeck)
        console.log(shuffledCards)
        var cardInd = 0
        var kouDi = 8  // number of cards at bottom 
        var cardCount = 0
        
		while (cardInd < shuffledCards.length - kouDi) {
			if (cardInd % players.length == 0) {
				cardCount = cardCount + 1
			}
			var whichPlayer = cardInd % players.length			
			io.to(players[whichPlayer]).emit('deal', {card: shuffledCards[cardInd], count: cardCount});
			cardInd = cardInd + 1
		}
		console.log('deal cards')
    });

    socket.on('playHand', function (cardHand) {
    	// server needs to keep track of what cards are played in a round and who plays it so we can clear the hand later / track for history 
    	//array of objects w/keys where user is the key and cards is the value
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
    	io.emit('playing order', playerInfo)
    })

    socket.on('avatar', function(data){
    	console.log(data)
    	var order = players.indexOf(data.id)
    	playerInfo[order].avatar = data.avatar    	
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