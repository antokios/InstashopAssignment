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
  const { params: { username, password } } = req;
  const user = await Parse.User.logIn(username, password);
  if (user.error) {
    return user.error
  }

  return user;
});

Parse.Cloud.define('fetchLandmarks', async req => {
  const query = new Parse.Query('Landmark');

  // check if user sets a specific object id and fetch only that one,
  // otherwise fetch all and sort by ascending order
  if (req.params.objectId) {
    query.equalTo('objectId', req.params.objectId)
  }

  query.ascending('order');
  query.select('objectId', 'title', 'short_info', 'photo_thumb', 'photo');
  const results = await query.find();

  return results;
},
{
  requireUser: true
});
