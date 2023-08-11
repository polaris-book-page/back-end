const express = require('express') 
const app = express()
const router = express.Router()
const { User } = require('../models/model') 
const bcrypt = require('bcrypt')
const saltRounds = 10
const email = require('../../config/email')
const nodemailer = require('nodemailer');
const crypto = require('crypto')

router.post('/join', async (req, res) => {
    const userInfo = new User(req.body);
    
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

router.get('/join/id-check', async(req, res) => {
    const { _id } = req.body;

    try {
        const result = await User.findOne({ _id });

        if (result) {
            return res.json({ isAvailable: false });
        } else {
            return res.json({ isAvailable: true });
        }
    } catch (err) {
        console.error('Error in /id-check', err);
        res.status(500).json({ error: 'Server error', err });
    }
});

router.get('/join/nickname-check', async(req, res) => {
    const { nickname } = req.body;
    try {
        const result = await User.findOne({ nickname });
    
        if (result) {
            return res.json({ isAvailable: false });
        } else {
            return res.json({ isAvailable: true });
        }
    } catch (err) {
        console.error('Error in /nickname-check', err);
        res.status(500).json({ error: 'Server error', err });
    }
});

router.post('/initial-evaluation', (req, res) => {
    res.send("/initial-evaluation");
});

router.post('/login', async (req, res) => {
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
        return res.json({ loginSuccess: true, session: req.session });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred during login.' });
    }
});

router.get("/logout", function(req, res, next){
    req.session.destroy();
    res.clearCookie('sid')
    res.send('logout')
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
                + `<a href="http://localhost:3001/auth/reset-password/?token=${token}">비밀번호 재설정 링크</a>`
        };
        transporter.sendMail(message, (err, info) => {
            if (err) {
                console.error("err", err);
                return res.status(500).json({ error: 'send email error' });
            }
        })
        transporter.close();
        res.status(200).json({ email_success: true, user: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred during check-id.' });
    }
})

router.post('/reset-password', async (req, res) => {
    const new_password = req.body.password;
    const { token } = req.body;
        try {
        const user = await User.findOne({ 
            'auth.token': `${ token }`, 
            'auth.created': { $lt: Date.now() - 300 } 
        });
        if (!user) {
            return res.json({ existingToken: false });
        }
        const result = await User.updateOne(
            { $set: { password: await bcrypt.hash(new_password, saltRounds) } }
        )
        res.status(200).json({ reset_password_success: true, user: result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred during check-id.' });
    }
})

router.post('/subscribe', (req, res) => {
    res.send("join");
});

module.exports = router