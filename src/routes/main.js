const express = require('express') 
const router = express.Router()

router.get('/main', (req, res) => {
    res.send("main");
});

module.exports = router