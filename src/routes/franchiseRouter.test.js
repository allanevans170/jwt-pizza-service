const request = require('supertest');
const app = require('../service');

const { Role, DB } = require('../database/database.js');

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}
    
let adminUser;
let adminUserId;
let adminAuthToken;
let testUserAuthToken;

beforeAll(async () => {
    adminUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    expect(loginRes.status).toBe(200);
    adminAuthToken = loginRes.body.token;
    adminUserId = loginRes.body.user.id;

    const testUser = { name: 'unauthorized', email: 'unAuth@test.com', password: 'a' };
    const testRegRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = testRegRes.body.token;
});

let testFranchise;
let createFranchiseRes;

beforeEach(async () => {
    const franchiseName = randomName();
    testFranchise = { name: 'pizza' + franchiseName, admins: [{ email: adminUser.email }] };

    createFranchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(testFranchise);
});

test('create a new franchise', async () => {
    // setup contained in beforeEach
    expect(createFranchiseRes.status).toBe(200);
    expect(createFranchiseRes.body).toMatchObject(testFranchise);
});

function randomName() {
    return Math.random().toString(36).substring(2, 8);
}

afterAll(async () => {
  if (adminUser && adminUser.id) {
    await DB.deleteUser(adminUser.id);
  }
});
