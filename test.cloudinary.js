import cloudinary from './src/config/cloudinary.js';

cloudinary.api.ping()
  .then(res => console.log('CLOUDINARY OK:', res))
  .catch(err => console.log('CLOUDINARY ERROR:', err));