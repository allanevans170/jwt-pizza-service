const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  // testUser.id = registerRes.body.user.id;
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

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

test('logout', async () => {
    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toEqual({ message: 'logout successful' });
});

test('failed login', async () => {
    const badLoginRes = await request(app).put('/api/auth').send({ ...testUser, password: 'b' });
    
    expect(badLoginRes.status).toBe(404);
    expect(badLoginRes.body).toMatchObject({ message: 'unknown user' });
});

test('incomplete registration', async () => {
    const badTestUser = { name: 'Ein Komplete', password: 'z'};

    const incompleteRegisterRes = await request(app).post('/api/auth').send(badTestUser);
    expect(incompleteRegisterRes.status).toBe(400);
    expect(incompleteRegisterRes.body).toEqual({ message: 'name, email, and password are required' });
})