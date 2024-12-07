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
let loginRes;
let adminAuthToken;

beforeAll(async () => {
    adminUser = await createAdminUser();

    loginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    expect(loginRes.status).toBe(200);
    adminAuthToken = loginRes.body.token;
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
    //console.log(createFranchiseRes.body);
});

test('create a new franchise', async () => {
    // contained in beforeEach
    expect(createFranchiseRes.status).toBe(200);
    expect(createFranchiseRes.body).toMatchObject(testFranchise);
});

// delete a franchise
test('delete a franchise', async () => {
    const adminAuthToken = loginRes.body.token;
    const franchiseID = createFranchiseRes.body.id;

    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${franchiseID}`).set('Authorization', `Bearer ${adminAuthToken}`);
    expect(deleteFranchiseRes.status).toBe(200);
    expect(deleteFranchiseRes.body).toEqual({ message: 'franchise deleted' });
});

// delete a franchise without admin credentials
test('delete a franchise without admin authtoken', async () => {
    const franchiseID = createFranchiseRes.body.id;
    // creating a new unauthorized user
    const testUser = { name: 'unauthorizedDeleter', email: 'unAuthDel@test.com', password: 'a' };
    const testRegRes = await request(app).post('/api/auth').send(testUser);
    const testUserAuthToken = testRegRes.body.token;
    //console.log(`Auth Token: ${testUserAuthToken}`);

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
    console.log(getFranchiseRes.body);
});

function randomName() {
    return Math.random().toString(36).substring(2, 8);
}