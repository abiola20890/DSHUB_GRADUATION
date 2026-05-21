import * as internService from '../services/intern.service.js';
import { sendOk, sendCreated, sendNoContent } from '../utils/response.js';

export const getAllInterns = async (req, res, next) => {
  try {
    const { interns, pagination } = await internService.listInterns(req.query);
    return sendOk(res, 'Interns fetched successfully.', { interns }, pagination);
  } catch (err) { next(err); }
};

export const getInternsByTrack = async (req, res, next) => {
  try {
    const { interns, pagination } = await internService.listInternsByTrack(req.params.track, req.query);
    return sendOk(res, `Interns for track '${req.params.track}' fetched.`, { interns }, pagination);
  } catch (err) { next(err); }
};

export const getInternById = async (req, res, next) => {
  try {
    const intern = await internService.getInternById(req.params.id, req.user?.role);
    return sendOk(res, 'Intern profile retrieved.', { intern });
  } catch (err) { next(err); }
};

export const createIntern = async (req, res, next) => {
  try {
    const intern = await internService.createIntern(req.body);
    return sendCreated(res, 'Intern profile created successfully.', { intern });
  } catch (err) { next(err); }
};

/**
 * Route middleware — fetches intern and sets res.locals for isSelfOrAdmin.
 */
export const setOwner = async (req, res, next) => {
  try {
    const { intern, ownerId } = await internService.getInternOwner(req.params.id);
    res.locals.resourceOwnerId = ownerId;
    res.locals.intern          = intern;
    next();
  } catch (err) { next(err); }
};

export const updateIntern = async (req, res, next) => {
  try {
    const intern = await internService.updateIntern({
      intern: res.locals.intern,
      body:   req.body,
      role:   req.user.role,
    });
    return sendOk(res, 'Intern profile updated successfully.', { intern });
  } catch (err) { next(err); }
};

export const deleteIntern = async (req, res, next) => {
  try {
    const { hardDeleted } = await internService.deleteIntern({
      id:          req.params.id,
      forceDelete: req.query.forceDelete === 'true',
    });

    if (hardDeleted) return sendNoContent(res);
    return sendOk(res, 'Intern profile hidden. Use ?forceDelete=true to permanently delete.');
  } catch (err) { next(err); }
};