const fs = require("fs");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const config = require("../config/key");

dotenv.config();

// connect bucket
const s3 = new AWS.S3({
  accessKeyId: config.ACCESS_KEY,
  secretAccessKey: config.SECRET_KEY,
});

// essential params
const params = {
  Bucket: "polaris-book",
  Key: "/image",
  Body: fs.readFileSync("img.jpg"),
  ContentType: "image/png",
};

// upload
s3.upload(params, function (err, data) {
  if (err) {
    throw err;
  }
  console.log(`file uploaded successfully.' ${data}`);
});
