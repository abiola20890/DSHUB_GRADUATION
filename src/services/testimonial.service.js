import Testimonial from '../models/testimonial.model.js';
import { parsePagination, buildFilter, pickFields } from '../utils/helpers.js';
import { buildPagination } from '../utils/response.js';
import { AppError } from '../middlewares/errorHandler.js';

const AUTHOR_POPULATE_FIELDS = 'fullName role avatar';
const ALLOWED_FILTER_KEYS    = ['track', 'rating'];
const ALLOWED_CREATE_FIELDS  = ['content', 'track', 'rating'];


export const listTestimonials = async (query, role) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildFilter(query, ALLOWED_FILTER_KEYS);

  if (role !== 'admin') {
    filter.isApproved = true;
  }

  const [testimonials, totalCount] = await Promise.all([
    Testimonial.find(filter)
      .populate('author', AUTHOR_POPULATE_FIELDS)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Testimonial.countDocuments(filter),
  ]);

  return { testimonials, pagination: buildPagination(page, limit, totalCount) };
};


export const submitTestimonial = async ({ userId, body }) => {
  const existing = await Testimonial.findOne({ author: userId });
  if (existing) {
    throw new AppError('You have already submitted a testimonial.', 409);
  }

  const data = pickFields(body, ALLOWED_CREATE_FIELDS);
  const testimonial = await Testimonial.create({ ...data, author: userId });
  await testimonial.populate('author', AUTHOR_POPULATE_FIELDS);

  return testimonial;
};


export const approveTestimonial = async (id) => {
  const testimonial = await Testimonial.findById(id);
  if (!testimonial) throw new AppError('Testimonial not found.', 404);
  if (testimonial.isApproved) throw new AppError('Testimonial is already approved.', 409);

  testimonial.isApproved = true;
  await testimonial.save({ validateBeforeSave: false });
  await testimonial.populate('author', AUTHOR_POPULATE_FIELDS);

  return testimonial;
};


export const toggleFeatured = async (id) => {
  const testimonial = await Testimonial.findById(id);
  if (!testimonial) throw new AppError('Testimonial not found.', 404);

  if (!testimonial.isApproved) {
    throw new AppError('Testimonial must be approved before it can be featured.', 422);
  }

  testimonial.isFeatured = !testimonial.isFeatured;
  await testimonial.save({ validateBeforeSave: false });
  await testimonial.populate('author', AUTHOR_POPULATE_FIELDS);

  return testimonial;
};


export const deleteTestimonial = async (id) => {
  const testimonial = await Testimonial.findById(id);
  if (!testimonial) throw new AppError('Testimonial not found.', 404);
  await testimonial.deleteOne();
};