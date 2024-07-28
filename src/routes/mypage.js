const express = require('express') 
const router = express.Router()
const { Review, Like, Book, Quote, User } = require('../models/model');
const email = require('../../config/email');
const upload = require("../aws-storage.js");

router.get('/', async (req, res) => {
    try {
        const result = await User.findOne({ _id: req.session.userId });

        if (!result) {
            return res.json({ userExist: false });
        } 
        res.status(200).json({
            _id: result._id,
            nickname:result.nickname,
            profileImage: result.profileImage ? result.profileImage : null,
            email: result.email,
            createDate: result.createDate
        });
    } catch (err) {
        res.status(500).json({ loadUserInfo: false, err })
    }
});

router.put('/modify', upload.single("profileImage"), async (req, res) => {
    const nickname = req.body.nickname;
    const updateField= {};
    if (req.file !== undefined) {
        const profileImage = req.file.location;

        if (profileImage) updateField.profileImage = profileImage;
    }
    if (nickname) {
        updateField.nickname = nickname;
    }
    console.log(updateField)
    try {
        const result = await User.updateOne(
            { _id: `${ req.session.userId }` },
            { $set: 
                updateField
            }
        )
        if (!result) {
            return res.json({ userExist: false });
        } 
        res.status(200).json({
            update_result: result,
        });
    } catch (err) {
        res.status(500).json({ modifyUserInfo: false, err })
    }
});

router.get('/universe', (req, res) => {
    res.send("universe");
});

router.get('/star-review', async (req, res) => {
    try {
        const results = await Review.find({ userId: req.session.userId })
        if (results.length === 0) {
            return res.status(200).json({ 
                findMyReview: false, 
                message: 'No review corresponding to this user' 
            });
        }
        const isbn = results.map(result => result.isbn);
        const books = await Book.find({ isbn: isbn });
        const reviewList = results.map(result => {
            const book = books.find(book => book.isbn.toString() === result.isbn.toString());
            return {
                title: book ? book.title : null,
                author: book? book.writer : null,
                userId: result ? result.userId : null,
                isbn: result ? result.isbn : null, 
                category: result ? result.category : null,
                type: result ? result.type : null,
                evaluation: result ? result.evaluation : null,
                startDate: result ? result.startDate : null,
                endDate: result ? result.endDate: null,
                bookImage: book ? book.bookImage : null,
                planetImage: result ? result.planetImage : null,
            }
        })
        res.status(200).json({ reviewList: reviewList, findMyReview: true });
    } catch (err) {
        console.error('Error in read my review list', err);
        res.status(500).json({ findMyReview: false, err });
    }
});

router.post('/star-review/detail', (req, res) => {
    res.send("star-review/detail");
});

