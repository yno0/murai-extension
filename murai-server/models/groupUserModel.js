import {Schema, model} from 'mongoose';

const groupMemberSchema = new Schema ({
    userId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    groupId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
    joinedAt:{
        type: Date,
        default: Date.now,
    },
    
})

export default model('GroupMember', groupMemberSchema);