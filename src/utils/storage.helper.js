import fs          from 'fs/promises';
import path        from 'path';
import cloudinary from '../config/cloudinary.js';


const deleteFromLocal = async (publicId) => {
  const filePath = path.join(process.cwd(), 'uploads', publicId);

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[Storage] Local file already missing: ${filePath}`);
    } else {
      console.warn(`[Storage] Could not delete local file: ${filePath} —`, err.message);
    }
  }
};


export const uploadToCloudinary = (file) => {
  const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
  const folder = `dshub-graduation/${resourceType}s`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        upload_preset: "dshub_upload"
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
  
    uploadStream.end(file.buffer);
    console.log("FILE:", file);
    console.log("BUFFER EXISTS:", !!file?.buffer);
  });
};


const deleteFromCloudinary = async (publicId, type) => {
  const resourceType = type === 'video' ? 'video' : 'image';

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== 'ok') {
      console.warn('Delete failed:', result.result);
    }
  } catch (err) {
    console.warn('Cloudinary delete error:', err.message);
  }
};


export const deleteFromStorage = async (media) => {
  const { storageProvider, publicId, type } = media;

  switch (storageProvider) {
    case 'local':
      await deleteFromLocal(publicId);
      break;
    case 'cloudinary':
      await deleteFromCloudinary(publicId, type);
      break;
    default:
      console.warn(`[Storage] Unknown provider: ${storageProvider}. File not deleted.`);
  }
};

export const buildLocalFileUrl = (filename) => {
  const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 9000}`;
  return `${base}/uploads/${filename}`;
};

export const getMediaTypeFromMime = (mimeType) => {
  return mimeType.startsWith('video/') ? 'video' : 'image';
};