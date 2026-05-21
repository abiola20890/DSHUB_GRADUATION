import fs from 'fs/promises';
import Media from '../models/media.model.js';
import {
  deleteFromStorage,
  uploadToCloudinary,
  getMediaTypeFromMime,
} from '../utils/storage.helper.js';
import { parsePagination, buildFilter, pickFields } from '../utils/helpers.js';
import { buildPagination } from '../utils/response.js';
import { AppError } from '../middlewares/errorHandler.js';

const ALLOWED_FILTER_KEYS   = ['type', 'category', 'isPublic', 'isFeatured'];
const ALLOWED_UPDATE_FIELDS = ['title', 'description', 'category', 'isPublic', 'isFeatured', 'altText'];
const POPULATE_FIELDS       = 'fullName avatar';


export const listMedia = async (query, role) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildFilter(query, ALLOWED_FILTER_KEYS);

  if (role !== 'admin') filter.isPublic = true;

  const [media, totalCount] = await Promise.all([
    Media.find(filter)
      .populate('uploadedBy', POPULATE_FIELDS)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Media.countDocuments(filter),
  ]);

  return { media, pagination: buildPagination(page, limit, totalCount) };
};


export const getMediaById = async (id, role) => {
  const media = await Media.findById(id).populate('uploadedBy', POPULATE_FIELDS);
  if (!media) throw new AppError('Media not found.', 404);

  if (!media.isPublic && role !== 'admin') {
    throw new AppError('This media is not publicly available.', 403);
  }

  return media;
};


export const uploadMedia = async ({ file, body, userId }) => {
  try {
    if (!file) {
      throw new AppError(
        'No file uploaded. Please attach a file with field name "file".',
        400
      );
    }

    const { title, description, category, altText, isPublic, isFeatured } = body;

    const { url, publicId } = await uploadToCloudinary(file);

    const media = await Media.create({
      title,
      description: description || '',
      url,
      publicId,
      mimeType: file.mimetype,
      fileSize: file.size,
      type: getMediaTypeFromMime(file.mimetype),
      category,
      altText: altText || '',
      isPublic: isPublic !== undefined ? isPublic === 'true' : true,
      isFeatured: isFeatured === 'true',
      storageProvider: 'cloudinary',
      uploadedBy: userId,
    });

    await media.populate('uploadedBy', POPULATE_FIELDS);

    return media;

  } catch (error) {
    console.log('UPLOAD ERROR:', error);
    throw error;
  }
};

export const updateMedia = async ({ id, body }) => {
  const media = await Media.findById(id);
  if (!media) throw new AppError('Media not found.', 404);

  Object.assign(media, pickFields(body, ALLOWED_UPDATE_FIELDS));
  await media.save();
  await media.populate('uploadedBy', POPULATE_FIELDS);

  return media;
};


export const deleteMedia = async (id) => {
  const media = await Media.findById(id);
  if (!media) throw new AppError('Media not found.', 404);

  await deleteFromStorage(media);
  await media.deleteOne();
};