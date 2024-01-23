const express = require('express') 
const app = express()
const router = express.Router()
const cookieParser = require('cookie-parser')
const session = require('express-session')
const { User } = require('../models/model') 
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

router.get('/join/nickname-check', async(req, res) => {
    // 얘는 지금 받는 파라미터가 없는데 왜 body로 받아지지?
    console.log(req.body)
    const { nickname } = req.body;
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

router.post('/initial-evaluation', (req, res) => {
    res.send("/initial-evaluation");
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
        return res.status(201).json({ is_logined: req.session.is_logined, userId: req.session.userId});
    } else {
        return res.json({ is_logined: false, userId: "none" });
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