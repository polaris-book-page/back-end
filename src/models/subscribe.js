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

const Subscribe = mongoose.model('Subscribe', subscribeSchema);

module.exports = { Subscribe }
// module.exports = mongoose.model('Subscribe', subscribeSchema);