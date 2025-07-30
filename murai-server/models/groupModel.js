import { Schema, model } from "mongoose";


const groupSchema = new Schema({
    name:{
        type: String,
        required: true,
    },
    description:{
        type: String,
    },
    userId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    createAt:{
        type: Date,
        default: Date.now,
    },
    updateAt:{
        type: Date,
        default: Date.now,
    },
    isActive:{
        type: Boolean,
        default: true,
    },
    // New fields for dashboard analytics
    memberCount: {
        type: Number, // Can be updated via aggregation or denormalization
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active',
    },
    type: {
        type: String, // e.g. 'public', 'private'
        default: 'public',
    },
})

export default model('Group', groupSchema);