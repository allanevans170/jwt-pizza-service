const request = require('supertest');
const app = require('../service');

//const testUser = { name: 'pizza franchisee!', email: 'reg@test.com', password: 'a' };
//const testFranchise = { name: 'pizzaMama', admins: [{ email: 'reg@test.com'}]}
//let testUserAuthToken;

//const adminUser = { name: 'admin', email: '};

const { Role, DB } = require('../database/database.js');
const { StatusCodeError } = require('../endpointHelper.js');

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

    expect(createStoreRes.status).toBe(200);
    expect(createStoreRes.body.name).toBe(store.name);
})

// delete a store attached to a franchise


// test('list all franchises', async () => {
//     const testFranchise2 = { name: 'pizzaObama', admins: [{ email: 'obama@admin.com'}] };


//     const listAllRes = await request(app).get('/api/franchise');

//     expect(listAllRes.status).toBe(200);
//     //console.log(listAllRes.body);
//     expect(Array.isArray(listAllRes.body)).toBe(true);
//     expect(listAllRes.body).toEqual(expect.arrayContaining([expect.objectContaining({ name: testFranchise2.name, admins: expect.arrayContaining([expect.objectContaining({ email: testFranchise2.admins[0].email })]) })]));
// });
// test('list all franchises', async () => {
//     const listAllRes = await request(app).get('/api/franchise');
//     expect(listAllRes.status).toBe(200);
//     expect(listAllRes.body).toEqual(expect.arrayContaining([expect.objectContaining({ "id": 1, "name": "pizzaMama", "})]));
// });

    // response: { name: 'pizzaPocket', admins: [{ email: 'f@jwt.com', id: 4, name: 'pizza franchisee' }], id: 1 },

function randomName() {
    return Math.random().toString(36).substring(2, 8);
}