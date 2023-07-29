const express = require('express') 
const app = express()
const router = express.Router()
const cookieParser = require('cookie-parser')
const session = require('express-session')
const { User } = require('../models/model') 
const mongoose = require('mongoose')
const config = require('../../config/key');
const session_key = require('../../config/session_key');
const MongoStore = require("connect-mongo");
const bcrypt = require('bcrypt')
const saltRounds = 10

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
    const { userId } = req.body;

    try {
        const result = await User.findOne({ userId });

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

router.get('/check', (req, res, next) => {
    if(req.session.is_logined){
        return res.json({message: 'user 있다', session: req.session.is_logined });
    }else{
        return res.json({message: 'user 없음', session: req.session.is_logined});
    }
});

router.get("/logout", function(req, res, next){
    req.session.destroy();
    res.clearCookie('sid')
    res.send('logout')
})

router.post('/subscribe', (req, res) => {
    res.send("join");
});





module.exports = router