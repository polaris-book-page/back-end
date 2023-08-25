const express = require('express') 
const router = express.Router()
const { Review, Like, Book, Quote } = require('../models/model');

router.get('/', (req, res) => {
    res.send("mypage");
});

router.put('/modify', (req, res) => {
    res.send("modify");
});

router.get('/universe', (req, res) => {
    res.send("universe");
});

router.get('/calendar', (req, res) => {
    res.send("calendar");
});

router.post('/star-review', async (req, res) => {
    if(!req.session.is_logined){
        res.redirect('/user/login');
    }
    try {
        const results = await Review.find({ userId: req.session.userId })
        if (results.length === 0) {
            res.status(404).json({ 
                findMyReview: false, 
                message: 'No review corresponding to this user' 
            });
        }
        const reviewList = results.map(result => ({
            userId: result.userId,
            isbn: result.isbn,
            evaluation: result.evaluation,
            endDate: result.endDate
        }));
        res.status(200).json(reviewList);
    } catch (err) {
        console.error('Error in read my review list', err);
        res.status(500).json({ findMyReview: false, err });
    }
});

router.post('/star-review/detail', (req, res) => {
    res.send("star-review/detail");
});

router.put('/review/modify', async (req, res) => {
    let quotes = new Array();

    try {
        // update review
        // add to planetImage property later.
        const reviewResult = await Review.findOneAndUpdate({ _id: req.body._id }, {
            $set: {
            evaluation: req.body.evaluation,
            content: req.body.content,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            }
        }, { returnDocument: "after" })

        // update quote
        const findQuote = await Quote.find({ reviewId: req.body._id })

        if (findQuote.length <= req.body.quotes.length) { // update + create
            // update
            for (find in findQuote) {
                const quoteResult = await Quote.findOneAndUpdate({ _id: findQuote[find]._id }, {
                    $set: {
                        quote: req.body.quotes[find].quote,
                        page: req.body.quotes[find].page,
                    }
                }, { returnDocument: "after" })
                quotes.push(quoteResult);
                //console.log(quoteResult)
            }
            //create
            for (let add = 0; add < req.body.quotes.length - findQuote.length; add++) {
                const quoteInfo = new Quote({
                    reviewId: reviewResult._id,
                    isbn: reviewResult.isbn,
                    quote: req.body.quotes[findQuote.length + add]['quote'],
                    page: req.body.quotes[findQuote.length + add]['page'],
                    category: req.body.category,
                });
                const result = await quoteInfo.save();
                quotes.push(result);
            } 
        } else { // update + delete
            // delete
            const quoteResult = await Quote.deleteMany({ reviewId: reviewResult._id })

            //create
            for (add in req.body.quotes) {
                const quoteInfo = new Quote({
                    reviewId: reviewResult._id,
                    isbn: reviewResult.isbn,
                    quote: req.body.quotes[add]['quote'],
                    page: req.body.quotes[add]['page'],
                    category: req.body.category,
                });
                const result = await quoteInfo.save();
                quotes.push(result);
            }
        }
        
        //console.log(quotes)
        const result = {
            updateReview: reviewResult,
            updateQuote: quotes.length != 0 ? quotes : null
        }
        res.status(200).json({
            success: true,
            result: result
        })

    } catch (err) {
        res.status(500).json({success: false, err})
    }
});

router.delete('/review/delete', async (req, res) => {
    //console.log(req.query)
    try {
        const reviewResult = await Review.deleteOne({ _id: req.query.reviewId })
        res.status(200).json({success: true, reviewResult})
    } catch (err) {
        res.status(500).json({success: false, err})
    }
    
});

router.post('/like', async (req, res) => {
    if(!req.session.is_logined){
        res.redirect('/user/login');
    }
    const likeInfo = new Like(req.body);
    likeInfo.userId = req.session.userId
    try {
        const result = await likeInfo.save();
        
        res.status(200).json({
            like_success: true,
            result: result 
        });
    } catch (err) {
        console.error('Error in save like book', err);
        res.status(500).json({ like_success: false, err });
    }
});

router.delete('/unlike', async (req, res) => {
    if(!req.session.is_logined){
        res.redirect('/user/login');
    }
    try {
        const result = await Like.deleteOne({ userId: req.session.userId, isbn: req.body.isbn });
        res.status(200).json({
            likeDel_success: true,
            result: result 
        });
    } catch (err) {
        console.error('Error in delete like book', err);
        res.status(500).json({ likeDel_success: false, err });
    }
});

router.get('/like/list', async (req, res) => {
    if(!req.session.is_logined){
        res.redirect('/user/login');
    }
    try {
        const likes = await Like.find({ userId: req.session.userId });
        const isbn = likes.map(like => like.isbn);
        const books = await Book.find({ isbn: isbn });
        const result = likes.map(like => {
            const book = books.find(book => book.isbn.toString() === like.isbn.toString());
            return {
                _id: like._id,
                isbn: like.isbn,
                userId: like.userId,
                title: book ? book.title : null,
                writer: book ? book.writer : null,
                publisher: book ? book.publisher : null,
                bookImage: book ? book.bookImage : null,
            };
        })
        res.status(200).json(result)
    } catch (err) {
        console.error('Error in read like list', err);
        res.status(500).json({ findLike: false, err });
    }
})

module.exports = router