class Scoreboard extends React.Component {
	constructor(props) {
		super(props)
		this.setName = this.setName.bind(this)
		this.state = {
			playerInfo: null,
			name: '',
			// playerid: null,
			pointsOnTable: 0,
			scoreBoard: null,
			level: 2,
			zhuSuit: null,
			zhuangJiaInfo: null, 			
			confirmZhuangJia: false,
			amIZhuangJia: false
		}
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
    			scoreBoard: data.scoreBoard
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
	}

	// {this.state.playerInfo && <PlayerOrder players={this.state.playerInfo}/>}
	render() {
		return (			
			<div>
				{this.state.confirmZhuangJia && <div> 
						<Modal zhuangJia={this.state.zhuangJiaInfo.name} reject={() => this.rejectZhuang()} accept={() => this.acceptZhuang()}/>						
					</div>}
					{this.state.amIZhuangJia && <div>I am ZhuangJia</div>}
				{this.state.name == '' && <PlayerName setName={() => this.setName()} name={this.state.name}/>}
				{this.state.scoreBoard && <Rankings score={this.state.scoreBoard} level={this.state.level}/>}				
			</div>
			)
	}

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

function Rankings (props) {
	return (
			<div>
				<h1>Score</h1>
				<h3>Level: {props.level}</h3>
				{props.score.map(player=><div key={player.id}>{player.name}  {player.points}</div>)}
			</div>
		)
}


ReactDOM.render(
        <Scoreboard />,
  document.getElementById('scoreBoard')
);

// const domContainer = document.querySelector('#scoreBoard');
// ReactDOM.render(e(LikeButton), domContainer);