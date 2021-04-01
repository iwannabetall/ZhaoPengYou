import { navigate } from "@reach/router"
import React, { useEffect, useState } from "react"
import randomWords from 'random-words'

function Landing() {
	const [name, setName] = useState('')
	
	const handleSubmit = (e) => {
		console.log(e)
		e.preventDefault()
		socket.emit('set name', {name: name, id: playerid })
		
	}

	const createRoom = () => {
		var roomName = randomWords({ exactly: 3, join:'-'})
		socket.emit('new room', {room: roomName })
		navigate(`/room/${roomName}`)
	}

	return (
		<div>
			<form>
				<label htmlFor='playername'>Your name</label>
				<input type='text' id='playername' name='playername' onChange={e => setName(e.target.value)} value={name}/>
				<button type='button' onClick={handleSubmit}>Submit</button>
				<button type='button' onClick={createRoom}>Create Room</button>
			</form>
		</div>
	)

}

export default Landing
