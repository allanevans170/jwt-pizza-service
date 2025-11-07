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

test('unauthorized to create a store', async () => {
    const franchiseID = createFranchiseRes.body.id;
    const testStore = { name: 'boom pizza', address: '456 Elm St', phone: '595-4378' };

    const createStoreRes = await request(app)
        .post(`/api/franchise/${franchiseID}/store`)
        .set('Authorization', `Bearer ${testUserAuthToken}`)
        .send(testStore);

    expect(createStoreRes.status).toBe(403);
    expect(createStoreRes.body).toMatchObject({ message: 'unable to create a store' });
});

test('delete a store', async () => {
    const franchiseID = createFranchiseRes.body.id;
    const store = { name: 'to be deleted', address: '12 Main St', phone: '800-666-9999' };
    const createStoreRes = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(store);
    expect(createStoreRes.status).toBe(200);
    const storeID = createStoreRes.body.id;
    
    const deleteStoreRes = await request(app).delete(`/api/franchise/${franchiseID}/store/${storeID}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteStoreRes.status).toBe(200);
    expect(deleteStoreRes.body).toEqual({ message: 'store deleted' });
});

function randomName() {
    return Math.random().toString(36).substring(2, 8);
}

// afterAll(async () => {
//   if (adminUser && adminUser.id) {
//     await DB.deleteUser(adminUser.id);
//   }
// });
