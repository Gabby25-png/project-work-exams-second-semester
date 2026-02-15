import request from 'supertest';
import app from '../../app';
import User from '../../models/user';

describe('Auth Endpoints', () => {
    const user = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123'
    };

    beforeEach(async () => {
        await User.deleteMany();
    });

    it('should signup a new user', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send(user);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
    });

    it('should login an existing user', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send(user);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: user.email,
                password: user.password
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login with wrong credentials', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send(user);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: user.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
    });
});
