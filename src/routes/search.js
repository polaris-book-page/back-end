const express = require('express') 
const router = express.Router()
const { Book } = require('../models/model');

router.post('/result/save', async (req, res) => {
    const { books } = req.body;
    
    try {
        const bookList = books.map(async book => {
            const alreadyHave13 = await Book.findOne({ isbn: book.isbn13.toString() })
            const alreadyHave = await Book.findOne({ isbn: book.isbn.toString() })
            const haveTranslator = book.author.indexOf('(옮긴이)')
            const catagory = book.categoryName.substring(book.categoryName.indexOf('>') + 1)
            if (catagory.indexOf('>', catagory.indexOf('>') + 1) !== -1) {
                lastIndex = catagory.indexOf('>', catagory.indexOf('>') + 1)
            } else {
                lastIndex = catagory.length
            }
            if (!(alreadyHave || alreadyHave13)) {
                const newBook = new Book({
                    isbn: book.isbn13 ? book.isbn13 : book.isbn,
                    title: book.title,
                    writer: book.author.substring(0, book.author.indexOf('(지은이)') - 1),
                    translator: haveTranslator != -1 
                    ? book.author.substring(book.author.indexOf(',') + 2, book.author.indexOf('(옮긴이)') - 1) 
                    : null,
                    publisher: book.publisher, 
                    //카테고리 > 분야
                    category: catagory.substring(0, catagory.indexOf('>')),
                    field: catagory.substring(catagory.indexOf('>') + 1, lastIndex), 
                    bookImage: book.cover
                })
                return await newBook.save()
            } 
        })
        const result = await Promise.all(bookList);
        res.status(200).json(result);
    } catch(err) {
        console.error('Error in save bookInfo', err);
        res.status(500).json({ saveBookInfo: false, err });
    }
});

module.exports = router