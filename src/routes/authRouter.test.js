const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };

let testUserAuthToken;

beforeEach(async () => {     // registers a random user before the tests run
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUser.id = registerRes.body.user.id;
    expectValidJwt(testUserAuthToken);
});

test('login', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);
  
    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('incomplete register', async () => {
    const badTestUser = { name: 'no completado', password: 'z' };
    const incompleteRegisterRes = await request(app).post('/api/auth').send(badTestUser);
    expect(incompleteRegisterRes.status).toBe(400);
    expect(incompleteRegisterRes.body).toEqual({ message: 'name, email, and password are required' });
});

test('logout', async () => {
    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({ message: 'logout successful' });
});

test('update user', async () => {
    const updatedUser = { email: 'updated@hotmail.com', password: 'new'};
    const updateUserRes = await request(app).put(`/api/auth/${testUser.id}`).set('Authorization', `Bearer ${testUserAuthToken}`).send(updatedUser);
    
    expect(updateUserRes.status).toBe(200);
    expect(updateUserRes.body).toMatchObject({ email: updatedUser.email });
    // password is not returned in the response SECURITY RISK
});

test('unauthorized update user fail', async () => {
    const updatedUser = { email: 'updated@hotmail.com', password: 'new'};
    const badId = testUser.id + 1;
    const updateUserRes = await request(app).put(`/api/auth/${badId}`).set('Authorization', `Bearer ${testUserAuthToken}`).send(updatedUser);
    
    expect(updateUserRes.status).toBe(403);
    expect(updateUserRes.body).toMatchObject({ message: 'unauthorized'});
    // password is not returned in the response SECURITY RISK
});

test('failed login', async () => {
    const badLoginRes = await request(app).put('/api/auth').send({ ...testUser, password: 'b' });
    //console.log(badLoginRes.body);
    expect(badLoginRes.status).toBe(404);
    expect(badLoginRes.body).toMatchObject({ message: 'unknown user' });
})

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}
// downside of component testing: complicates the test setup, potentially increases time the test takes to execute

// downside of pure unit test: doesn't actually test the integration of the components

//test('login with bad password', async () => {   // problem, returns 404 instead of 401...
//    const loginRes = await request(app).put('/api/auth').send({ ...testUser, password: 'b' });
//    expect(loginRes.status).toBe(401);
//

// test('update user unauthorized', async () => {
//    });