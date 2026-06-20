import mongoose from "mongoose";
import { UserRoles, UserStatus } from "../constants/user.constants.js";

const userSchema = new mongoose.Schema(
    {
        // Multi-Tenant-SaaS 
        ownerId: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
               required: function () {
               return this.role !== UserRoles.OWNER && this.status !== UserStatus.PENDING;
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
            trim: true,
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
            enum : ["Owner" , "Admin" , "Worker", "Subcontractor"],
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

        parentWorkerId : {
             type: mongoose.Schema.Types.ObjectId,
             ref: "User",
             default: null,
        },

        DailyRate : {
            type : Number,
            default : 0
        },

        password : {
            type : String,
            required : false,
            select : false
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
        },

        firebaseUid: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        inviteCode: {
            type: String,
            unique: true,
            sparse: true, // allows multiple null values
            trim: true,
        },    
        workerInviteCode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        adminInviteCode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
    }, {timestamps : true});

const User = mongoose.model("User" , userSchema);

export default User;