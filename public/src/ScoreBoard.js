import React from 'react'
import { Location } from "@reach/router"

var suits = ['diamonds', 'spades', 'clubs', 'hearts'];

var valKey = [{key:'sace', val: 'Ace'}, {key:'rking', val: 'King'}, {key:'910', val: '10'}, {key:'queen', val: 'Queen'}, {key:'jack', val: 'Jack'}, {key:'90', val: '9'}, {key:'8', val: '8'}, {key:'7', val: '7'}, {key:'6', val: '6'}, {key:'5', val: '5'}, {key:'4', val: '4'}, {key:'3', val: '3'}, {key:'2', val: '2'}]

var conditions = [{val: "First", key: 'first'}, {val: "Second", key: '2nd'}, {val: "Outside first", key: 'outside_first'}, {val: "Dead", key: 'dead'}, {val: "Third", key: 'third'}]

class Scoreboard extends React.Component {
	constructor(props) {
		super(props)
		this.setName = this.setName.bind(this)
		this.submitFriends = this.submitFriends.bind(this)
		this.selectSuit1 = this.selectSuit1.bind(this)
		this.selectSuit2 = this.selectSuit2.bind(this)
		this.selectVal1 = this.selectVal1.bind(this)
		this.selectVal2 = this.selectVal2.bind(this)
		this.selectFriendCondition1 = this.selectFriendCondition1.bind(this)
		this.selectFriendCondition2 = this.selectFriendCondition2.bind(this)
		this.kouDi = this.kouDi.bind(this)
		this.showHand = this.showHand.bind(this) 
		this.liang = this.liang.bind(this)
		this.setZhuang = this.setZhuang.bind(this)
		this.playTheSmaller = this.playTheSmaller.bind(this)
		this.startCardDraw = this.startCardDraw.bind(this)
		this.setGameState = this.setGameState.bind(this)		
		// this.playHand = this.playHand.bind(this)
		// this.sortHand = this.sortHand.bind(this)

		this.state = {
			gameState: 'pregame', // start with pregame for before cards dealt 
			playerInfo: null,
			name: '',
			// playerid: null,
			pointsOnTable: 0,
			scoreBoard: null,
			level: 2,
			zhuSuit: null,
			zhuangJiaInfo: null,  // obj with name and id attributes
			confirmZhuangJia: false,
			amIZhuangJia: false, 
			suit1Ask: suits[0], // what card did the zhuang jia ask for  
			suit2Ask: suits[0],
			val1Ask: valKey[0].val,  // THESE ARE FIXED.  feel like there should be a better way 
			val2Ask: valKey[0].val,
			friendCondition1: conditions[0].val,
			friendCondition2: conditions[0].val,
			findFriend1: null, // eg ace of spades
			findFriend2: null,
			isZhuSet: false,
			kouDiDone: false// true if submitted
		}
	}

	setGameState(newState) {
		this.setState({
			gameState: newState
		})
	}

	submitFriends () {	
		console.log(this.state.suit1Ask, this.state.val1Ask, this.state.friendCondition1, this.state.suit2Ask, this.state.val2Ask, this.state.friendCondition2)

		// tell server to broadcast which cards were called for 
	    event.preventDefault();	 

	    // don't let people call zhu suit 
	    if (this.state.suit1Ask != this.state.zhuSuit && this.state.suit2Ask != this.state.zhuSuit) {

	    	socket.emit('call friends', {firstAskVal: this.state.val1Ask, firstAskSuit: this.state.suit1Ask, condition1: this.state.friendCondition1, secondAskVal: this.state.val2Ask, secondAskSuit: this.state.suit2Ask, condition2: this.state.friendCondition2, roomId: window.roomId})	

	    } else {
	    	alert(`You've selected a zhu suit`)
	    }
		
	}

	selectSuit1 (e){
		this.setState({
			suit1Ask: e.target.value
		})
	}

	selectSuit2 (e){
		this.setState({
			suit2Ask: e.target.value 
		})
	}

	selectVal1 (e){
		this.setState({
			val1Ask: e.target.value 
		})
	}

	selectVal2 (e){
		this.setState({
			val2Ask: e.target.value
		})
	}

