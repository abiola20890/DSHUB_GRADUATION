import * as milestoneService from '../services/milestone.service.js';
import { sendOk, sendCreated, sendNoContent } from '../utils/response.js';

export const getAllMilestones = async (req, res, next) => {
  try {
    const { milestones, pagination } = await milestoneService.listMilestones(req.query);
    return sendOk(res, 'Milestones fetched successfully.', { milestones }, pagination);
  } catch (err) { next(err); }
};

export const getMilestoneById = async (req, res, next) => {
  try {
    const milestone = await milestoneService.getMilestoneById(req.params.id);
    return sendOk(res, 'Milestone retrieved.', { milestone });
  } catch (err) { next(err); }
};

export const createMilestone = async (req, res, next) => {
  try {
    const milestone = await milestoneService.createMilestone(req.body);
    return sendCreated(res, 'Milestone created successfully.', { milestone });
  } catch (err) { next(err); }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const milestone = await milestoneService.updateMilestone({
      id:   req.params.id,
      body: req.body,
    });
    return sendOk(res, 'Milestone updated successfully.', { milestone });
  } catch (err) { next(err); }
};

export const deleteMilestone = async (req, res, next) => {
  try {
    await milestoneService.deleteMilestone(req.params.id);
    return sendNoContent(res);
  } catch (err) { next(err); }
};