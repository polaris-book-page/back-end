const express = require('express') 
const router = express.Router()

router.get('/', (req, res) => {
    res.send("mypage");
});

router.put('/modify', (req, res) => {
    res.send("modify");
});

router.get('/universe', (req, res) => {
    res.send("universe");
});

router.get('/calendar', (req, res) => {
    res.send("calendar");
});

router.post('/star-review', (req, res) => {
    res.send("star-review");
});

router.post('/star-review/detail', (req, res) => {
    res.send("star-review/detail");
});

router.put('/review/modify', (req, res) => {
    res.send("review/modify");
});

router.delete('/review/delete', (req, res) => {
    res.send("review/delete");
});

router.post('/like', (req, res) => {
    res.send("like");
});

router.delete('/unlike', (req, res) => {
    res.send("unlike");
});

module.exports = router