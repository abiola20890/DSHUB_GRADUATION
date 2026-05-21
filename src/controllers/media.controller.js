import * as mediaService from '../services/media.service.js';
import { sendOk, sendCreated, sendNoContent } from '../utils/response.js';

export const getAllMedia = async (req, res, next) => {
  try {
    const { media, pagination } = await mediaService.listMedia(req.query, req.user?.role);
    return sendOk(res, 'Media fetched successfully.', { media }, pagination);
  } catch (err) { next(err); }
};

export const getMediaById = async (req, res, next) => {
  try {
    const media = await mediaService.getMediaById(req.params.id, req.user?.role);
    return sendOk(res, 'Media retrieved.', { media });
  } catch (err) { next(err); }
};

export const uploadMedia = async (req, res, next) => {
  try {
    const media = await mediaService.uploadMedia({
      file:   req.file,
      body:   req.body,
      userId: req.user._id,
    });
    return sendCreated(res, 'Media uploaded successfully.', { media });
  } catch (err) { next(err); }
};

export const updateMedia = async (req, res, next) => {
  try {
    const media = await mediaService.updateMedia({ id: req.params.id, body: req.body });
    return sendOk(res, 'Media updated successfully.', { media });
  } catch (err) { next(err); }
};

export const deleteMedia = async (req, res, next) => {
  try {
    await mediaService.deleteMedia(req.params.id);
    return sendNoContent(res);
  } catch (err) { next(err); }
};