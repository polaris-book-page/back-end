const express = require('express') 
const app = express()
const router = express.Router()
const cookieParser = require('cookie-parser')
const session = require('express-session')
const { User } = require('../models/model') 
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const saltRounds = 10

app.use(cookieParser())
app.use(session({
    secret: '1242',
    resave: false,
    saveUninitialized: true
}))

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

router.post('/login', (req, res) => {
    res.send("login");
});

router.post('/subscribe', (req, res) => {
    res.send("join");
});





module.exports = router