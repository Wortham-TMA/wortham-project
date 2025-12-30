import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: String,
        email: {
            type:String, 
            unique: true
        },
        passwordHash: String,
        role: {
            type:String,
            enum:[
                "ADMIN",
                "TEAM_MEMBER",
                "CLIENT"
            ]
        }
    },
    {timestamps: true}
);

export default mongoose.models.User || mongoose.model("User", UserSchema);