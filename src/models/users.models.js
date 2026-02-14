import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        // Multi-Tenant-SaaS 
        ownerId: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
               required: function () {
               return this.role !== "OWNER";
            }},
        name : {
            type : String,
            required : true,
            trim : true,
        },

        phone : {
            type : String,
            required : true,
            unique : true,
        },

        photo : {
            type : String, // Cloudinary Url
        },

        gender : {
            type : String,
            enum : ["Male" , "Female" , "Others"],
            required : true
        },

        aadhar : {
            type : String,
            select : false
        },

        role : {
            type : String,
            enum : ["Owner" , "Admin" , "Worker"],
            default : "Worker",
        },

        workerType : {
            type : String,
            enum : ["Labour" , "Mistri" , "Satring-Labour" , "Satring-Mistri"],
        },

        status : {
            type : String,
            enum : ["Pending" , "Active"],
            default : "Pending",
        },

        siteId : {
             type: mongoose.Schema.Types.ObjectId,
             ref: "Site",
             default: null,
        },

        DailyRate : {
            type : Number,
            default : 0
        },

        password : {
            type : String,
            required : true,
            select : false
        },

        inviteCode: {
            type: String,
            unique: true,
            sparse: true, // allows multiple null values
        },    

        OTP : {
            type : String,
            select : false
        },

        OTPExpiresAt : {
            type : Date,
        },

    }, {timestamps : true});

const User = mongoose.model("User" , userSchema);

export default User;