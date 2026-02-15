import request from 'supertest';
import app from '../../app';
import User from '../../models/user';
import Blog from '../../models/blog';

describe('Blog Endpoints', () => {
    let token;
    let userId;

    const user = {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'password123'
    };

    beforeEach(async () => {
        const signupRes = await request(app)
            .post('/api/auth/signup')
            .send(user);
        token = signupRes.body.token;
        
        const loggedInUser = await User.findOne({ email: user.email });
        userId = loggedInUser._id;
    });

    it('should create a new blog in draft state', async () => {
        const res = await request(app)
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'My First Blog',
                description: 'Description of blog',
                tags: ['tech', 'node'],
                body: 'This is the body of the blog with some words to calculate reading time.'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.state).toEqual('draft');
    });

    it('should not show draft blog in public list', async () => {
        await Blog.create({
            title: 'Draft Blog',
            body: 'Draft content',
            state: 'draft',
            author: userId
        });

        const res = await request(app).get('/api/blogs');
        expect(res.body.data.length).toEqual(0);
    });

    it('should update blog state to published', async () => {
        const blog = await Blog.create({
            title: 'About to publish',
            body: 'Content',
            state: 'draft',
            author: userId
        });

        const res = await request(app)
            .patch(`/api/blogs/${blog._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ state: 'published' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.state).toEqual('published');
    });

    it('should show published blog in public list', async () => {
        await Blog.create({
            title: 'Published Blog',
            body: 'Content',
            state: 'published',
            author: userId
        });

        const res = await request(app).get('/api/blogs');
        expect(res.body.data.length).toEqual(1);
    });

    it('should get single published blog and increment read_count', async () => {
        const blog = await Blog.create({
            title: 'Read me',
            body: 'Content',
            state: 'published',
            author: userId
        });

        const res = await request(app).get(`/api/blogs/${blog._id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.read_count).toEqual(1);
    });

    it('should get owner blogs including drafts', async () => {
        await Blog.create([
            { title: 'B1', body: 'C1', state: 'draft', author: userId },
            { title: 'B2', body: 'C2', state: 'published', author: userId }
        ]);

        const res = await request(app)
            .get('/api/blogs/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(2);
    });

    it('should delete a blog', async () => {
        const blog = await Blog.create({
            title: 'Delete me',
            body: 'Content',
            author: userId
        });

        const res = await request(app)
            .delete(`/api/blogs/${blog._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        const check = await Blog.findById(blog._id);
        expect(check).toBeNull();
    });

    describe('Search, Filter and Sort', () => {
        beforeEach(async () => {
            await Blog.create([
                {
                    title: 'NodeJS Advanced',
                    tags: ['node'],
                    body: 'Content',
                    state: 'published',
                    author: userId,
                    read_count: 10,
                    timestamp: new Date('2023-01-01')
                },
                {
                    title: 'React Basics',
                    tags: ['react'],
                    body: 'Content',
                    state: 'published',
                    author: userId,
                    read_count: 50,
                    timestamp: new Date('2023-01-02')
                }
            ]);
        });

        it('should search by title', async () => {
            const res = await request(app).get('/api/blogs?search=NodeJS');
            expect(res.body.data.length).toEqual(1);
            expect(res.body.data[0].title).toEqual('NodeJS Advanced');
        });

        it('should filter by tags', async () => {
            const res = await request(app).get('/api/blogs?tags=react');
            expect(res.body.data.length).toEqual(1);
            expect(res.body.data[0].title).toEqual('React Basics');
        });

        it('should sort by read_count', async () => {
            const res = await request(app).get('/api/blogs?sort=read_count');
            expect(res.body.data[0].read_count).toEqual(10);
            expect(res.body.data[1].read_count).toEqual(50);
        });

        it('should paginate results', async () => {
            const res = await request(app).get('/api/blogs?limit=1&page=1');
            expect(res.body.data.length).toEqual(1);
            expect(res.body.pagination.pages).toEqual(2);
        });
    });
});
