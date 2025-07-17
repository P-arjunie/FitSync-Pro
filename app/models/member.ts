import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMember extends Document {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  nic: string;
  address: string;
  contactNumber: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  membershipInfo: {
    plan: string;
    startDate: string;
    paymentPlan: string;
  };
  image: string;
  currentWeight: number;
  height: number;
  bmi: number;
  goalWeight: number;
  status: {
      type: String,
      enum:["pending","approved",'suspended'],
      default: "approved",
    },
  role: string;
}


const memberSchema: Schema = new Schema(
  {
    firstName: String,
    lastName: String,
    dob: String,
    gender: String,
    nic: String,
    address: String,
    contactNumber: String,
    email: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    membershipInfo: {
      plan: String,
      startDate: String,
      paymentPlan: String,
    },
    image: String,
    currentWeight: Number,
    height: Number,
    bmi: Number,
    goalWeight: Number,
    status: {
      type: String,
      enum:["pending","approved",'suspended'],
      default: "approved",
    },
    role: {
      type: String,
      default: "member",
    },
  },
  { timestamps: true }
);

<<<<<<< Updated upstream
=======
// Pre-save middleware to hash password
memberSchema.pre('save', async function(next) {
  const member = this as unknown as IMember;
  
  if (!member.isModified('password')) {
    return next();
  }
  
  try {
    if (!member.password || member.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    member.password = await PasswordUtils.hashPassword(member.password);
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Password hashing error in pre-save:', error);
      next(error);
    } else {
      next(new Error('Unknown error occurred during password hashing'));
    }
  }
});

// Instance method to compare password
memberSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return await PasswordUtils.comparePassword(password, this.password);
};

// Instance method to hash password manually
memberSchema.methods.hashPassword = async function(password: string): Promise<void> {
  this.password = await PasswordUtils.hashPassword(password);
};

// Ensure password field is never returned in queries by default
memberSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});
>>>>>>> Stashed changes

const Member = models.Member || model<IMember>("Member", memberSchema);
export default Member;



