
const { Pool } = require('pg');

var moment = require('moment')
const path = require('path')

require('dotenv').config({path: path.resolve(__dirname, '../.env')})
// require('dotenv')
const pool = new Pool({	
  connectionString: process.env.URI,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORT,
  host: process.env.HOST,
  ssl: { rejectUnauthorized: false }
  // sslfactory: org.postgresql.ssl.NonValidatingFactory
});

module.exports = function(io) {

	var databaseProcesses = {}
	
	databaseProcesses.saveGameData = async (req, res, next) => {

		// console.log(req.query.data)
		const client = await pool.connect()
		var gameid = req.query.gameid
		var gamedata = req.query.data
		
		// const result = await client.query('SELECT max(restaurant_id) from restaurantinfo;');
		var text = 'insert into gamedata (gameid, gamedata) VALUES ($1, $2) returning *';
		var values = [gameid, JSON.stringify(gamedata)]

		// WAIT WHAT
		// Do not use pool.query if you need transactional integrity: the pool will dispatch every query passed to pool.query on the first available idle client. Transactions within PostgreSQL are scoped to a single client and so dispatching individual queries within a single transaction across multiple, random clients will cause big problems in your app and not work. For more info please read transactions.

		client
			.query(text, values)
			.then(results => {	
				console.log('DATA SAVED')
				// io.emit('gameid', {'gameid': results.rows[0].gameid})				
			})
			.catch(e => console.error(e.stack))	
		 client.release()
	}

	databaseProcesses.resaveData = async (req, res, next) => {
			
		var gameid = req.query.gameid
		var gamedata = JSON.parse(req.query.data)[gameid]
		
		const client = await pool.connect()

		var queryStr = "update gamedata set gamedata = $1 where gameid = $2;"
		var values = [JSON.stringify(gamedata), gameid]

		client
			.query(queryStr, values)
			.then(results => {
				console.log(results[0])
			})
			.catch(e => console.error(e.stack))	

		client.release()
	}

	databaseProcesses.gameDone = async function gameDone(queryStr, values) {	 

		pool.query(queryStr, values, (error, results) => {
			if (error) {
				throw error
			}
			// response.status(200).json(results.rows)
		})		
	}


	databaseProcesses.genSQLInsertText = function genSQLInsertText(numVals, rows) {
			// numVals = number of vars to insert 
			// rows = # of rows need inserts for 
		var valstr = ''
		var entrystr = '('
		for(var i = 1; i<=rows * numVals; i++) {
			if (i % numVals == 0) {
				if (i == rows * numVals) {
					entrystr = entrystr + `$${i});`
				} else {
					entrystr = entrystr + `$${i}), ` 
				}
				valstr = valstr + entrystr
				var entrystr = '('
			} else {
				entrystr = entrystr + `$${i}, `
			}
			
		}

			return valstr
		}


	return databaseProcesses;

}


// exports
	// var queryStr = 'select distinct restaurant_id, restaurant from restaurantinfo order by 	restaurant asc;'
		// const client = await pool.connect()

		// client.query(queryStr, (err, results) => {
		// 	if (err) {
		// 		console.log(err.stack)
		// 		next(err)
		// 	} else {
		// 		console.log(results.rows[0])
				
		// 		res.locals.reviewed = results.rows			
		// 		next()
		// 	}
		// })