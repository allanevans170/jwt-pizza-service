// // might build this out to cut down on code duplication in tests

// if (process.env.VSCODE_INSPECTOR_OPTIONS) {
//   jest.setTimeout(60 * 1000 * 5); // 5 minutes
// }

// async function createAdminUser() {
//   let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
//   user.name = randomName();
//   user.email = user.name + '@admin.com';

//   user = await DB.addUser(user);
//   return { ...user, password: 'toomanysecrets' };
// }

// module.exports = {
//   createAdminUser,
// };