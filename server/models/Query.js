import mongoose from 'mongoose';

const querySchema=new mongoose.Schema({

    topic :{
        type: String,
        required: true,
    },
    userID:{
        type:String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Query=mongoose.model('Query', querySchema,'Topic');
export default Query;