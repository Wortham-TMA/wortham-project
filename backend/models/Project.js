// import mongoose from "mongoose";

// const ProjectSchema = new mongoose.Schema(
//   {
//     // basic info
//     name: {
//       type: String,
//       required: true,
//     },

//     description: String,

//     status: {
//       type: String,
//       enum: ["NEW", "IN_PROGRESS", "ON_HOLD", "COMPLETED"],
//       default: "NEW",
//     },

//     // dates
//     startDate: Date,
//     dueDate: Date,

//     // kis admin ne banaya
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // project client
//     client: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Client",
//       required: true,
//     },

//     // ✅ STAGES (each stage tracks its own updater)
//     stages: {
//       type: [
//         {
//           key: { type: String, required: true },
//           stageName: String,
//           timeline: Date,
//           status: {
//             type: String,
//             enum: ["PENDING", "ACTIVE", "COMPLETED"],
//             default: "PENDING",
//           },
//           latestUpdate: { type: String, default: "" },

//           updatedAt: Date,

//           // ✅ VERY IMPORTANT
//           lastUpdatedBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//           },
//         },
//       ],
//       default: [
//         { key: "STAGE_1", stageName: "Concept", status: "PENDING" },
//         { key: "STAGE_2", stageName: "Production", status: "PENDING" },
//         { key: "STAGE_3", stageName: "Delivery", status: "PENDING" },
//       ],
//     },

//     // ✅ TEAM MEMBERS (User IDs only)
//     teamMembers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "TeamMember",   // ✅ IMPORTANT CHANGE
//       },
//     ],
//   },
//   { timestamps: true }
// );

// export default mongoose.models.Project ||
//   mongoose.model("Project", ProjectSchema);



import mongoose from "mongoose";

// ✅ Stage templates
const PRODUCTION_STAGES = [
  { key: "STAGE_1", stageName: "Concept", status: "PENDING" },
  { key: "STAGE_2", stageName: "Production", status: "PENDING" },
  { key: "STAGE_3", stageName: "Delivery", status: "PENDING" },
];

const NORMAL_STAGES = [
  { key: "STAGE_1", stageName: "Project Update", status: "ACTIVE" },
];

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

    // ✅ NEW: project type
    projectType: {
      type: String,
      enum: ["PRODUCTION", "NORMAL"],
      default: "PRODUCTION",
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
      // ✅ changed: default empty (will be set by hook)
      default: [],
    },

    // ✅ TEAM MEMBERS (User IDs only)
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember", // ✅ IMPORTANT CHANGE
      },
    ],
  },
  { timestamps: true }
);

// ✅ Auto-set stages based on projectType ONLY when stages are not provided
ProjectSchema.pre("validate", function (next) {
  if (Array.isArray(this.stages) && this.stages.length > 0) return next();

  this.stages =
    this.projectType === "NORMAL"
      ? NORMAL_STAGES.map((s) => ({ ...s }))
      : PRODUCTION_STAGES.map((s) => ({ ...s }));

  next();
});

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);

