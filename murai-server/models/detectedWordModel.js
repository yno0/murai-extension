import { Schema, model } from 'mongoose';

const detectedWordSchema = new Schema({
    word: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }  ,
    context: {
        type: String,
        required: true,
    },
    sentimentScore: {
        type: Number,
        required: true,
    },
   url: {
    type: String, 
    required: true,
   },
   accuracy: {
        type: Number,
        required: true,
    },
    responseTime: {
        type: Number,
        required: true,
    },
    patternType: {
        type: String, // e.g. 'Profanity', 'Hate Speech', etc.
    },
    language: {
        type: String, // e.g. 'English', 'Tagalog', etc.
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
    },
    siteType: {
        type: String, // e.g. 'Social Media', 'Forum', etc.
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

export default model('DetectedWord', detectedWordSchema);