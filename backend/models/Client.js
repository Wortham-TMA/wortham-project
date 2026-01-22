import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
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

    companyName: {
      type: String,
    },

    clientType: {
      type: String,
      required: true,
    },

    googleDriveFolderId: {
      type: String,
    },

    creditBalance: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔥 THIS WAS MISSING
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Client ||
  mongoose.model("Client", ClientSchema);
