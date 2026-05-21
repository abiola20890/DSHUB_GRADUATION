import * as analyticsService from '../services/analytics.service.js';
import { sendOk } from '../utils/response.js';

export const getDashboard = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getDashboard(req.user._id);
    return sendOk(res, 'Dashboard analytics retrieved.', { analytics });
  } catch (err) { next(err); }
};

export const getCohortOverview = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getCohortOverview();
    return sendOk(res, 'Cohort overview retrieved.', { analytics });
  } catch (err) { next(err); }
};

export const getTrackBreakdown = async (req, res, next) => {
  try {
    const byTrack = await analyticsService.getTrackBreakdown();
    return sendOk(res, 'Track breakdown retrieved.', { byTrack });
  } catch (err) { next(err); }
};

export const getSubmissionMetrics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getSubmissionMetrics();
    return sendOk(res, 'Submission metrics retrieved.', { analytics });
  } catch (err) { next(err); }
};

export const regenerateAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.generateSnapshot(req.user._id);
    return sendOk(res, 'Analytics snapshot regenerated successfully.', { analytics });
  } catch (err) { next(err); }
};