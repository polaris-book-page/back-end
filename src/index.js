const express = require('express') 
const app = express()
const router = express.Router()
const mongoose = require('mongoose')
const config = require('../config/key');
const port = 3001
const bodyParser = require('body-parser');
const { Subscribe } = require('./models/subscribe') 
const { User } = require('./models/model') 
const { Like } = require('./models/model') 
const { Review } = require('./models/model') 
const { Book } = require('./models/model') 
const { Quote } = require('./models/model')
const userRouter = require('./routes/user')
const cookieParser = require('cookie-parser')
const bookRouter = require("./routes/book");
const mypageRouter = require('./routes/mypage')
const searchRouter = require('./routes/search')
const session_key = require('../config/session_key');
const session = require('express-session')
const MongoStore = require('connect-mongo');
const cors = require('cors')

const corsOptions = {
    origin: 'https://polaris-book.vercel.app/',
    credentials: true,
};
app.use(cors(corsOptions));

app.use(
    session({
        httpOnly: true,
        secure: true,
        secret: session_key.secret_key,
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            maxAge: 3.6e6 * 24, // 24시간 유효
        },
        store: MongoStore.create({
            mongoUrl: config.mongoURI
        })
    })
)
app.use(cookieParser())

mongoose
    .connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected ..."))
    .catch((err) => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/api", (req, res) => res.send("Hello World!"));

// join
app.use("/api/user", userRouter);
app.use("/api/book", bookRouter);
app.use("/api/mypage", mypageRouter);
app.use("/api/search", searchRouter);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
