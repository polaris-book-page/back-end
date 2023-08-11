const express = require("express");
const router = express.Router();
const upload = require("../aws-storage.js");
const { Book } = require("../models/model");

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
      join_success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", err });
  }
});

router.post("/add-review", (req, res) => {
  res.send("add-review");
});

router.get("/info", (req, res) => {
  res.send("info");
});

router.get("/info/rewiew", (req, res) => {
  res.send("info/rewiew");
});

module.exports = router;
