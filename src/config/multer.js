import multer from 'multer';
import { ALLOWED_MIME_TYPES } from '../models/media.model.js';
import { AppError } from '../middlewares/errorHandler.js';


const storage = multer.memoryStorage();


const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type '${file.mimetype}' is not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400
      ),
      false
    );
  }
};


const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 10 * 1024 * 1024;


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files:    1,
  },
});

export default upload;