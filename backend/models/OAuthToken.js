import mongoose from "mongoose";

const OAuthTokenSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    tokens: { type: Object, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.OAuthToken || mongoose.model("OAuthToken", OAuthTokenSchema);
