import { Schema, model } from "mongoose";

const userActivitySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    activityType:{
        type: String,
        enum: ['login', 'logout', 'update', 'visit', 'report', 'group_join', 'group_leave', 'flagged', 'other'],
        required: true,
    },
    activityDetails:{
        type: String,
    },    
    activityCategory: {
        type: String, // e.g. 'security', 'content', 'system', etc.
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }

})

export default model('UserActivity', userActivitySchema);