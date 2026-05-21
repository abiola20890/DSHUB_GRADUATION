import mongoose from 'mongoose';
import { INTERN_TRACKS } from './intern.model.js';



export const MILESTONE_TYPES = Object.freeze([
  'technical',
  'collaboration',
  'achievement',
]);

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

   
    week: {
      type: Number,
      required: [true, 'Week number is required'],
      min: [1, 'Week must be at least 1'],
      max: [9, 'Week cannot exceed 9'],
    },

    date: {
      type: Date,
      required: [true, 'Milestone date is required'],
    },

  
    track: {
      type: String,
      enum: {
        values: [...INTERN_TRACKS, null],
        message: '{VALUE} is not a valid track',
      },
      default: null,
    },

    type: {
      type: String,
      enum: {
        values: MILESTONE_TYPES,
        message: '{VALUE} is not a valid milestone type',
      },
      required: [true, 'Milestone type is required'],
    },

 
    icon: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Icon value cannot exceed 100 characters'],
    },

    isHighlight: {
      type: Boolean,
      default: false,
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



milestoneSchema.index({ week: 1, track: 1 });
milestoneSchema.index({ track: 1 }, { sparse: true });
milestoneSchema.index({ isHighlight: 1 });


milestoneSchema.virtual('formattedDate').get(function () {
  if (!this.date) return null;
  return this.date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});


milestoneSchema.virtual('isUpcoming').get(function () {
  if (!this.date) return false;
  return this.date > new Date();
});


const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;