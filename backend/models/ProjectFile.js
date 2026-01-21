import mongoose from "mongoose";

const ProjectFileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    uploadedByRole: {
      type: String,
      enum: ["ADMIN", "TEAM_MEMBER", "CLIENT"],
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    fileName: String,
    driveFileId: String,
    driveLink: String,

    remark: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProjectFile", ProjectFileSchema);
