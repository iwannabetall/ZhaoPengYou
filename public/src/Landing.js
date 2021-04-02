import { navigate } from "@reach/router"
import React, { useEffect, useState } from "react"
import randomWords from 'random-words'

function Landing() {
	
	const handleSubmit = () => {	
		var roomName = randomWords({exactly: 3, join:'-'})
		socket.emit('new room', {room: roomName })
		navigate(`/room/${roomName}`)	
		
	}

	return (
		<div className='landing'>
			<h1> ZhaoPengYou </h1>			
				<button className='landingbtn' type='button' onClick={handleSubmit}>Create Room</button>			
		</div>
	)

}

export default Landing
