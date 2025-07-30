import {Schema, model } from 'mongoose';

const groupCodeSchema = new Schema({
    groupId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
    code:{
        type: String,
        required: true,
    },
    createAt:{
        type: Date,
        default: Date.now,
    },
    updateAt:{
        type: Date,
        default: Date.now,
    },
    expiresAt:{
        type: Date,
        required: true,
    }
})

export default model('GroupCode', groupCodeSchema);