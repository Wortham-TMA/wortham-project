import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    companyName: {
        type: String
    },
    clientType: {
        type: String,
        required: true
    },
    googleDriveFolderId: {
        type: String,
        default: 0
    },
    creditBalance: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean, 
        default: true
    }
},
{timestamps: true}
)

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);