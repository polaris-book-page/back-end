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
            return res.status(200).json({ isAvailable: true });
        }
    } catch (err) {
        console.error('Error in /id-check', err);
        res.status(500).json({ idCheckerror: 'An error occurred while checking the id.', err });
    }
});

router.get('/join/nickname-check', async(req, res) => {
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
        return res.status(200).json({ 
            loginSuccess: true, 
            session: req.session 
        });
    } catch (err) {
        console.error('Error in /login', err);
        return res.status(500).json({ logoutError: 'An error occurred during login.', err });
    }
});

router.get("/logout", function(req, res, next){
    try {
        req.session.destroy();
        res.clearCookie('sid');
        return res.status(200).json({ logoutSuccess: true });
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
            'auth.created': { $gt: Date.now() - 10 * 1000 } 
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

router.post('/subscribe', (req, res) => {
    res.send("join");
});

module.exports = router