const express = require('express') 
const router = express.Router()

router.get('/most-read', (req, res) => {
    res.send("most-read");
});

router.post('/add-book', (req, res) => {
    res.send("add-book");
});

router.post('/add-review', (req, res) => {
    res.send("add-review");
});

router.get('/info', (req, res) => {
    res.send("info");
});

router.get('/info/rewiew', (req, res) => {
    res.send("info/rewiew");
});


module.exports = router