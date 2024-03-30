const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema  = mongoose.Schema({
	_id: {
		type: String, 
		minlength: 2,
		maxlength: 20,
	}, 
	password: {
		type: String,
		minlength: 5,
	}, 
	nickname: {
		type: String,
		minlength: 6, 
		maxlength: 30
	},
	profileImage: String, 
	createDate: {
		type: Date,
		default: Date.now
	},
	completeRead: Number,
	email: {
		type: String,
		trim: true,
		unique: 1
	},
	auth: {
		token: String,
		ttl: Number,
		created: Number
	},
    goal: Number,
});

const likeSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: "User",
    },
    isbn: String,
});

const reviewSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: "User",
    },
    isbn: {
        type: String,
        ref: "Book",
    },
    evaluation: Number,
    content: {
        type: String,
        maxlength: 250 * 3,
    },
    startDate: Date,
    endDate: Date,
    planetImage: String,
    type: String,
    progressPage: Number,
    progressPercent: Number,
    category: String,
    createDate: {
        type: Date,
        default: Date.now,
    },
});

const bookSchema = new mongoose.Schema({
    isbn: String,
    title: String,
    page: Number,
    writer: String,
    translator: String,
    publisher: String,
    category: String,
    field: String,
    bookImage: String,
});

const quoteSchema = new mongoose.Schema({
    reviewId: {
        type: String,
        ref: "Review",
    },
    isbn: {
        type: String,
        ref: "Book",
    },
    quote: String,
    page: Number,
    category: String,
});

userSchema.methods.comparePassword = function (plainPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
            if (err) return reject(err);
            resolve(isMatch);
        });
    });
};

const User = mongoose.model("User", userSchema);
const Like = mongoose.model("Like", likeSchema);
const Review = mongoose.model("Review", reviewSchema);
const Book = mongoose.model("Book", bookSchema);
const Quote = mongoose.model("Quote", quoteSchema);

module.exports = { User, Like, Review, Book, Quote };
