import React from 'react'; 

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

		this.state = {
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
			findFriend2: null
		}
	}

	submitFriends () {	
		console.log(this.state.suit1Ask, this.state.val1Ask, this.state.friendCondition1, this.state.suit2Ask, this.state.val2Ask, this.state.friendCondition2)

		// tell server to broadcast which cards were called for 
	    event.preventDefault();	 

	    // don't let people call zhu suit 
	    if (this.state.suit1Ask != this.state.zhuSuit && this.state.suit2Ask != this.state.zhuSuit) {

	    	socket.emit('call friends', {firstAskVal: this.state.val1Ask, firstAskSuit: this.state.suit1Ask, condition1: this.state.friendCondition1, secondAskVal: this.state.val2Ask, secondAskSuit: this.state.suit2Ask, condition2: this.state.friendCondition2})	

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

	setName() {
		var name = document.getElementById('playername').value
		console.log(name, playerid)
		this.setState({
			name: name,
			// playerid: playerid
		})
		socket.emit('set name', {name: name, id: playerid })
	}

	rejectZhuang() {
		socket.emit('confirm zhuang', {response: false, zhuang: this.state.zhuangJiaInfo, responseById: playerid, responseByPlayer: this.state.name})
		// responded to confirm zhuang jia 
		this.setState({
			confirmZhuangJia: false
		})
	}

	acceptZhuang() {
		socket.emit('confirm zhuang', {response: true, zhuang: this.state.zhuangJiaInfo, responseById: playerid, responseByPlayer: this.state.name})
		this.setState({
			confirmZhuangJia: false, 

		})
	}	

	playTheSmaller() {
		console.log(cardSmaller, dropZoneCards)
		socket.emit('take back hand', {higherHand: dropZoneCards, lowerHand: cardSmaller})

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
		socket.emit('kouDi', {kouDiCards})
		console.log('kouDi', yourHandList, kouDiCards)
	}

	liang(){
		var clicker = getPlayerById()
		socket.emit('liang', {'card': last2ClickedCards, id: playerid, name: clicker})		
	}

	setZhuang() {
		// allows zhuang to kou di 
		socket.emit('set zhuang', {id: currentZhuangId, name: currentZhuang})
	}

	componentDidMount() {
		// endpoint = this.state.endpoint;  
    	// socket = socketIOClient(endpoint, {transports: ['websocket'], upgrade: false}); 
    	socket.on('playing order', (data) => {
    		this.setState({
				playerInfo: data
    		})
    		
    	})

    	socket.on('cardPlayed', (data) => {
    		this.setState({
    			pointsOnTable: data.points
    		})
    	})

    	socket.on('updateScore', (data)=> {
    		console.log(data)
    		this.setState({
    			scoreBoard: data.scoreBoard,
    			zhuSuit: data.scoreBoard.zhuCard.split('_')[2]
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
    			zhuangJiaInfo: data.zhuang
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

	}

	// {this.state.playerInfo && <PlayerOrder players={this.state.playerInfo}/>}
	render() {
		return (
			<div>
				{this.state.confirmZhuangJia && <div> 
						<Modal zhuangJia={this.state.zhuangJiaInfo.name} reject={() => this.rejectZhuang()} accept={() => this.acceptZhuang()}/>						
					</div>}
				{this.state.amIZhuangJia && this.state.findFriend1 == null && <CallFriends selectVal1={(e) => this.selectVal1(e)} selectVal2={(e) => this.selectVal2(e)} selectSuit1={(e) => this.selectSuit1(e)} selectSuit2={(e) => this.selectSuit2(e)} selectFriendCondition1={(e) => this.selectFriendCondition1(e)} selectFriendCondition2={(e) => this.selectFriendCondition2(e)} suit1Ask={this.state.suit1Ask} suit2Ask={this.state.suit2Ask} val1Ask={this.state.val1Ask} val2Ask={this.state.val2Ask} friendCondition1={this.state.friendCondition1} friendCondition2={this.state.friendCondition2} submitFriends={() => this.submitFriends()} kouDi={()=>this.kouDi()} />}
				{this.state.findFriend1 != null && <Billboard zhuangJia={this.state.zhuangJiaInfo.name} findFriend1={this.state.findFriend1} findFriend2={this.state.findFriend2} />}
				{this.state.name == '' && <PlayerName setName={() => this.setName()} name={this.state.name}/>}
				{this.state.scoreBoard && <Rankings score={this.state.scoreBoard} level={this.state.level}/>}
				<ZhuangJia liang={()=> this.liang()} setZhuang={() => this.setZhuang()}/>
				<InGame showHand={() => this.showHand()} playTheSmaller={()=>this.playTheSmaller()}/>

			</div>
			)
	}

}
// 

function Billboard(props) {
	return (
		<h3> {props.zhuangJia} is calling for the {props.findFriend1} and {props.findFriend2}
		</h3>)
}

function CallFriends (props) {
	// select which cards will be your friends	

	return (<div className = 'callFriends'>
				<h2>Kou Di </h2>
				<button onClick={props.kouDi}>Kou Di </button> 

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
			<button onClick={props.reject}> No </button>
			<button onClick={props.accept}>Confirm</button>
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
		<form>
			<label htmlFor='playername'>Your name</label>
			<input type='text' id='playername' name='playername'/>
			<button type='button' onClick={props.setName}>Submit</button>
		</form>
		)
	
}

function InGame(props){
	return (
		<div className='ingame'>
			<button type='button' onClick={props.showHand}>Show/Hide Cards</button>
			<button type='button' onClick={props.playTheSmaller}>Force the smaller hand</button>
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

function ZhuangJia(props){
	return (
		<div>
			<button onClick={props.liang}>Liang</button>
			<button onClick={props.setZhuang}>Set ZhuangJia</button>
		</div>
	)
}


export default Scoreboard
