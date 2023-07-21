const mongoose = require('mongoose')

const subscribeSchema = new mongoose.Schema({
	email: {
		type: String,
		trim: true, 
		unique: 1 
	},
	nickname: {
		type: String,
		maxlength: 30
	}
});

module.exports = mongoose.model('Subscribe', subscribeSchema);