const request = require('supertest');
const app = require('../service');

//const testUser = { name: 'pizza franchisee!', email: 'reg@test.com', password: 'a' };
const testFranchise = { name: 'pizzaMama', admins: [{ email: 'reg@test.com'}]}
//let testUserAuthToken;

const { Role, DB } = require('../database/database.js');

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{role: Role.Admin}] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    user = await DB.addUser(user);
    return { ...user, password: 'toomanysecrets' };
}
//beforeAll(async () => {
    //testUser.email = Math.random().toString(36).substring(2,12) + '@test.com';
    //const registerRes = await request(app).post('/api/auth').send(testUser);
    //testUserAuthToken = registerRes.body.token;
    //console.log(`Auth Token: ${testUserAuthToken}`);
    //expectValidJwt(testUserAuthToken);

    //const createFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${testUserAuthToken}`).send(testFranchise);
    //testFranchiseID = createFranchiseRes.body.id;
    //testFranchiseName = createFranchiseRes.body.name;
    //expect(testFranchiseName).toBe(testFranchise.name);
    //expect(testFranchiseID).toBeGreaterThan(0);
//});



test('create a new franchise', async () => {
    const adminUser = await createAdminUser();

    const loginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    expect(loginRes.status).toBe(200);
    const adminAuthToken = loginRes.body.token;

    expect(loginRes.status).toBe(200);
    expectValidJwt(adminAuthToken).toBeDefined();

    const testFranchise = { name: 'pizzaMama', admins: [{ email: 'reg@test.com'}]}

    //const createFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${testUserAuthToken}`).send(testFranchise);
    //console.log('create Franchise Response:', createFranchiseRes.body);
    //expect(createFranchiseRes.status).toBe(200);
    // expect(createFranchiseRes.body).toMatchObject(testFranchise);
});
// test('list all franchises', async () => {
//     const listAllRes = await request(app).get('/api/franchise');
//     expect(listAllRes.status).toBe(200);
//     expect(listAllRes.body).toEqual(expect.arrayContaining([expect.objectContaining({ "id": 1, "name": "pizzaMama", "})]));
// });

    // response: { name: 'pizzaPocket', admins: [{ email: 'f@jwt.com', id: 4, name: 'pizza franchisee' }], id: 1 },

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}