const fs = require("fs");
const { S3 } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const config = require("../config/key");

// connect bucket
const s3 = new S3({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: config.ACCESS_KEY,
    secretAccessKey: config.SECRET_KEY,
  },
});

// essential params
const storage = multerS3({
  s3: s3,
  bucket: config.BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    let dir = req.body.dir;
    cb(null, `${dir}/${Date.now()}_${file.originalname}`);
  },
});

// const params = {
//   Bucket: "polaris-book",
//   Key: "/image",
//   Body: fs.readFileSync("img.jpg"),
//   ContentType: "image/png",
// };

// upload
// s3.upload(params, function (err, data) {
//   if (err) {
//     throw err;
//   }
//   console.log(`file uploaded successfully.' ${data}`);
// });

const upload = multer({ storage: storage });

module.exports = upload;
