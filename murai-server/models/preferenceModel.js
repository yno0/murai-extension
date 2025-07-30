import { Schema, model } from "mongoose";

const preferenceSchema = new Schema ({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    language: {
        type: String,
        enum: ['Taglish', 'English', 'Tagalog', 'Both'],
        default: 'Both'
    },
    sensitivity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    whitelistSite:{
        type: [String],
        default: []
    },
    whitelistTerms:{
        type: [String],
        default: []
    },
    flagStyle: {
        type: String,
        enum: ['default', 'custom', 'asterisk', 'underline', 'blur', 'highlight', 'none'],
        default: 'highlight'
    },
    isHighlighted:{
        type: Boolean,
        default: true,
    },
    color: {
        type: String,
        default: '#374151',
    },
    extensionEnabled: {
        type: Boolean,
        default: true,
    },
    totalActiveTime: {
        type: Number,
        default: 0, // Total active time in minutes
    },
    lastActiveStart: {
        type: Date,
        default: Date.now,
    },
    sessionStartTime: {
        type: Date,
        default: Date.now,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    updatedAt:{
        type: Date,
        default: Date.now,
    }
})

export default model('Preference', preferenceSchema);