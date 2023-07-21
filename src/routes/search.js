const express = require('express') 
const router = express.Router()

router.get('/result', (req, res) => {
    res.send("result");
});

module.exports = router