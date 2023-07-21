const express = require('express') 
const router = express.Router()

router.get('/', (req, res) => {
    res.send("mypage");
});

router.get('/modify', (req, res) => {
    res.send("modify");
});

router.get('/universe', (req, res) => {
    res.send("universe");
});

router.get('/calendar', (req, res) => {
    res.send("calendar");
});

router.get('/star-review', (req, res) => {
    res.send("star-review");
});

router.get('/star-review/detail', (req, res) => {
    res.send("star-review/detail");
});

router.get('/review/modify', (req, res) => {
    res.send("review/modify");
});

router.get('/review/delete', (req, res) => {
    res.send("review/delete");
});

router.get('/like', (req, res) => {
    res.send("like");
});

router.get('/unlike', (req, res) => {
    res.send("unlike");
});

module.exports = router