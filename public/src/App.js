import {Router} from "@reach/router"
import ReactDOM from 'react-dom'
import React from 'react'
import Landing from './Landing'
import Scoreboard from './ScoreBoard'

const App = () => {
	return (
			<Router>
				<Landing path='/' />
				<Scoreboard path='/room/:roomId' />
			</Router>
		)
}


ReactDOM.render(<App/>,
  document.getElementById('scoreBoard')
);

if (module.hot) {
   module.hot.accept('./ScoreBoard.js', function() {
     console.log('Accepting the updated printMe module!');
   })
 }