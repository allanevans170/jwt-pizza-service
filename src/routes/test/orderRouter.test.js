const request = require('supertest');
const app = require('../../service.js');

const { Role, DB } = require('../../database/database.js');
//const { StatusCodeError } = require('../endpointHelper.js');

const testUser = { name: 'pizza eater', email: 'order@test.com', password: 'a'}

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{role: Role.Admin}] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    user = await DB.addUser(user);
    return { ...user, password: 'toomanysecrets' };
}

let adminAuthToken;
beforeAll(async () => {
    const adminUser = await createAdminUser();
    const loginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    expect(loginRes.status).toBe(200);
    adminAuthToken = loginRes.body.token;

    const addMenuItem = { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight'};
    const addMenuItemRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(addMenuItem);
    expect(addMenuItemRes.status).toBe(200);
});

let testUserAuthToken;
beforeEach(async () => {     // registers a random user before the tests run
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUser.id = registerRes.body.user.id;
});

test('get the menu', async () => {
    const menuRes = await request(app).get('/api/order/menu');
    expect(menuRes.status).toBe(200);
    
    expect(menuRes.status).toBe(200);
    expect(Array.isArray(menuRes.body)).toBe(true);
    expect(menuRes.body.length).toBeGreaterThan(0);

    const expectedFirstMenuItem = { 
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight'
    };
    expect(menuRes.body[0]).toMatchObject(expectedFirstMenuItem);
});

test('add to menu', async () => {
    // create an admin user
    const addMenuItem = { id: 1, title: 'neapolitano', description: 'tomato, mozarella, basil, mmm', image: 'pizza9.png', price: 0.0002 };
    const addMenuItemRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(addMenuItem);
    expect(addMenuItemRes.status).toBe(200);
    expect(Array.isArray(addMenuItemRes.body)).toBe(true);
    expect(addMenuItemRes.body[addMenuItemRes.body.length - 1].title).toBe(addMenuItem.title);
});

test('unauthorized add to menu', async () => {
    const addMenuItem = { id: 1, title: 'neapolitano', description: 'tomato, mozarella, basil', image: 'pizza9.png', price: 0.0002 };
    const addMenuItemRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${testUserAuthToken}`).send(addMenuItem);
    //console.log(addMenuItemRes.body);
    expect(addMenuItemRes.status).toBe(403);
    expect(addMenuItemRes.body).toMatchObject({ message: 'unable to add menu item' });
});

test('create an order', async () => {
    const order = { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }] };
    const orderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`).send(order);

    expect(orderRes.status).toBe(200);
    expect(orderRes.body.order).toMatchObject(order);
});

test('get orders', async () => {
    const orderRes = await request(app).get('/api/order').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.dinerId).toBe(testUser.id);
    expect(orderRes.body.orders).toBeDefined();
    expect(orderRes.body.page).toBeDefined();
});

function randomName() {
    return Math.random().toString(36).substring(2, 8);
}

// const request = require('supertest');
// const app = require('../../service.js');
// const testHelper = require('../test/testHelper.js');

// const { Role, DB } = require('../../database/database.js');

// let adminAuthToken;
// let testUser;
// beforeAll(async () => {
//     const adminUser = await testHelper.createAdminUser();
//     const loginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
//     expect(loginRes.status).toBe(200);
//     adminAuthToken = loginRes.body.token;

//     const addMenuItem = { id: 1, title: 'Veggie!', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight'};
//     const addMenuItemRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${adminAuthToken}`).send(addMenuItem);
//     expect(addMenuItemRes.status).toBe(200);

//     testUser = { name: 'pizza eater', email: 'p@test.com', password: 'a' };
//     testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';

//     const registerRes = await request(app).post('/api/auth').send(testUser);
//     testUserAuthToken = registerRes.body.token;
//     testUser.id = registerRes.body.user.id;
// });

// test('get the menu', async () => {
//     const menuRes = await request(app).get('/api/order/menu');
//     expect(menuRes.status).toBe(200);

//     expect(Array.isArray(menuRes.body)).toBe(true);
//     expect(menuRes.body.length).toBeGreaterThan(0);

//     const expectedFirstMenuItem = {
//         id: 1,
//         title: 'Veggie!',
//         image: 'pizza1.png',
//         price: 0.0038,
//         description: 'A garden of delight'
//     };
//     expect(menuRes.body[0]).toMatchObject(expectedFirstMenuItem);       
// });



