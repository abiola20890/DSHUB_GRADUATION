import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';



export const USER_ROLES = Object.freeze(['intern', 'mentor', 'admin']);

const BCRYPT_DEFAULT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8; 
const RESET_TOKEN_EXPIRES_MS = 10 * 60 * 1000; 
const VERIFY_TOKEN_EXPIRES_MS = 24 * 60 * 60 * 1000; 


const userSchema = new mongoose.Schema(
  {
    

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],

      unique: true,
      lowercase: true,
      trim: true,
 
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },

   
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`],
      select: false,
    },

   
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },


    emailVerified: {
      type: Boolean,
      default: false,
    },

  
    emailVerificationToken: {
      type: String,
      select: false,
    },

    

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

  

    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid role',
      },
      default: 'intern',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    
    avatar: {
      type: String,
      default: '',
      trim: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
     
      transform(_doc, ret) {
        delete ret.password;
        delete ret.passwordChangedAt;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
    },
  }
);


userSchema.index({ role: 1, isActive: 1 });


userSchema.virtual('displayName').get(function () {
  const parts = this.fullName?.trim().split(' ') ?? [];
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
});


userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();

    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || BCRYPT_DEFAULT_ROUNDS;
    this.password = await bcrypt.hash(this.password, rounds);

  
    if (!this.isNew) {
      // Subtract 1 second to account for the minor delay between saving
      // this document and signing the JWT.
      this.passwordChangedAt = new Date(Date.now() - 1000);
    }

    next();
  } catch (error) {
    next(error);
  }
});



userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error(
      'comparePassword() called on a document fetched without .select(\'+password\'). ' +
      'Use User.findOne({ email }).select(\'+password\').'
    );
  }
  return bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (!this.passwordChangedAt) return false;
  const changedAtSeconds = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedAtSeconds > jwtIssuedAt;
};


userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);

  return rawToken;
};


userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  this.emailVerificationExpires = new Date(Date.now() + VERIFY_TOKEN_EXPIRES_MS);

  return rawToken;
};


const User = mongoose.model('User', userSchema);

export default User;