const request = require('supertest');
const app = require('../service');

const { Role, DB } = require('../database/database.js');
// const { StatusCodeError } = require('../endpointHelper.js');

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{role: Role.Admin}] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    user = await DB.addUser(user);
    return { ...user, password: 'toomanysecrets' };
}
let adminUser;
let adminUserId;
let adminAuthToken;
let testUserAuthToken
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
    // contained in beforeEach
    expect(createFranchiseRes.status).toBe(200);
    expect(createFranchiseRes.body).toMatchObject(testFranchise);
});

test('create a new franchise failure', async () => {
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

// delete a franchise without admin credentials
test('delete a franchise without admin authtoken', async () => {
    const franchiseID = createFranchiseRes.body.id;

    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(deleteFranchiseRes.status).toBe(403);
    expect(deleteFranchiseRes.body).toMatchObject({ message: 'unable to delete a franchise' });
});

// create a store attached to a franchise 

test('create a new store', async () => {
    //console.log("create a new store");
    const franchiseID = createFranchiseRes.body.id;
   
    const store = { name: 'midici', address: '671 Lincoln Ave', phone: '800-555-6666' };
    const createStoreRes = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${adminAuthToken}`).send(store);
    // giconst storeID = createStoreRes.body.id;
    expect(createStoreRes.status).toBe(200);
    expect(createStoreRes.body.name).toBe(store.name);
})

test('create a new store failure - not admin', async () => {
    const franchiseID = createFranchiseRes.body.id;
    const store = { name: 'oscar pizza', address: '123 South St', phone: '800-222-6116' };

    const createStoreRes = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${testUserAuthToken}`).send(store);
    expect(createStoreRes.status).toBe(403);
    expect(createStoreRes.body).toMatchObject({ message: 'unable to create a store' });
});

test('unable to delete store - not admin', async () => {
    const franchiseID = createFranchiseRes.body.id;
    const deleteStoreRes = await request(app).delete(`/api/franchise/${franchiseID}/store/1`).set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(deleteStoreRes.status).toBe(403);
    expect(deleteStoreRes.body).toMatchObject({ message: 'unable to delete a store' });
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

test('get franchises', async () => {
    const getFranchiseRes = await request(app).get('/api/franchise').set('Authorization', `Bearer ${adminAuthToken}`);
    expect(getFranchiseRes.status).toBe(200);
    expect(Array.isArray(getFranchiseRes.body)).toBe(true);
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