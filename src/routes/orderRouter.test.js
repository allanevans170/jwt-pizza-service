const request = require('supertest');
const app = require('../service');

const { Role, DB } = require('../database/database.js');

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{role: Role.Admin}] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    user = await DB.addUser(user);
    return { ...user, password: 'toomanysecrets' };
}

let adminAuthToken;
let testUser;
beforeAll(async () => {
    const adminUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    expect(loginRes.status).toBe(200);
    adminAuthToken = loginRes.body.token;

    const addMenuItem = { id: 1, title: 'Veggie!', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight'};
    const addMenuItemRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(addMenuItem);
    expect(addMenuItemRes.status).toBe(200);

    testUser = { name: 'pizza eater', email: 'p@test.com', password: 'a' };
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';

    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUser.id = registerRes.body.user.id;
});

test('get the menu', async () => {
    const menuRes = await request(app).get('/api/order/menu');
    expect(menuRes.status).toBe(200);

    expect(Array.isArray(menuRes.body)).toBe(true);
    expect(menuRes.body.length).toBeGreaterThan(0);

    const expectedFirstMenuItem = {
        id: 1,
        title: 'Veggie!',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight'
    };
    expect(menuRes.body[0]).toMatchObject(expectedFirstMenuItem);       
});



