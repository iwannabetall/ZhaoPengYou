import { navigate } from "@reach/router"
import React, { useEffect, useState } from "react"
import randomWords from 'random-words'

function Landing() {
	
	const handleSubmit = () => {	
		socket.emit('new room')		
	}

	socket.on('go to room', function(room) {
		console.log(room)
		navigate(`/room/${room.roomId}`)	
	})

	return (
		<div className='landing'>
			<h1> ZhaoPengYou </h1>			
				<button className='landingbtn' type='button' onClick={handleSubmit}>Create Room</button>			
		</div>
	)

}

export default Landing
