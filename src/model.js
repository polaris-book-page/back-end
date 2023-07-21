const mongoose = require('mongoose')

const userSchema  = mongoose.Schema({
	name: {
		type: String, 
		maxlength: 50
	}, 
	email: {
		type: String,
		trim: true, //중간에 들어간 space 삭제
		unique: 1 //똑같은 이메일 쓰지 못하게
	}, 
	password: {
		type: String,
		minlength: 5,
	}, 
	lastname: {
		type: String,
		maxlength: 50
	},
	role: { //어떤 유저가 관리자가 될 수 있고, 일반 유저가 될 수 있기에 구분
		type: Number, 
		default: 0
	}, 
	image: String, 
	token: { //유효성 관리
		type : String
	},
	tokenExp: { //토큰을 사용할 수 있는 기한
		type: Number
	}
}) 
 
const User = mongoose.model('User', userSchema) //schema를 모델로 감싸줌
 
module.exports = { User } //user를 다른 곳에서도 쓸 수 있도록