	selectFriendCondition1 (e) {
		this.setState({
			friendCondition1: e.target.value
		})
	}

	selectFriendCondition2 (e) {
		this.setState({
			friendCondition2: e.target.value
		})
	}

	setName(e) {
		e.preventDefault()
		var name = document.getElementById('playername').value
		// console.log(name, playerid)
		if (name.trim().length > 0) {
			this.setState({
				name: name,
				// playerid: playerid
			})
			new Phaser.Game(config);
			console.log(window.roomId)
			socket.emit('set name', {name: name, id: playerid, roomId: window.roomId})	
		} else {
			// what should it do if there's no name?? 
				
		}
		
	}

	rejectZhuang() {
		socket.emit('confirm zhuang', {response: false, zhuang: this.state.zhuangJiaInfo, responseById: playerid, responseByPlayer: this.state.name, roomId: window.roomId})
		// responded to confirm zhuang jia 
		this.setState({
			confirmZhuangJia: false
		})
	}

	acceptZhuang() {
		socket.emit('confirm zhuang', {response: true, zhuang: this.state.zhuangJiaInfo, responseById: playerid, responseByPlayer: this.state.name, roomId: window.roomId})
		this.setState({
			confirmZhuangJia: false, 

		})
	}	

	playTheSmaller() {
		console.log(cardSmaller, dropZoneCards)
		// NEED TO MAKE SURE THAT IT'S NOT NULL TODO!!!!
		socket.emit('take back hand', {higherHand: dropZoneCards, lowerHand: cardSmaller, roomId: window.roomId})

	}

	showHand() {
		if (cardHandContainer.visible) {
			cardHandContainer.setVisible(false)	
		} else {
			cardHandContainer.setVisible(true)
		}
		
	}

	kouDi() {
		kouDiSprites.forEach((card)=> card.destroy())

		for (var i = 0; i < kouDiCards.length; i++) {
			var playedInd = yourHandList.map(x=>x.card).indexOf(kouDiCards[i])	
			yourHandList.splice(playedInd, 1)
		}

		maxScroll = (yourHandList.length * 30)/5
		sortHand()
		// console.log(yourHandList)
		dropZoneCardsTracker = []
		dropZoneCards = []
		// console.log(dropZoneCardsSprites)
		dropZoneCardsSprites = []
		socket.emit('kouDi', {kouDiCards, roomId: window.roomId})
		console.log('kouDi', yourHandList, kouDiCards)

		this.setState({
			kouDiDone: true,
			gameState: 'playing'
		})
	}

	startCardDraw() {
		setTimeout(function() {
			socket.emit('draw cards', window.roomId)	
		}, 1000)
		console.log('it works')
	}

	liang(){
		var clicker = getPlayerById()
		console.log('dropZoneCards', dropZoneCards)
		if (dropZoneCards.length > 0) {
			var cardsFlipped = dropZoneCards.map(x=>x.card)
			socket.emit('liang', {'card': dropZoneCards, id: playerid, name: clicker, roomId: window.roomId})		
		}
			
	}

	setZhuang() {
		// allows zhuang to kou di 
		if (currentZhuangId) {
			socket.emit('set zhuang', {id: currentZhuangId, name: currentZhuang, roomId: window.roomId})	
		} else {
			console.log('nobody has flipped')
		}
		
	}

