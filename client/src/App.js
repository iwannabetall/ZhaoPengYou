import {Router} from "@reach/router"
import Landing from './Landing'
import Scoreboard from './ScoreBoard'

const App = () => {
  return (
    <div>
      <Router>
        <Landing path='/' />
        <Scoreboard path='scoreboard' />
      </Router>
    </div>
    )
}


export default App;
