import React, { useEffect, useState } from "react";
import socket from './helpers/socketConfig'

function Landing() {
	const [name, setName] = useState('')
	
	const handleSubmit = (e) => {
		e.preventDefault()
		// socket.emit('set name', {name: name, id: playerid })
		socket.emit('set name', {name: name})
	}

	return (
		<div>
			<form>
				<label htmlFor='playername'>Your name</label>
				<input type='text' id='playername' name='playername' onChange={e => setName(e.target.value)} value={name}/>
				<button type='button' onClick={handleSubmit}>Submit</button>
			</form>
		</div>
		)

}

export default Landing
