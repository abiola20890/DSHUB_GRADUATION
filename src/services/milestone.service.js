import Milestone from '../models/milestone.model.js';
import { parsePagination, buildFilter, pickFields } from '../utils/helpers.js';
import { buildPagination } from '../utils/response.js';
import { AppError } from '../middlewares/errorHandler.js';

const ALLOWED_FILTER_KEYS = ['week', 'track', 'type', 'isHighlight'];
const ALLOWED_WRITE_FIELDS = [
  'title', 'description', 'week', 'date',
  'track', 'type', 'icon', 'isHighlight',
];


export const listMilestones = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildFilter(query, ALLOWED_FILTER_KEYS);

  const [milestones, totalCount] = await Promise.all([
    Milestone.find(filter)
      .sort({ week: 1, date: 1 })
      .skip(skip)
      .limit(limit),
    Milestone.countDocuments(filter),
  ]);

  return { milestones, pagination: buildPagination(page, limit, totalCount) };
};

export const getMilestoneById = async (id) => {
  const milestone = await Milestone.findById(id);
  if (!milestone) throw new AppError('Milestone not found.', 404);
  return milestone;
};


export const createMilestone = async (body) => {
  return Milestone.create(pickFields(body, ALLOWED_WRITE_FIELDS));
};


export const updateMilestone = async ({ id, body }) => {
  const milestone = await Milestone.findById(id);
  if (!milestone) throw new AppError('Milestone not found.', 404);

  Object.assign(milestone, pickFields(body, ALLOWED_WRITE_FIELDS));
  await milestone.save();

  return milestone;
};


export const deleteMilestone = async (id) => {
  const milestone = await Milestone.findById(id);
  if (!milestone) throw new AppError('Milestone not found.', 404);
  await milestone.deleteOne();
};