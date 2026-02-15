import express from 'express';
import {
    getBlogs,
    getBlog,
    createBlog,
    getMyBlogs,
    updateBlog,
    deleteBlog
} from '../controllers/blogController.js';

import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .get(getBlogs)
    .post(protect, createBlog);

router.get('/me', protect, getMyBlogs);

router.route('/:id')
    .get(getBlog)
    .patch(protect, updateBlog)
    .delete(protect, deleteBlog);

export default router;
