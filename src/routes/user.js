const express = require('express') 
const app = express()
const router = express.Router()
const cookieParser = require('cookie-parser')
const session = require('express-session')
const { User, Book, Review } = require('../models/model') 
const { Subscribe } = require('../models/subscribe') 
const mongoose = require('mongoose')
const config = require('../../config/key');
const session_key = require('../../config/session_key');
const MongoStore = require("connect-mongo");
const bcrypt = require('bcrypt')
const saltRounds = 10
const email = require('../../config/email')
const nodemailer = require('nodemailer');
const crypto = require('crypto')

router.post('/join', async (req, res) => {
    // if(req.session.is_logined){
    //     res.redirect('/');
    // }
    const userInfo = new User(req.body);
    console.log(userInfo)
    try {
        const hash = await bcrypt.hash(userInfo.password, saltRounds);
        userInfo.password = hash;
        
        const result = await userInfo.save();
        
        res.status(200).json({
            join_success: true,
            user: result 
        });
    } catch (err) {
        console.error('Error in /id-join', err);
        res.status(500).json({ join_success: false, err });
    }
});

router.get('/join/id-check/:_id', async(req, res) => {
    const { _id } = req.params;
    console.log("           ", req.params)

    try {
        const result = await User.findOne({ _id });

        if (result) {
            return res.json({ isAvailable: false });
        } else {
            return res.status(200).json({ isAvailable: true });
        }
    } catch (err) {
        console.error('Error in /id-check', err);
        res.status(500).json({ idCheckerror: 'An error occurred while checking the id.', err });
    }
});

router.get('/join/nickname-check/:nickname', async(req, res) => {
    const { nickname } = req.params;
    try {
        const result = await User.findOne({ nickname });
    
        if (result) {
            return res.json({ isAvailable: false });
        } else {
            return res.status(200).json({ isAvailable: true });
        }
    } catch (err) {
        console.error('Error in /nickname-check', err);
        res.status(500).json({ nicknameCheckError: 'An error occurred while checking the nickname.', err });
    }
});

router.post('/initial-evaluation', async(req, res) => {
    const books = req.body;
    try {
        const bookList = books.map(async book => {
            // 별점 저장
            const evaluatedBook = new Review({
                userId: req.session.userId,
                isbn: book.isbn13,
                evaluation: book.evaluation
            })
            // 책 정보 저장
            const haveTranslator = book.author.indexOf('(옮긴이)')
            const catagory = book.categoryName.substring(book.categoryName.indexOf('>') + 1)
            const bookInfo = new Book({
                isbn: book.isbn13,
                title: book.title,
                writer: book.author.substring(0, book.author.indexOf('(지은이)') - 1),
                translator: haveTranslator != -1 
                ? book.author.substring(book.author.indexOf(',') + 2, book.author.indexOf('(옮긴이)') - 1) 
                : null,
                publisher: book.publisher, 
                //카테고리 > 분야
                category: catagory.substring(0, catagory.indexOf('>')),
                field: catagory.substring(catagory.indexOf('>') + 1, catagory.indexOf('>', catagory.indexOf('>') + 1)), //slice필요
                bookImage: book.cover
            })
            await evaluatedBook.save()
            return await bookInfo.save()
            
        })
        const result = await Promise.all(bookList);
        res.status(200).json(result);
    } catch(err) {
        console.error('Error in save evaluatedBooks', err);
        res.status(500).json({ saveEvaluatedBooks: false, err });
    }
});

router.post('/login', async (req, res) => {
    console.log(req.session)
    const { _id, password } = req.body;
    try {
        const user = await User.findOne({ _id });
        if (!user) {
            return res.json({ existingUser: false });
        }
    
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.json({ loginSuccess: false });
        }
        req.session.userId = _id
        req.session.is_logined = true
        req.session.save(function () {
            return res.status(200).json({ 
                loginSuccess: true, 
                session: req.session 
            });
        })
    } catch (err) {
        console.error('Error in /login', err);
        return res.status(500).json({ logoutError: 'An error occurred during login.', err });
    }
});

router.get("/check", async (req, res) => {
    if(req.session.is_logined){
        const user = await User.findOne({ _id: req.session.userId });
        // console.log(user)
        return res.status(201).json({ is_logined: req.session.is_logined, userId: req.session.userId, nickname: user.nickname });
    } else {
        return res.json({ is_logined: false, userId: "none", nickname: "none" });
    }
})

router.get("/logout", function(req, res, next){
    try {
        req.session.destroy();
        res.clearCookie('connect.sid');
        return res.status(200).json({ logoutSuccess: true, userid: req.session });
    } catch (err) {
        console.error('Error in /logout', err);
        return res.status(500).json({ error: 'An error occurred during logout.', err });
    }
})

router.post("/forgot-password", async (req, res) => {
    const { _id } = req.body;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: email.auth.user,
            pass: email.auth.pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    try {
        const user = await User.findOne({ _id });
        if (!user) {
            return res.json({ existingUser: false });
        }
        const token = crypto.randomBytes(20).toString("base64");
        user.auth.token = token
        user.auth.ttl = 300
        user.auth.created = Date.now()
        const result = await user.save();
        const message = {
            from: "bookpolaris2023@gmail.com",
            to: user.email,
            subject: "비밀번호 초기화 이메일입니다",
            html: "<p>비밀번호 초기화를 위해서는 아래의 URL을 클릭해 주세요.</p>" 
                + `<a href="http://localhost:3000/auth/reset-password/?token=${token}">비밀번호 재설정 링크</a>`
        };
        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.error('Error in send email', err);
                return res.status(500).json({ email_success: false, err });
            }
        })
        transporter.close();
        res.status(200).json({ 
            email_success: true, 
            user: result 
        });
    } catch (err) {
        console.error('Error in /forgot-password', err);
        return res.status(500).json({ error: 'An error occurred during forgot-password', err });
    }
})

router.post('/reset-password', async (req, res) => {
    const new_password = req.body.password;
    const { token } = req.body;
    try {
        const user = await User.findOne({ 
            'auth.token': `${ token }`, 
            'auth.created': { $gt: Date.now() - 300 * 1000 } 
        });
        if (!user) {
            return res.json({ existingToken: false });
        }
        const result = await User.updateOne(
            { _id: `${ user._id }` },
            { $set: { 
                password: await bcrypt.hash(new_password, saltRounds),
                'auth.token': null,
                'auth.ttl': null
            } }
        )
        res.status(200).json({ 
            reset_password_success: true, 
            user: result 
        });
    } catch (err) {
        console.error('Error in /reset-password', err);
        return res.status(500).json({ error: 'An error occurred during reset-password.', err });
    }
})

router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    const subscribeInfo = new Subscribe(req.body);
    console.log(subscribeInfo)
    try {
        const isExist = await Subscribe.findOne({ email });
        console.log(isExist)
        if (isExist) {
            return res.json({ alreadyExist: true });
        } 
        const subscribeInfo = new Subscribe(req.body);
        console.log("subscribeInfo: ", subscribeInfo)
        const result = await subscribeInfo.save();
        res.status(200).json({
            subscribe_success: true,
            result: result 
        });
    } catch (err) {
        res.status(500).json({ subscribe_success: false, err });
    }
});

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        const findUser = await User.findOne({_id: userId})
        if (findUser == null) return res.status(200).json({success: false, findUser})
        return res.status(200).json({success: true, findUser})
    } catch (err) { // user is none
        return res.status(404).json({
            success: false,
            message: "fail to find user."
        })
    }
})

module.exports = router