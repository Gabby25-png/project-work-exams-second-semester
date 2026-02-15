import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        unique: true
    },
    description: {
        type: String
    },
    tags: [String],
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    state: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    read_count: {
        type: Number,
        default: 0
    },
    reading_time: {
        type: Number
    },
    body: {
        type: String,
        required: [true, 'Please provide the blog body']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Blog', BlogSchema);