	componentDidMount() {
		// endpoint = this.state.endpoint;  
    	// socket = socketIOClient(endpoint, {transports: ['websocket'], upgrade: false}); 
    	socket.on('playing order', (data) => {
    		console.log(data)
    		this.setState({
				playerInfo: data
    		})
    		
    	})

    	socket.on('gameStatus', (data) => {
    		this.setState({
    			gameState: data
    		})
    	})

    	socket.on('cardPlayed', (data) => {
    		this.setState({
    			pointsOnTable: data.points
    		})
    	})

    	socket.on('updateScore', (data)=> {
    		console.log('updateScore', data)
    		this.setState({
    			scoreBoard: data.scoreBoard,
    			zhuSuit: data.scoreBoard.zhuCard.card.split('_')[2]
    		})
    	})

    	socket.on('check zhuang', (data)=> {
    		// confirm that people are ok with person being zhuang before 
    		this.setState({
    			confirmZhuangJia: true, 
    			zhuangJiaInfo: data
    		})
    		console.log('check zhuang', data)
    	})

    	socket.on('zhuang confirmed', (data) => {
    		console.log(playerid)
    		console.log(data)
    		if (data.zhuang.id == playerid) {
    			this.setState({
    				amIZhuangJia: true
    			})
    		}

    		this.setState({
    			playerInfo: data.playerInfo,
    			zhuangJiaInfo: data.zhuang, 
    			isZhuSet: true
    		})
    	})

    	socket.on('zhuang rejected', (data)=> {
    		console.log('zhuang rejected', data)
    	})

    	socket.on('jiao', (data)=> {
    		// console.log(data)
    		this.setState({
    			findFriend1: `${data.condition1} ${data.firstAskVal} of ${data.firstAskSuit}`, 
    			findFriend2: `${data.condition2} ${data.secondAskVal} of ${data.secondAskSuit} `, 
    		})
    	})

    	// duplicate.  idiot lol
		// socket.on('send bottom 8', (cards) => {
		// 	console.log('bottom 8', cards.bottom8Cards)

		// 	yourHandList = yourHandList.concat(cards.bottom8Cards)

		// 	sortHand()
		// 	maxScroll = (yourHandList.length * 30)/5		
			
		// })

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

			socket.emit('can I go', {player: data.lowerHandId, cards: data.lowerHand, remainingCards: remaining, roomId: window.roomId})

			// console.log(yourHandList)
			// console.log(data)

		})

	}

	// {this.state.playerInfo && <PlayerOrder players={this.state.playerInfo}/>}
	
	render() {
		return (
			<div>
				{this.state.name == '' && <PlayerName setName={(e) => this.setName(e)} name={this.state.name}/>}

				{this.state.name != '' && <div>
				{this.state.confirmZhuangJia && <div> 
						<Modal zhuangJia={this.state.zhuangJiaInfo.name} reject={() => this.rejectZhuang()} accept={() => this.acceptZhuang()}/>						
					</div>}
				{!this.state.kouDiDone && this.state.amIZhuangJia && <KouDi kouDi={()=>this.kouDi()}/>}
				{this.state.kouDiDone && this.state.findFriend1 == null && <CallFriends selectVal1={(e) => this.selectVal1(e)} selectVal2={(e) => this.selectVal2(e)} selectSuit1={(e) => this.selectSuit1(e)} selectSuit2={(e) => this.selectSuit2(e)} selectFriendCondition1={(e) => this.selectFriendCondition1(e)} selectFriendCondition2={(e) => this.selectFriendCondition2(e)} suit1Ask={this.state.suit1Ask} suit2Ask={this.state.suit2Ask} val1Ask={this.state.val1Ask} val2Ask={this.state.val2Ask} friendCondition1={this.state.friendCondition1} friendCondition2={this.state.friendCondition2} submitFriends={() => this.submitFriends()} />}
				{this.state.findFriend1 != null && <Billboard zhuangJia={this.state.zhuangJiaInfo.name} findFriend1={this.state.findFriend1} findFriend2={this.state.findFriend2} />}
				{this.state.scoreBoard && this.state.findFriend1 != null && <Rankings score={this.state.scoreBoard} level={this.state.level}/>}
				<ZhuangJia liang={()=> this.liang()} setZhuang={() => this.setZhuang()} gameState={this.state.gameState} isZhuSet={this.state.isZhuSet}/>
				<InGame showHand={() => this.showHand()} playTheSmaller={()=>this.playTheSmaller()} gameState={this.state.gameState}/>
				<CardMoves startCardDraw={() => this.startCardDraw()} playHand={()=> window.playHand()} sortHand={()=> window.sortHand()} gameState={this.state.gameState}/>
				</div>}

			</div>
			)
	}

}
// 
function CardMoves(props){
	return (<div>
			{props.gameState == 'pregame' && <button className='gameBtn' onClick={props.startCardDraw}> Draw Cards </button>}
			{props.gameState == 'playing' && <button className='gameBtn' onClick={props.playHand}> Play Hand </button>}				
			{(props.gameState == 'dealing' || props.gameState == 'playing' || props.gameState == 'snack_time') && <button className='gameBtn' onClick={props.sortHand}> Sort Hand </button>}
		</div>
		)
}


