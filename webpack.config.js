

const path = require('path');

module.exports = {
	mode: 'development',
	entry:  ['./public/src/App.js'],
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname + '/public/bundle'),
		publicPath: 'http://localhost:3000/',
	},
	devServer: {
		contentBase: './public',
		inline:false,
		historyApiFallback: true,
		// hot: true,
		lazy: true,
		filename: 'main.js'
	},
	module : {
		rules: 
		[{
	        "exclude": "/node_modules/",
	        // "include": "./app/",
	        // "loader": "babel-loader",
	        // "options": {
	          // "presets": ["es2015", "react"]
	          // "presets": ['@babel/preset-env']
	        "use": 
		        [
		      //   { 
		      //   	loader: 'react-hot-loader',
		      //   	options: {
		      //   		presets: [['react-hot-loader/webpack', 'babel']]
		      //   	}
		      //   	// cacheDirectory: true,  // just added - 9/16 - 2 pm 
		      //   	// plugins: ['react-hot-loader/babel'],  // just added },
		     	// }, 
		     	{
		     		loader: 'babel-loader',
		     		options: {
		 				presets: [["@babel/env", { "useBuiltIns": "entry" }]],        	         
		    	        }	      
		        // "test": /\.jsx?$/
		    	}],
		}]
	}	
};

// use: {
//         loader: 'babel-loader',
//         options: {
//           presets: ['@babel/preset-env']
//         }
//       }