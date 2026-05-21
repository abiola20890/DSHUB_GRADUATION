
import Intern from '../models/intern.model.js';
import User from '../models/user.model.js';
import { parsePagination, parseSort, buildFilter, stripAdminFields, pickFields } from '../utils/helpers.js';
import { buildPagination } from '../utils/response.js';
import { AppError } from '../middlewares/errorHandler.js';


const ALLOWED_SORT_FIELDS   = ['-gradScore', 'gradScore', '-createdAt', 'createdAt'];
const ALLOWED_FILTER_KEYS   = ['track', 'cohort', 'isGraduating'];
const ADMIN_ONLY_FIELDS     = ['gradScore', 'isGraduating', 'weeklySubmissions', 'isVisible'];
const USER_POPULATE_FIELDS  = 'fullName email avatar role';
const ALLOWED_UPDATE_FIELDS = [
  'bio', 'profileImage', 'githubUrl', 'linkedinUrl', 'portfolioUrl',
  'achievements', 'projects', 'testimonial',
  'gradScore', 'isGraduating', 'weeklySubmissions', 'isVisible', 'track', 'cohort',
];


export const listInterns = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const sort   = parseSort(query.sort, ALLOWED_SORT_FIELDS, '-gradScore');
  const filter = buildFilter(query, ALLOWED_FILTER_KEYS);
  filter.isVisible = true;

  const [interns, totalCount] = await Promise.all([
    Intern.find(filter)
      .populate('user', USER_POPULATE_FIELDS)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Intern.countDocuments(filter),
  ]);

  return { interns, pagination: buildPagination(page, limit, totalCount) };
};


export const listInternsByTrack = async (track, query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { track, isVisible: true };

  const [interns, totalCount] = await Promise.all([
    Intern.find(filter)
      .populate('user', USER_POPULATE_FIELDS)
      .sort('-gradScore')
      .skip(skip)
      .limit(limit)
      .lean(),
    Intern.countDocuments(filter),
  ]);

  return { interns, pagination: buildPagination(page, limit, totalCount) };
};


export const getInternById = async (id, role) => {
  const intern = await Intern.findById(id).populate('user', USER_POPULATE_FIELDS);

  if (!intern) throw new AppError('Intern profile not found.', 404);

  if (!intern.isVisible && role !== 'admin') {
    throw new AppError('This intern profile is not publicly visible.', 403);
  }

  return intern;
};


export const getInternOwner = async (internId) => {
  const intern = await Intern.findById(internId);
  if (!intern) throw new AppError('Intern profile not found.', 404);
  return { intern, ownerId: intern.user.toString() };
};


export const createIntern = async (data) => {
  const { user: userId } = data;

  const userExists = await User.findById(userId);
  if (!userExists) throw new AppError('No user found with the provided ID.', 404);

  const existing = await Intern.findOne({ user: userId });
  if (existing) throw new AppError('An intern profile already exists for this user.', 409);

  const picked = pickFields(data, [
    'user', 'track', 'cohort', 'bio', 'profileImage',
    'githubUrl', 'linkedinUrl', 'portfolioUrl',
    'achievements', 'projects', 'gradScore',
    'isGraduating', 'weeklySubmissions', 'isVisible',
  ]);

  const intern = await Intern.create(picked);
  await intern.populate('user', USER_POPULATE_FIELDS);

  return intern;
};


export const updateIntern = async ({ intern, body, role }) => {
  const picked  = pickFields(body, ALLOWED_UPDATE_FIELDS);
  const updates = stripAdminFields(picked, role, ADMIN_ONLY_FIELDS);

  delete updates.user; // never allow user reference to change

  Object.assign(intern, updates);
  await intern.save();
  await intern.populate('user', USER_POPULATE_FIELDS);

  return intern;
};


export const deleteIntern = async ({ id, forceDelete }) => {
  const intern = await Intern.findById(id);
  if (!intern) throw new AppError('Intern profile not found.', 404);

  if (forceDelete) {
    await intern.deleteOne();
    return { hardDeleted: true };
  }

  intern.isVisible = false;
  await intern.save({ validateBeforeSave: false });
  return { hardDeleted: false };
};