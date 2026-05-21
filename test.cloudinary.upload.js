import fs from 'fs';
import cloudinary from './src/config/cloudinary.js';

const buffer = fs.readFileSync('./pic.jpg');

const stream = cloudinary.uploader.upload_stream(
  { folder: "test_folder" },
  (error, result) => {
    console.log("ERROR:", error);
    console.log("RESULT:", result);
  }
);

stream.end(buffer);