router.post('/review/add', upload.single("planetImage"), async (req, res) => {

    let quotes = new Array();

    try{
        const newReview = new Review({
            userId: req.body.userId,
            isbn: req.body.isbn,
            evaluation: req.body.evaluation,
            content: req.body.content,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            planetImage: req.file ? req.file.location : null,
            type: req.body.type,
            category: req.body.category,
            progressPage: req.body.progressPage,
            progressPercent: req.body.progressPercent,
        });
        
        const resReview = await newReview.save();
        
        // parsing
        let parsing = ""
        if (req.body.quotes != null) {
            parsing = req.body.quotes;

            // find book
            //const findBook = await Book.findOne( {isbn: req.body.isbn} )
            console.log(req.body.isbn);
            for (let add = 0; add < JSON.parse(parsing).length; add++) {
                const quoteInfo = new Quote({
                    reviewId: newReview._id,
                    isbn: newReview.isbn,
                    quote: JSON.parse(parsing)[add].quote,
                    page: JSON.parse(parsing)[add].page,
                    category: req.body.category,
                });
                const resQuote = await quoteInfo.save();
                quotes.push(resQuote);
            }
        }


        

        const result = {
            review: resReview,
            quote: quotes.length != 0 ? quotes : null
        }
        return res.status(200).json({
            success: true,
            result: result
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({success: false, err})
    }
})

router.put('/review/modify', upload.single("planetImage"), async (req, res) => {
    let quotes = new Array();
    let parsing = null;
    // parsing
    if (req.body.quotes != null) parsing = req.body.quotes;
    console.log(parsing)

    try {
        // update review
        // add to planetImage property later.
        const reviewResult = await Review.findOneAndUpdate({ _id: req.body._id }, {
            $set: {
                evaluation: req.body.evaluation,
                content: req.body.content,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                planetImage: req.file && req.file.location,
                type: req.body.type,
            }
        }, { returnDocument: "after" })

        // update quote
        const findQuote = await Quote.find({ reviewId: req.body._id })

        if (JSON.parse(parsing).length > 0 && findQuote.length <= JSON.parse(parsing).length) { // update + create
            // update
            for (find in findQuote) {
                console.log(find)
                const quoteResult = await Quote.findOneAndUpdate({ _id: findQuote[find]._id }, {
                    $set: {
                        quote: JSON.parse(parsing)[find].quote,
                        page: JSON.parse(parsing)[find].page,
                    }
                }, { returnDocument: "after" })
                quotes.push(quoteResult);
                

            } 
            //create
            for (let add = 0; add < JSON.parse(parsing).length - findQuote.length; add++) {
                const quoteInfo = new Quote({
                    reviewId: reviewResult._id,
                    isbn: reviewResult.isbn,
                    quote: JSON.parse(parsing)[findQuote.length + add]['quote'],
                    page: JSON.parse(parsing)[findQuote.length + add]['page'],
                    category: req.body.category,
                });
                const result = await quoteInfo.save();
                quotes.push(result);
            }
        } else if(findQuote.length > JSON.parse(parsing).length) { // update + delete
            // delete
            const quoteResult = await Quote.deleteMany({ reviewId: reviewResult._id }, {returnDocument: "after"})
            quotes.push(quoteResult)
            // //create
            if (JSON.parse(parsing).length > 0) {
                for (add = 0; add< JSON.parse(parsing).length; add++) {
                    const quoteInfo = new Quote({
                        reviewId: reviewResult._id,
                        isbn: reviewResult.isbn,
                        quote: JSON.parse(parsing)[add]['quote'],
                        page: JSON.parse(parsing)[add]['page'],
                        category: req.body.category,
                    });
                    const result = await quoteInfo.save();
                    quotes.push(result);
                }
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
    try {
        const isLiked = await Like.findOne({ userId: req.session.userId, isbn: req.body.isbn })
        if (isLiked) {
            res.status(200).json({
                like_success: false,
                message: 'already liked book'
            });
            return; 
        }
        const likeInfo = new Like({
            isbn: req.body.isbn,
            userId: req.session.userId
        });
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
    try {
        const result = await Like.deleteOne({ userId: req.body.userId, isbn: req.body.isbn });
        res.status(200).json({
            likeDel_success: true,
            result: result 
        });
    } catch (err) {
        console.error('Error in delete like book', err);
        res.status(500).json({ likeDel_success: false, err });
    }
});

router.post("/check/like", async (req, res) => {
    try {
        const isLiked = await Like.findOne({ userId: req.session.userId, isbn: req.body.isbn })
        if (isLiked) {
            return res.status(201).json({ is_liked: true });
        } else {
            return res.status(201).json({ is_liked: false });
        }
    } catch (e) {
        return res.status(500).json({ error: 'An error occurred during check book liked.', e });
    }
})

router.get('/like/list', async (req, res) => {
    try {
        const likes = await Like.find({ userId: req.session.userId });
        const isbn = likes.map(like => like.isbn);
        const books = await Book.find({ isbn: isbn });

        const user = await User.findOne({ _id: req.session.userId });
        const result = likes.map(like => {
            const book = books.find(book => book.isbn.toString() === like.isbn.toString());
            return {
                _id: like._id,
                isbn: like.isbn,
                userId: like.userId,
                title: book ? book.title : null,
                author: book ? book.writer : null,
                publisher: book ? book.publisher : null,
                cover: book ? book.bookImage : null,
                nickname: user ? user.nickname : null,
            };
        })
        res.status(200).json(result)
    } catch (err) {
        console.error('Error in read like list', err);
        res.status(500).json({ findLfike: false, err });
    }
})

router.post('/goal', async (req, res) => {
    try {
        const result = await User.findOneAndUpdate(
            { _id: req.session.userId },
            {
                $set: {
                    goal: req.body.goal
                },
            }, {returnDocument: "after"}
        );        
        res.status(200).json({
            goal_success: true,
            result: result  
        });
    } catch (err) {
        console.error('Error in save goal', err);
        res.status(500).json({ goal_success: false, err });
    }
})

router.get('/goal/check', async (req, res) => {
    try {
        const findUser = await User.findOne({ _id: req.session.userId });
        if (findUser.goal) {
            res.status(200).json({
                result: true,
                goal: findUser.goal 
            });
        } else {
            res.status(200).json({
                result: false 
            });
        }
    } catch(err) {
        console.error('Error in check goal', err);
        res.status(500).json({ goal_check: false, err });
    }
})

router.get('/iswrited/review/:userId/:isbn', async (req, res) => {
    const userId = req.params.userId;
    const isbn = req.params.isbn;
    
    try{
        const findReview = await Review.findOne({userId: userId, isbn: isbn});
        
        if(findReview === null) return res.status(200).json({ success: true, iswrited: false });
        else return res.status(200).json({ success: true, iswrited: true, reviewId: findReview._id });

    } catch(err){
        console.error('Server error', err);
        res.status(500).json({ success: false, err });
    }
})

module.exports = router