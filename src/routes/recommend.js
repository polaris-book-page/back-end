const express = require('express') 
const router = express.Router()

router.get('/explore', (req, res) => {
    res.send("explore");
});

router.get('/line', (req, res) => {
    res.send("line");
});

router.get('/line/:num', (req, res) => {
    res.send("line/:num");
});

module.exports = router