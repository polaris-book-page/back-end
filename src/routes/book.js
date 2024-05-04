const express = require("express");
const router = express.Router();
const upload = require("../aws-storage.js");
const { Book, Review, User, Quote } = require("../models/model");

router.get("/most-read", async (req, res) => {
    try {
        const loadReview = await Review.aggregate([
            { $group: { _id: "$isbn", count: { $count: {} } } },
            {$sort: {count: -1} }
        ]);

        return res.status(200).json(loadReview);
    } catch (err) {
        res.status(500).json({ error: "most read a book load failure.", err });
    }
});

router.post("/add-book", upload.single("bookImage"), async (req, res) => {
    console.log("req:", req.file.location);
    try {
        const bookInfo = new Book({
            isbn: req.body.isbn,
            title: req.body.title,
            page: req.body.page,
            writer: req.body.writer,
            translator: req.body.translator,
            publisher: req.body.publisher,
            category: req.body.category,
            field: req.body.title,
            bookImage: req.file.location,
        });

        console.log(bookInfo);

        const result = await bookInfo.save();

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(500).json({ error: "fail to add book.", err });
    }
});

router.put("/add-review", upload.single("planetImage"), async (req, res) => {
    let reviewId;
    let resBody;
    let quotes = new Array();

    try {
        const review = await Review.findOne({
            userId: req.body.userId,
            isbn: req.body.isbn,
        });
        if (review == null) {
            // new review
            const reviewInfo = new Review({
                userId: req.body.userId,
                isbn: req.body.isbn,
                evaluation: req.body.evaluation,
                content: req.body.content,
                progressPage: req.body.progressPage,
                progressPercent: req.body.progressPercent,
                quotes: req.body.quotes,
                category: req.body.category,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                planetImage: req.file.location
            });
            const result = await reviewInfo.save();
            reviewId = reviewInfo._id;
            resBody = result;
        } else {
            // exist review content
            const result = await Review.findOneAndUpdate(
                { userId: req.body.userId, isbn: req.body.isbn },
                {
                    $set: {
                        evaluation: req.body.evaluation,
                        content: req.body.content,
                        startDate: req.body.startDate,
                        endDate: req.body.endDate,
                        planetImage: req.file.location,
                        type: req.body.type,
                        progressPage: req.body.progressPage,
                        progressPercent: req.body.progressPercent,
                    },
                }, {returnDocument: "after"}
            );
            reviewId = result._id;
            resBody = result;
        }

        // new Quotes
        if (req.body.quotes != null) {
            for (i in req.body.quotes) {
                const quoteInfo = new Quote({
                    reviewId: reviewId, 
                    isbn: req.body.isbn,
                    quote:req.body.quotes[i]['quote'],
                    page:req.body.quotes[i]['page'],
                    category: req.body.category,
                });
                const result = await quoteInfo.save();
                quotes.push(result);
            }
        }
        
        // return
        res.status(200).json({
            success: true,
            data: {result: resBody, quotes: quotes.length != 0 ? quotes : null}
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "fail to add review.", err });
    }
});

router.get("/info/:isbn", async(req, res) => {
    console.log(req.params.isbn)
    const isbn = req.params.isbn;
    console.log(isbn)
    
    try {
        const result = await Book.findOneAndUpdate(
            { isbn: isbn },
            { $set: { page: req.body.page } },
            { upsert: true, new: true }
        );
        res.status(200).json({ 
            update_book_info: true, 
            book: result 
        });
    } catch (e) {
        res.status(500).json({ error: "fail to find book info.", e });
    } 
});

router.get("/info/review/:isbn", async (req, res) => {
    console.log(req.params.isbn)
    const isbn = req.params.isbn;
    if(!req.session.is_logined){
        res.redirect('/user/login');
    }
    try {
        const review = await Review.findOne({ userId: req.session.userId, isbn: isbn })
        const book = await Book.findOne({ isbn: isbn });
        const quoteReview = await Quote.find({ reviewId: review._id, isbn: isbn })
        const quoteInfo = Object.keys(quoteReview).length === 0 ? null : quoteReview.map(result =>{
            return{
                sentence: result.quote,
                page: result.page
            }
        })
        console.log(quoteReview)

        const result = {
                isbn: isbn,
                evaluation: review.evaluation ? review.evaluation : null,
                planetImage: review.planetImage ? review.planetImage : null,
                startDate: review.startDate,
                endDate: review.endDate,
                content: review.content ? review.content : null,
                bookImage: book.bookImage,
                quote: quoteInfo
        } 
        res.status(200).json(result)
    } catch (err) {
        console.error('Error in read my review detail', err);
        res.status(500).json({ findMyOneReview: false, err });
    }
});

router.get("/info/review/list", async (req, res) => {
    const isbn = req.query.isbn;
    const currentPage = req.query.page || 1;
    const perPage = 6;

    try {
        const reviews = await Review.find({ isbn: isbn })
            .sort({ "createDate": -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        if (reviews.length === 0) {
            return res.status(200).json({ 
                findBookReview: false, 
                message: 'No review corresponding to this isbn' });
        }
        const userIds = reviews.map(review => review.userId)
        const users = await User.find({ _id: userIds })

        const userIdToReviewCountMap = await Review.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);
        const userIdToReviewCount = {};
        userIdToReviewCountMap.forEach(item => {
            userIdToReviewCount[item._id.toString()] = item.count;
        });
        
        const result = reviews.map(review => {
                const user = users.find(user => user._id.toString() === review.userId.toString());
                const login_user_reviews = userIdToReviewCount[review.userId.toString()] || 0;
            return {
                userId: review.userId,
                isbn: review.isbn,
                content: review.content ? review.content : null,
                startDate: review.startDate,
                createDate: review.createDate,
                evaluation: review.evaluation,
                profileImage: user.profileImage ? user.profileImage : null,
                finRead: login_user_reviews
            };
        })
        res.status(200).json({ result: result, findBookReview: true })
    } catch (err) {
        console.error('Error in read book review list', err);
        res.status(500).json({ findBookReview: false, err });
    }
});

router.get("/ten-quotes", async (req, res) => {
    try {
        const quotes = await Quote.aggregate([{ $sample: { size: 10 } }])
        res.status(200).json({ success: true, quotes: quotes })
    } catch (err) {
        res.status(500).json({ findQuote: false, err });
    }
});

module.exports = router;
