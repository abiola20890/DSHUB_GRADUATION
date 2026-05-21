import mongoose from 'mongoose';

export const MEDIA_TYPES = Object.freeze(['image', 'video']);

export const MEDIA_CATEGORIES = Object.freeze([
  'ceremony',
  'project',
  'team',
  'individual',
]);

export const STORAGE_PROVIDERS = Object.freeze(['local', 'cloudinary', 's3']);


export const ALLOWED_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
]);


const mediaSchema = new mongoose.Schema(
  {
    
    title: {
      type: String,
      required: [true, 'Media title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    
    url: {
      type: String,
      required: [true, 'Media URL is required'],
      trim: true,
      match: [
        /^https?:\/\/([\w-]+(\.[\w-]+)+)(:\d+)?(\/[\w/_.-]*(\?\S*)?)?$/,
        'Please provide a valid URL (must include http:// or https://)',
      ],
    },

   
    publicId: {
      type: String,
      default: '',
      trim: true,
    },

  
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: ALLOWED_MIME_TYPES,
        message: '{VALUE} is not an allowed MIME type',
      },
    },

   
    fileSize: {
      type: Number,
      default: 0,
      min: [0, 'File size cannot be negative'],
    },

    type: {
      type: String,
      enum: {
        values: MEDIA_TYPES,
        message: '{VALUE} is not a valid media type',
      },
      required: [true, 'Media type is required'],
    },

    category: {
      type: String,
      enum: {
        values: MEDIA_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },

    storageProvider: {
      type: String,
      enum: {
        values: STORAGE_PROVIDERS,
        message: '{VALUE} is not a valid storage provider',
      },
      default: 'local',
    },

    
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    width: {
      type: Number,
      default: null,
    },

    height: {
      type: Number,
      default: null,
    },

   
    duration: {
      type: Number,
      default: null,
      min: [0, 'Duration cannot be negative'],
    },

 
    altText: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Alt text cannot exceed 200 characters'],
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


mediaSchema.index({ isPublic: 1, type: 1, category: 1 });
mediaSchema.index({ isPublic: 1, isFeatured: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.virtual('fileSizeFormatted').get(function () {
  if (!this.fileSize) return null;
  if (this.fileSize < 1024) return `${this.fileSize} B`;
  if (this.fileSize < 1024 * 1024) return `${(this.fileSize / 1024).toFixed(1)} KB`;
  return `${(this.fileSize / (1024 * 1024)).toFixed(2)} MB`;
});

mediaSchema.virtual('aspectRatio').get(function () {
  if (!this.width || !this.height) return null;
  return parseFloat((this.width / this.height).toFixed(2));
});

mediaSchema.virtual('durationFormatted').get(function () {
  if (this.type !== 'video' || !this.duration) return null;
  const mins = Math.floor(this.duration / 60);
  const secs = String(Math.floor(this.duration % 60)).padStart(2, '0');
  return `${mins}:${secs}`;
});



const Media = mongoose.model('Media', mediaSchema);

export default Media;