const express = require("express");
const router = express.Router();
const upload = require("../aws-storage.js");
const { Book, Review } = require("../models/model");

router.get("/most-read", (req, res) => {
    res.send("most-read");
});

router.post("/add-book", upload.single("bookImage"), async (req, res) => {
    console.log("req:", req.file.location);
    try {
        const bookInfo = new Book({
            isbn: req.body.isbn,
            title: req.body.title,
            page: req.body.page,
            writer: req.body.writer,
            translator: req.body.translator,
            publisher: req.body.publisher,
            category: req.body.category,
            field: req.body.title,
            bookImage: req.file.location,
        });

        console.log(bookInfo);

        const result = await bookInfo.save();

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(500).json({ error: "fail to add book.", err });
    }
});

router.post("/add-review", async (req, res) => {
    try {
        const review = await Review.findOne({
            userId: req.body.userId,
            isbn: req.body.isbn,
        });
        if (review == null) {
            // new review
            const reviewInfo = new Review(req.body);
            const result = await reviewInfo.save();
            res.status(200).json({
                success: true,
                data: result,
            });
        } else {
            // exist review content
            const result = await Review.findOneAndUpdate(
                { userId: req.body.userId, isbn: req.body.isbn },
                {
                    $set: {
                        evaluation: req.body.evaluation,
                        content: req.body.content,
                        startDate: req.body.startDate,
                        endDate: req.body.endDate,
                        planetImage: req.body.planetImage,
                        type: req.body.type,
                        progressPage: req.body.progressPage,
                        progressPercent: req.body.progressPercent,
                    },
                }, {returnDocument: "after"}
            );
            res.status(200).json({
                success: true,
                data: result,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "fail to add review.", err });
    }
});

router.get("/info", (req, res) => {
    res.send("info");
});

router.get("/info/rewiew", (req, res) => {
    res.send("info/rewiew");
});

module.exports = router;
