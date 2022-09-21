Parse.Cloud.define('hello', req => {
  req.log.info(req);
  return 'Hi';
});

Parse.Cloud.define('asyncFunction', async req => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  req.log.info(req);
  return 'Hi async';
});

Parse.Cloud.beforeSave('Test', () => {
  throw new Parse.Error(9001, 'Saving test objects is not available.');
});

Parse.Cloud.define('login', async req => {
  Parse.User.enableUnsafeCurrentUser();
  const {
    params: { username, password },
  } = req;

  const user = await Parse.User.logIn(username, password);

  const modifiedUser = {
    objectId: user.id,
    sessionToken: user.get('sessionToken'),
  };

  Parse.User.become(`${modifiedUser.sessionToken}`).then(
    function (user) {
      console.log(`The current user is now set to: ${user.id}`);
    },
    function (error) {
      console.log(error);
    }
  );

  return modifiedUser;
});

const modifyLandmark = async (req, query) => {
  const { objectId } = req.params;
  objectId ? query.equalTo('objectId', objectId) : query.ascending('order');

  // query.select('objectId', 'title', 'short_info', 'photo_thumb', 'photo');
  const results = await query.find();

  const modifiedResults = results.map(landmark => ({
    __id: landmark.id,
    title: landmark.get('title'),
    short_info: landmark.get('short_info'),
    photo_thumb: landmark.get('photo_thumb'),
    photo: landmark.get('photo'),
    ...(objectId && {
      url: landmark.get('url'),
      description: landmark.get('description'),
      location: landmark.get('location'),
    }),
    // order: landmark.get('order')  // Just to check if ordering is functioning
  }));
  return modifiedResults;
};

Parse.Cloud.define('fetchLandmarks', async req => {
  const Landmark = Parse.Object.extend('Landmark');
  const query = new Parse.Query(Landmark);

  const modifiedResults = await modifyLandmark(req, query);

  return modifiedResults;
});

Parse.Cloud.define('saveLandmark', async req => {
  if (!req.user.authenticated()) {
    throw 'User is not authenticated';
  }

  const Landmark = Parse.Object.extend('Landmark');
  const query = new Parse.Query(Landmark);

  const { objectId, payload } = req.params;

  query.equalTo('objectId', objectId);
  const results = await query.first();

  if (!results) {
    throw 'Object not found';
  }

  const keys = Object.keys(payload);

  keys.forEach(key => {
    if (results.has(key)) {
      results.set(key, payload[key]);
    } else {
      throw `Property: ${key} does not exist on object`;
    }
  });

  // console.log(req.user.get('sessionToken'))
  return results.save();
});

// /// Check if user is on the Role
// /// ---------------------------------------------------------------------------------------
// async function userInRole({ roleName, user }) {
//   const query = new Parse.Query(Parse.Role);
//   query.equalTo('name', roleName);
//   query.equalTo('users', user);
//   return await query.first({ useMasterKey: true });
// }

// Parse.Cloud.define('testFunc', async req => {
//   const roleACL = new Parse.ACL();
//   roleACL.setPublicReadAccess(true);
//   roleACL.setWriteAccess(`${Parse.User.current()}`, true);

//   const role = new Parse.Role('Admin', roleACL);

//   role.save().then(function () {
//     role.getUsers().add(Parse.User.current());
//     role.save().then(function () {
//       console.log(`Role Created: ${role.id}`);
//     });
//   });
// });

// Parse.Cloud.define('checkUser', async req => {
//   // get user from request
//   // const user = await Parse.User.current();
//   const user = req.user;

//   // check if the user are on the admin role
//   const isAdmin = await userInRole({ roleName: 'administrator', user })
//   if (!isAdmin) {
//     throw `${user.get('username')} is not an administrator. You don't have permission to continue.`
//   }

//   return `${user.get('username')} is an administrator. Permission granted.`;

//   // if (user.authenticated()) {
//   //   return 'auth success';
//   // }

//   // throw 'auth failed';
// });
