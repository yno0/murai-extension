import { Schema, model } from 'mongoose';

// Optional Website model - only create if you need advanced website management
const websiteSchema = new Schema({
    domain: {
        type: String,
        required: true,
        unique: true, // e.g., 'facebook.com'
    },
    fullUrl: {
        type: String,
        required: true, // e.g., 'https://www.facebook.com'
    },
    siteType: {
        type: String,
        enum: ['Social Media', 'Forum', 'Blog', 'News', 'E-commerce', 'Educational', 'Entertainment', 'Other'],
        default: 'Other'
    },
    category: {
        type: String, // More specific categorization
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    isMonitored: {
        type: Boolean,
        default: true,
    },
    isBlacklisted: {
        type: Boolean,
        default: false,
    },
    isWhitelisted: {
        type: Boolean,
        default: false,
    },
    // Analytics fields (could be computed from DetectedWord aggregations)
    totalDetections: {
        type: Number,
        default: 0,
    },
    lastDetectionAt: {
        type: Date,
    },
    averageAccuracy: {
        type: Number,
        default: 0,
    },
    averageSentiment: {
        type: Number,
        default: 0,
    },
    // Metadata
    description: {
        type: String,
    },
    tags: [{
        type: String,
    }],
    // Admin management
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String, // Admin notes about this website
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Indexes for better performance
websiteSchema.index({ domain: 1 });
websiteSchema.index({ siteType: 1 });
websiteSchema.index({ riskLevel: 1 });
websiteSchema.index({ isMonitored: 1 });

export default model('Website', websiteSchema);
