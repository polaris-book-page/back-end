const express = require('express') 
const app = express()
const mongoose = require('mongoose')
const config = require('../config/key');
const port = 3000 
const bodyParser = require('body-parser');
const { User } = require('./model.js') 

mongoose.connect(config.mongoURI, {
	useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected ...'))
	.catch(err => console.log(err))
 
app.use(bodyParser.urlencoded({extended: true})); 
app.use(bodyParser.json()); 
 

app.get('/', (req, res) => res.send('Hello World!')) 
app.listen(port, () => console.log(`Example app listening on port ${port}!`)) 
