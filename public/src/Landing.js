import { navigate } from "@reach/router"
import React, { useEffect, useState } from "react"
import randomWords from 'random-words'

function Landing() {
	const [name, setName] = useState('')
	
	const handleSubmit = (e) => {
		// console.log(e)
		e.preventDefault()
		if (name !=''){
			
			console.log(name)
			socket.emit('set name', {name: name, id: playerid })
			var roomName = randomWords({exactly: 3, join:'-'})
			socket.emit('new room', {room: roomName })
			navigate(`/room/${roomName}`)	

		} else {
			// dont let them proceed w/o a name
			
		}
		
	}

	return (
		<div className='landing'>
			<h1> ZhaoPengYou </h1>
			<form>
				<div className='nameInp'>
					<label htmlFor='playername'>Your name: </label>
					<input type='text' id='playername' placeholder='Or Change Your Name' name='playername' onChange={e => setName(e.target.value)} value={name}/>				
				</div>
				<button className='landingbtn' type='button' onClick={handleSubmit}>Create Room</button>
			</form>
		</div>
	)

}

export default Landing
