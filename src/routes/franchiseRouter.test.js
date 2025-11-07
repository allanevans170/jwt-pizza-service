const request = require('supertest');
const app = require('../service');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

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

test('unauthorized to create a new franchise', async () => {
    createFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${testUserAuthToken}`).send(testFranchise);
    expect(createFranchiseRes.status).toBe(403);
    expect(createFranchiseRes.body).toMatchObject({message: 'unable to create a franchise'});
});

// delete a franchise
test('delete a franchise', async () => {
    const franchiseID = createFranchiseRes.body.id;

    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteFranchiseRes.status).toBe(200);
    expect(deleteFranchiseRes.body).toEqual({ message: 'franchise deleted' });
});

// create a store (authorized, admin)
test('create a store', async () => {
    const franchiseID = createFranchiseRes.body.id;
    const testStore = { name: 'midici!', address: '123 Main St', phone: '555-1234' };

    const createStoreRes = await request(app)
        .post(`/api/franchise/${franchiseID}/store`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(testStore);
    
    expect(createStoreRes.status).toBe(200);
    expect(createStoreRes.body.name).toBe(testStore.name);
})

// test('get franchises', async () => {
//     const getFranchiseRes = await request(app).get('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`);
//     expect(getFranchiseRes.status).toBe(200);
//     //-– expect(Array.isArray(getFranchiseRes.body)).toBe(true);
//     //console.log(getFranchiseRes.body);
// });

// test('get user franchises', async () => {
//     const getFranchiseRes = await request(app).get(`/api/franchise/${adminUserId}`).set('Authorization', `Bearer ${adminAuthToken}`);
//     expect(getFranchiseRes.status).toBe(200);
//     expect(Array.isArray(getFranchiseRes.body)).toBe(true);
//     //console.log(getFranchiseRes.body);
// });

function randomName() {
    return Math.random().toString(36).substring(2, 8);
}

// afterAll(async () => {
//   if (adminUser && adminUser.id) {
//     await DB.deleteUser(adminUser.id);
//   }
// });
