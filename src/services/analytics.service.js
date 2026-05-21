import Analytics from '../models/analytics.model.js';
import Intern from '../models/intern.model.js';
import Testimonial from '../models/testimonial.model.js';
import { INTERN_TRACKS } from '../models/intern.model.js';
import { AppError } from '../middlewares/errorHandler.js';

const COHORT               = process.env.CURRENT_COHORT || 'Cohort A 2026';
const STALE_THRESHOLD      = parseInt(process.env.ANALYTICS_STALE_MINUTES, 10) || 60;
const TOP_PERFORMERS_LIMIT = 10;


export const generateSnapshot = async (generatedById) => {
  // ── Cohort-wide totals ───────────────────────────────────────────────────
  const [cohortStats] = await Intern.aggregate([
    { $match: { cohort: COHORT } },
    {
      $group: {
        _id:              null,
        totalInterns:     { $sum: 1 },
        totalGraduating:  { $sum: { $cond: ['$isGraduating', 1, 0] } },
        totalSubmissions: { $sum: '$weeklySubmissions' },
        avgGradScore:     { $avg: '$gradScore' },
      },
    },
  ]);

  const totalInterns     = cohortStats?.totalInterns     ?? 0;
  const totalGraduating  = cohortStats?.totalGraduating  ?? 0;
  const totalSubmissions = cohortStats?.totalSubmissions ?? 0;
  const avgGradScore     = parseFloat((cohortStats?.avgGradScore ?? 0).toFixed(2));
  const completionRate   = totalInterns > 0
    ? parseFloat(((totalGraduating / totalInterns) * 100).toFixed(2))
    : 0;

  // ── Per-track breakdown ──────────────────────────────────────────────────
  const trackAggregation = await Intern.aggregate([
    { $match: { cohort: COHORT } },
    {
      $group: {
        _id:              '$track',
        totalInterns:     { $sum: 1 },
        graduating:       { $sum: { $cond: ['$isGraduating', 1, 0] } },
        totalSubmissions: { $sum: '$weeklySubmissions' },
        avgGradScore:     { $avg: '$gradScore' },
      },
    },
  ]);

  const byTrack = new Map();
  INTERN_TRACKS.forEach((track) => {
    const data = trackAggregation.find((t) => t._id === track);
    byTrack.set(track, {
      totalInterns:     data?.totalInterns     ?? 0,
      graduating:       data?.graduating       ?? 0,
      totalSubmissions: data?.totalSubmissions ?? 0,
      avgGradScore:     parseFloat((data?.avgGradScore ?? 0).toFixed(2)),
      completionRate:   data?.totalInterns > 0
        ? parseFloat(((data.graduating / data.totalInterns) * 100).toFixed(2))
        : 0,
    });
  });

  // ── Weekly activity ──────────────────────────────────────────────────────
  const weeklyActivity = Array.from({ length: 9 }, (_, i) => ({
    week:           i + 1,
    submissions:    Math.round(totalSubmissions / 9),
    activeInterns:  totalInterns,
    completionRate,
  }));

  // ── Top performers ───────────────────────────────────────────────────────
  const topPerformerDocs = await Intern.find({ cohort: COHORT, isVisible: true })
    .sort('-gradScore')
    .limit(TOP_PERFORMERS_LIMIT)
    .populate('user', 'fullName avatar')
    .lean();

  const topPerformers = topPerformerDocs.map((intern) => ({
    intern:       intern._id,
    fullName:     intern.user?.fullName ?? 'Unknown',
    track:        intern.track,
    gradScore:    intern.gradScore,
    profileImage: intern.profileImage || intern.user?.avatar || '',
  }));

  // ── Testimonial stats ────────────────────────────────────────────────────
  const [testimonialStats] = await Testimonial.aggregate([
    {
      $group: {
        _id:                  null,
        totalTestimonials:    { $sum: 1 },
        approvedTestimonials: { $sum: { $cond: ['$isApproved', 1, 0] } },
      },
    },
  ]);

  // ── Upsert ───────────────────────────────────────────────────────────────
  return Analytics.findOneAndUpdate(
    { cohort: COHORT },
    {
      $set: {
        totalInterns,
        totalGraduating,
        completionRate,
        avgGradScore,
        totalSubmissions,
        totalTestimonials:    testimonialStats?.totalTestimonials    ?? 0,
        approvedTestimonials: testimonialStats?.approvedTestimonials ?? 0,
        byTrack,
        weeklyActivity,
        topPerformers,
        generatedAt:  new Date(),
        generatedBy:  generatedById || null,
      },
    },
    { upsert: true, new: true }
  );
};

export const getDashboard = async (adminId) => {
  let snapshot = await Analytics.findByCohort(COHORT);

  if (!snapshot || snapshot.isStale(STALE_THRESHOLD)) {
    snapshot = await generateSnapshot(adminId);
  }

  return snapshot;
};


export const getCohortOverview = async () => {
  const snapshot = await Analytics.findByCohort(COHORT);
  if (!snapshot) throw new AppError('Analytics data is not yet available.', 404);

  return {
    cohort:           snapshot.cohort,
    totalInterns:     snapshot.totalInterns,
    totalGraduating:  snapshot.totalGraduating,
    completionRate:   snapshot.completionRate,
    avgGradScore:     snapshot.avgGradScore,
    topPerformers:    snapshot.topPerformers,
    graduationRate:   snapshot.graduationRate,
    lastUpdatedLabel: snapshot.lastUpdatedLabel,
  };
};


export const getTrackBreakdown = async () => {
  const snapshot = await Analytics.findByCohort(COHORT);
  if (!snapshot) throw new AppError('Analytics data is not yet available.', 404);

  return Object.fromEntries(snapshot.byTrack);
};


export const getSubmissionMetrics = async () => {
  const snapshot = await Analytics.findByCohort(COHORT);
  if (!snapshot) throw new AppError('Analytics data is not yet available.', 404);

  return {
    totalSubmissions: snapshot.totalSubmissions,
    weeklyActivity:   snapshot.weeklyActivity,
    lastUpdatedLabel: snapshot.lastUpdatedLabel,
  };
};