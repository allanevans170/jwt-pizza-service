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
let testUserId;

beforeAll(async () => {
    adminUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    expect(loginRes.status).toBe(200);
    adminAuthToken = loginRes.body.token;
    adminUserId = loginRes.body.user.id;

    const testUser = { name: 'unauthorized', email: 'unAuth@test.com', password: 'a' };
    const testRegRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = testRegRes.body.token;
    testUserId = testRegRes.body.user.id;


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

test('unable to delete store - not admin', async () => {
    const franchiseID = createFranchiseRes.body.id;
    const deleteStoreRes = await request(app).delete(`/api/franchise/${franchiseID}/store/1`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(deleteStoreRes.status).toBe(403);
    expect(deleteStoreRes.body).toMatchObject({ message: 'unable to delete a store' });
});

test('get franchises', async () => {
    const getFranchiseRes = await request(app).get('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`);
    expect(getFranchiseRes.status).toBe(200);
    expect(Array.isArray(getFranchiseRes.body.franchises)).toBe(true);
    //console.log(getFranchiseRes.body);
});

test('get user franchises', async () => {
    const getFranchiseRes = await request(app).get(`/api/franchise/${adminUserId}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(getFranchiseRes.status).toBe(200);
    expect(Array.isArray(getFranchiseRes.body)).toBe(true);
    //console.log(getFranchiseRes.body);
});

function randomName() {
    return Math.random().toString(36).substring(2, 8);
}

afterEach(async () => {
    if (createFranchiseRes && createFranchiseRes.body && createFranchiseRes.body.id) {
        const franchiseID = createFranchiseRes.body.id;
        await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${adminAuthToken}`);
    }
});

afterAll(async () => { 
    if (testUserId) {
        await request(app).delete(`/api/auth/${testUserId}`).set('Authorization', `Bearer ${adminAuthToken}`); 
    }

    if (adminUser && adminUser.id) {
        await request(app).delete(`/api/auth/${adminUserId}`).set('Authorization', `Bearer ${adminAuthToken}`);
    }
});
