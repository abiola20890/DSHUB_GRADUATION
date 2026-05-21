import * as testimonialService from '../services/testimonial.service.js';
import { sendOk, sendCreated, sendNoContent } from '../utils/response.js';

export const getAllTestimonials = async (req, res, next) => {
  try {
    const { testimonials, pagination } = await testimonialService.listTestimonials(
      req.query,
      req.user?.role
    );
    return sendOk(res, 'Testimonials fetched successfully.', { testimonials }, pagination);
  } catch (err) { next(err); }
};

export const submitTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.submitTestimonial({
      userId: req.user._id,
      body:   req.body,
    });
    return sendCreated(
      res,
      'Testimonial submitted. It will be visible after admin approval.',
      { testimonial }
    );
  } catch (err) { next(err); }
};

export const approveTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.approveTestimonial(req.params.id);
    return sendOk(res, 'Testimonial approved successfully.', { testimonial });
  } catch (err) { next(err); }
};

export const featureTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.toggleFeatured(req.params.id);
    const message = testimonial.isFeatured
      ? 'Testimonial is now featured.'
      : 'Testimonial has been unfeatured.';
    return sendOk(res, message, { testimonial });
  } catch (err) { next(err); }
};

export const deleteTestimonial = async (req, res, next) => {
  try {
    await testimonialService.deleteTestimonial(req.params.id);
    return sendNoContent(res);
  } catch (err) { next(err); }
};