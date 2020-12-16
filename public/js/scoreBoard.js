

class Scoreboard extends React.Component {
	constructor(props) {
		super(props)
		this.setName = this.setName.bind(this)
		this.state = {
			playerInfo: null,
			name: '',
			pointsOnTable: 0,
			scoreBoard: null
		}
	}

	setName() {
		var name = document.getElementById('playername').value
		console.log(name, playerid)
		this.setState({
			name: name
		})
		socket.emit('set name', {name: name, id: playerid })
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
	}

	// {this.state.playerInfo && <PlayerOrder players={this.state.playerInfo}/>}
	render() {
		return (
			<div>
				{this.state.name == '' && <PlayerName setName={() => this.setName()} name={this.state.name}/>}
				{this.state.scoreBoard && <Rankings score={this.state.scoreBoard}/>}
			</div>
			)
	}

}

function PlayerOrder (props) {
	return (
		<div> {props.players.map(player => <div key={player.id}>{player.name}</div>)}
		</div>)
}

function PlayerName(props){

	return (
		<form>
			<label for='playername'>Your name</label>
			<input type='text' id='playername' name='playername'/>
			<button type='button' onClick={props.setName}>Submit</button>
		</form>
		)
	
}

function Rankings (props) {
	return (
			<div>
				<h1>Score</h1>
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