function InGame(props){
	return (
		props.gameState != 'pregame' && <div className='ingame'>
			<button className='gameBtn' type='button' onClick={props.showHand}>藏/看牌</button>
			{props.gameState == 'playing' && <button className='gameBtn' type='button' onClick={props.playTheSmaller}>打小的</button>}
		</div>
		
		)
}

function ZhuangJia(props){
	// show when zhuanjiainfo is null 
	return (!props.isZhuSet &&
		<div>
			{(props.gameState == 'snack_time' || props.gameState == 'dealing') && <button className='gameBtn' onClick={props.liang}>Liang</button>}
			{props.gameState == 'snack_time' && <button className='gameBtn' onClick={props.setZhuang}>定庄家</button>}
		</div>
	)
}

function Billboard(props) {
	return (
		<h3> {props.zhuangJia} is calling for the {props.findFriend1} and {props.findFriend2}
		</h3>)
}

function KouDi(props) {
	return (
		<div className = 'callFriends'>
			<h2>Kou Di </h2>
			<button className='gameBtn' onClick={props.kouDi}>Kou Di </button> 
		</div>
		)
}

function CallFriends (props) {
	// select which cards will be your friends	

	return (<div className = 'callFriends'>
				
				<h2>Call Your Friends</h2>
				<div>
					<form onSubmit={props.submitFriends}>
						<div className = 'friends'>
							<select value={props.suit1Ask} onChange={props.selectSuit1}> 
								{suits.map(suit=> <option key={`${suit}1`} value={suit}> {suit} </option>)}
							</select>
							<select value={props.val1Ask} onChange={props.selectVal1}> 
								{valKey.map(card=> <option key={`${card.key}1`} value={card.val}> {card.val} </option>)}
							</select>

							<select value={props.friendCondition1} onChange={props.selectFriendCondition1}> 
								{conditions.map(condition=> <option key={`${condition.key}1`} value={condition.val}> {condition.val} </option>)}
							</select>

						</div>
						<div className = 'friends'>
							<select value={props.suit2Ask} onChange={props.selectSuit2}> 
								{suits.map(suit=> <option  key={`${suit}2`} value={suit}> {suit} </option>)}
							</select>
							<select value={props.val2Ask} onChange={props.selectVal2}> 
								{valKey.map(card=> <option key={`${card.key}2`} value={card.val}> {card.val} </option>)}
							</select>

							<select value={props.friendCondition2} onChange={props.selectFriendCondition2}> 
								{conditions.map(condition=> <option key={`${condition.key}2`} value={condition.val}> {condition.val} </option>)}
							</select>
						</div>
						<input type='submit' value='Call Your Friends!'/> 
					</form>
				 </div>				
			</div>)
}

function Modal (props) {

	return (
		<div> ZhuangJia is {props.zhuangJia}
			<button className='gameBtn' onClick={props.reject}> No </button>
			<button className='gameBtn' onClick={props.accept}>Confirm</button>
		</div>
		)
}

function PlayerOrder (props) {
	return (		
		<div> {props.players.map(player => <div key={player.id}>{player.name}</div>)}
		</div>)
}

function PlayerName(props){

	return (
		<div className='nameInp'>
			<input type='text' id='playername' name='playername' placeholder='Your Name'/>
				<button className='gameBtn' type='button' id='nameBtn' onClick={props.setName}>Submit</button>
		</div>
		)
	
}



function Rankings (props) {
	return (
			<div>
				<h1>Score</h1>
				<h3>ZhuangJia & team: {props.score.zhuangJia.name} </h3>
				{props.score.players.filter(x=>x.joinedZhuang == true).map(player => <div key={player.id}>{player.name} </div>)}
				<h3>Level: {props.level}</h3>
				{props.score.players.filter(x=>x.joinedZhuang == false).map(player=><div key={player.id}>{player.name}  {player.points}</div>)}
			</div>
		)
}


export default Scoreboard
// ReactDOM.render(
//         <Scoreboard />,
//   document.getElementById('scoreBoard')
// );

// const domContainer = document.querySelector('#scoreBoard');
// ReactDOM.render(e(LikeButton), domContainer);