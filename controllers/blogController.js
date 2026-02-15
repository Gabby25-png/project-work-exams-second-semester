import Blog from '../models/blog.js';
import User from '../models/user.js';
import calculateReadingTime from '../utils/readingTime.js';

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
export const getBlogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, author, tags, sort } = req.query;
        const query = { state: 'published' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (author) {
            // Find user by name or email to get ID
            const users = await User.find({
                $or: [
                    { first_name: { $regex: author, $options: 'i' } },
                    { last_name: { $regex: author, $options: 'i' } }
                ]
            });
            query.author = { $in: users.map(u => u._id) };
        }

        if (tags) {
            query.tags = { $in: tags.split(',') };
        }

        let sortBy = '-timestamp';
        if (sort) {
            const allowedSort = ['read_count', 'reading_time', 'timestamp'];
            if (allowedSort.includes(sort)) {
                sortBy = sort === 'timestamp' ? '-timestamp' : sort;
            }
        }

        const blogs = await Blog.find(query)
            .populate('author', 'first_name last_name email')
            .sort(sortBy)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Blog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: blogs.length,
            total,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            data: blogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single published blog
// @route   GET /api/blogs/:id
// @access  Public
export const getBlog = async (req, res, next) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            { _id: req.params.id, state: 'published' },
            { $inc: { read_count: 1 } },
            { returnDocument: 'after' }
        ).populate('author', 'first_name last_name email');

        if (!blog) {
            return res.status(404).json({ success: false, error: 'Blog not found or not published' });
        }

        res.status(200).json({
            success: true,
            data: blog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
export const createBlog = async (req, res, next) => {
    try {
        const { title, description, tags, body, state } = req.body;
        
        const reading_time = calculateReadingTime(body || '');

        const blog = await Blog.create({
            title,
            description,
            tags,
            body,
            state,
            author: req.user.id,
            reading_time
        });

        res.status(201).json({
            success: true,
            data: blog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get owner's blogs
// @route   GET /api/blogs/me
// @access  Private
export const getMyBlogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, state } = req.query;
        const query = { author: req.user.id };

        if (state) {
            query.state = state;
        }

        const blogs = await Blog.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Blog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: blogs.length,
            total,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            },
            data: blogs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update blog
// @route   PATCH /api/blogs/:id
// @access  Private
export const updateBlog = async (req, res, next) => {
    try {
        let blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ success: false, error: 'Blog not found' });
        }

        // Make sure user is blog owner
        if (blog.author.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this blog' });
        }

        const { title, description, tags, body, state } = req.body;

        if (body) {
            req.body.reading_time = calculateReadingTime(body);
        }

        blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: blog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
export const deleteBlog = async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ success: false, error: 'Blog not found' });
        }

        // Make sure user is blog owner
        if (blog.author.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this blog' });
        }

        await blog.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
