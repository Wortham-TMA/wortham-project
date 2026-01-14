import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    // basic info
    name: {
      type: String,
      required: true,
    },

    description: String,

    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "ON_HOLD", "COMPLETED"],
      default: "NEW",
    },

    // dates
    startDate: Date,
    dueDate: Date,

    // kis admin ne banaya
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // project client
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    // ✅ STAGES (each stage tracks its own updater)
    stages: {
      type: [
        {
          key: { type: String, required: true },
          stageName: String,
          timeline: Date,
          status: {
            type: String,
            enum: ["PENDING", "ACTIVE", "COMPLETED"],
            default: "PENDING",
          },
          latestUpdate: { type: String, default: "" },

          updatedAt: Date,

          // ✅ VERY IMPORTANT
          lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
      default: [
        { key: "STAGE_1", stageName: "Concept", status: "PENDING" },
        { key: "STAGE_2", stageName: "Production", status: "PENDING" },
        { key: "STAGE_3", stageName: "Delivery", status: "PENDING" },
      ],
    },

    // ✅ TEAM MEMBERS (User IDs only)
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember",   // ✅ IMPORTANT CHANGE
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);
