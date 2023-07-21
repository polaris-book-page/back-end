const express = require('express') 
const router = express.Router()

router.post('/join', (req, res) => {
    res.send("join");
});

router.post('/join/id-check', (req, res) => {
    res.send("/join/id-check");
});

router.post('/join/nickname-check', (req, res) => {
    res.send("/join/nickname-check");
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