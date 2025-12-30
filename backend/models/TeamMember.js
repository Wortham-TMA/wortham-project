import mongoose from "mongoose";

const TeamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    designation: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

export default mongoose.models.TeamMember ||
  mongoose.model("TeamMember", TeamMemberSchema);
