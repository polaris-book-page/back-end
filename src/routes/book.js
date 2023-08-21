const express = require("express");
const router = express.Router();
const upload = require("../aws-storage.js");
const { Book, Review, User, Quote } = require("../models/model");

router.get("/most-read", (req, res) => {
    res.send("most-read");
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

router.post("/add-review", async (req, res) => {
    try {
        const review = await Review.findOne({
            userId: req.body.userId,
            isbn: req.body.isbn,
        });
        if (review == null) {
            // new review
            const reviewInfo = new Review(req.body);
            const result = await reviewInfo.save();
            res.status(200).json({
                success: true,
                data: result,
            });
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
                        planetImage: req.body.planetImage,
                        type: req.body.type,
                        progressPage: req.body.progressPage,
                        progressPercent: req.body.progressPercent,
                    },
                }, {returnDocument: "after"}
            );
            res.status(200).json({
                success: true,
                data: result,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "fail to add review.", err });
    }
});

router.get("/info", (req, res) => {
    res.send("info");
});

router.get("/info/rewiew", async (req, res) => {
    if(!req.session.is_logined){
        res.redirect('/user/login');
    }
    try {
        const review = await Review.findOne({ userId: req.session.userId, isbn: req.body.isbn })
        const quoteReview = await Quote.find({ userId: req.session.userId, isbn: req.body.isbn })
        const quoteInfo = Object.keys(quoteReview).length === 0 ? null : {
            sentence: quoteReview[0].sentence,
            page: quoteReview[0].page
        };
        console.log(review)
        const result = {
                isbn: review.isbn,
                evaluation: review.evaluation,
                planetImage: review.planetImage ? review.planetImage : null,
                startDate: review.startDate,
                endDate: review.endDate,
                content: review.content ? review.content : null,
                bookImage: req.body.bookImage,
                quote: quoteInfo
        } 
        res.status(200).json(result)
    } catch (err) {
        console.error('Error in read my review detail', err);
        res.status(500).json({ findMyOneReview: false, err });
    }
});

router.get("/info/rewiew/list", async (req, res) => {
    try {
        const reviews = await Review.find({ isbn: req.body.isbn })
        if (reviews.length === 0) {
            res.status(404).json({ 
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
        res.status(200).json(result)
    } catch (err) {
        console.error('Error in read book review list', err);
        res.status(500).json({ findBookReview: false, err });
    }
});

module.exports = router;
