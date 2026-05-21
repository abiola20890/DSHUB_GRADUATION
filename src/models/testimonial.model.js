import mongoose from 'mongoose';
import { INTERN_TRACKS } from './intern.model.js';

const testimonialSchema = new mongoose.Schema(
  {
   
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },

   
    content: {
      type: String,
      required: [true, 'Testimonial content is required'],
      trim: true,
      minlength: [10, 'Testimonial must be at least 10 characters'],
      maxlength: [500, 'Testimonial cannot exceed 500 characters'],
    },

   
    track: {
      type: String,
      enum: {
        values: [...INTERN_TRACKS, null],
        message: '{VALUE} is not a valid track',
      },
      default: null,
    },

 
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

   
    isApproved: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
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


testimonialSchema.index({ isApproved: 1, isFeatured: 1 });


testimonialSchema.index({ author: 1 });


testimonialSchema.index({ track: 1 }, { sparse: true });

testimonialSchema.virtual('moderationStatus').get(function () {
  if (this.isApproved && this.isFeatured) return 'featured';
  if (this.isApproved) return 'approved';
  return 'pending';
});


const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;