import mongoose from 'mongoose';


export const INTERN_TRACKS = Object.freeze([
  'frontend',
  'backend',
  'cybersecurity',
  'data-science & analytics',
  'content-creation',
  'product-management',
  'digital-marketing',
  'artificial-intelligence & machine-learning',
]);


const REGEX = {
  // Requires http:// or https://. Allows paths, query strings, and ports.
  URL: /^https?:\/\/([\w-]+(\.[\w-]+)+)(:\d+)?(\/[\w/_.-]*(\?\S*)?)?$/,

  // GitHub personal/org profile URL only (not repo URLs — store those in projects).
  GITHUB: /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?$/,

  // LinkedIn profile or company page.
  LINKEDIN: /^https?:\/\/(www\.)?linkedin\.com\/.+$/,
};


const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Project description cannot exceed 500 characters'],
    },

  
    url: {
      type: String,
      default: '',
      trim: true,
      match: [REGEX.URL, 'Please provide a valid project URL (must include http:// or https://)'],
    },

    techStack: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Tech stack item cannot exceed 50 characters'],
      },
    ],
  },
  { _id: false }
);


const internSchema = new mongoose.Schema(
  {
  
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true, 
    },

    cohort: {
      type: String,
      default: 'Cohort A 2026',
      trim: true,
      maxlength: [50, 'Cohort name cannot exceed 50 characters'],
    },

    track: {
      type: String,
      enum: {
        values: INTERN_TRACKS,
        message: '{VALUE} is not a valid track',
      },
      required: [true, 'Track is required'],
    },

    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },


    profileImage: {
      type: String,
      default: '',
      trim: true,
    },

    githubUrl: {
      type: String,
      default: '',
      trim: true,
      match: [REGEX.GITHUB, 'Please provide a valid GitHub profile URL'],
    },

    linkedinUrl: {
      type: String,
      default: '',
      trim: true,
      match: [REGEX.LINKEDIN, 'Please provide a valid LinkedIn URL'],
    },

    portfolioUrl: {
      type: String,
      default: '',
      trim: true,
      match: [REGEX.URL, 'Please provide a valid portfolio URL (must include http:// or https://)'],
    },

 
    achievements: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [200, 'Achievement text cannot exceed 200 characters'],
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Cannot store more than 20 achievements',
      },
    },

    projects: {
      type: [projectSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Cannot store more than 10 projects',
      },
    },


    testimonial: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Testimonial cannot exceed 1000 characters'],
    },

    isGraduating: {
      type: Boolean,
      default: true,
    },


    weeklySubmissions: {
      type: Number,
      default: 0,
      min: [0, 'Weekly submissions cannot be negative'],
      max: [52, 'Weekly submissions cannot exceed 52'],
    },

    gradScore: {
      type: Number,
      default: 0,
      min: [0, 'Graduate score cannot be less than 0'],
      max: [100, 'Graduate score cannot exceed 100'],
    },


    isVisible: {
      type: Boolean,
      default: true,
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



// Leaderboard: visible interns sorted by score within a cohort
internSchema.index({ isVisible: 1, cohort: 1, gradScore: -1 });

// Track browse: visible interns filtered by track
internSchema.index({ isVisible: 1, track: 1 });

// Admin: all interns in a cohort regardless of visibility
internSchema.index({ cohort: 1, track: 1 });


internSchema.virtual('projectCount').get(function () {
  return this.projects.length;
});

internSchema.virtual('achievementCount').get(function () {
  return this.achievements.length;
});


internSchema.virtual('isProfileComplete').get(function () {
  return (
    Boolean(this.bio) &&
    Boolean(this.profileImage) &&
    Boolean(this.githubUrl) &&
    this.projects.length > 0
  );
});


internSchema.pre('save', function (next) {
  // Deduplicate and normalise techStack on each project
  this.projects.forEach((project) => {
    project.techStack = [...new Set(project.techStack.map((t) => t.trim()).filter(Boolean))];
  });

  // Normalise achievements
  this.achievements = [...new Set(this.achievements.map((a) => a.trim()).filter(Boolean))];

  next();
});


const Intern = mongoose.model('Intern', internSchema);

export default Intern;