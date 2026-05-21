import mongoose from 'mongoose';
import { INTERN_TRACKS } from './intern.model.js';

const trackStatsSchema = new mongoose.Schema(
  {
    totalInterns:     { type: Number, default: 0, min: 0 },
    graduating:       { type: Number, default: 0, min: 0 },
    completionRate:   { type: Number, default: 0, min: 0, max: 100 },
    avgGradScore:     { type: Number, default: 0, min: 0, max: 100 },
    totalSubmissions: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const weeklyActivitySchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
    },
    submissions:    { type: Number, default: 0, min: 0 },
    activeInterns:  { type: Number, default: 0, min: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const topPerformerSchema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: true,
    },
    fullName:  { type: String, required: true, trim: true },
    track:     { type: String, enum: INTERN_TRACKS, required: true },
    gradScore: { type: Number, required: true, min: 0, max: 100 },
    profileImage: { type: String, default: '' },
  },
  { _id: false }
);


const analyticsSchema = new mongoose.Schema(
  {

    cohort: {
      type: String,
      required: [true, 'Cohort is required'],
      trim: true,
      maxlength: [50, 'Cohort name cannot exceed 50 characters'],
    },

    totalInterns: {
      type: Number,
      default: 0,
      min: [0, 'Total interns cannot be negative'],
    },

    totalGraduating: {
      type: Number,
      default: 0,
      min: [0, 'Total graduating cannot be negative'],
    },

    completionRate: {
      type: Number,
      default: 0,
      min: [0, 'Completion rate cannot be negative'],
      max: [100, 'Completion rate cannot exceed 100'],
    },

    avgGradScore: {
      type: Number,
      default: 0,
      min: [0, 'Average grad score cannot be negative'],
      max: [100, 'Average grad score cannot exceed 100'],
    },

    totalSubmissions: {
      type: Number,
      default: 0,
      min: [0, 'Total submissions cannot be negative'],
    },

    totalTestimonials: {
      type: Number,
      default: 0,
      min: 0,
    },

    approvedTestimonials: {
      type: Number,
      default: 0,
      min: 0,
    },

    byTrack: {
      type: Map,
      of: trackStatsSchema,
      default: () => {
        const map = new Map();
        INTERN_TRACKS.forEach(track => {
          map.set(track, {
            totalInterns: 0,
            graduating: 0,
            completionRate: 0,
            avgGradScore: 0,
            totalSubmissions: 0,
          });
        });
        return map;
      },
    },

   
    weeklyActivity: {
      type: [weeklyActivitySchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 9,
        message: 'Weekly activity cannot exceed 9 weeks',
      },
    },


    topPerformers: {
      type: [topPerformerSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Top performers list cannot exceed 10 entries',
      },
    },


    generatedAt: {
      type: Date,
      default: Date.now,
    },


    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);


analyticsSchema.index({ cohort: 1 }, { unique: true });
analyticsSchema.index({ generatedAt: -1 });


analyticsSchema.virtual('lastUpdatedLabel').get(function () {
  if (!this.generatedAt) return 'Never';
  const diffMs = Date.now() - this.generatedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
});


analyticsSchema.virtual('graduationRate').get(function () {
  if (!this.totalInterns) return '0%';
  return `${((this.totalGraduating / this.totalInterns) * 100).toFixed(1)}%`;
});


analyticsSchema.virtual('testimonialApprovalRate').get(function () {
  if (!this.totalTestimonials) return '0%';
  return `${((this.approvedTestimonials / this.totalTestimonials) * 100).toFixed(1)}%`;
});

analyticsSchema.statics.findByCohort = function (cohort) {
  return this.findOne({ cohort }).populate('generatedBy', 'fullName email');
};

analyticsSchema.methods.isStale = function (maxAgeMinutes = 60) {
  if (!this.generatedAt) return true;
  const ageMs = Date.now() - this.generatedAt.getTime();
  return ageMs > maxAgeMinutes * 60 * 1000;
};


const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;