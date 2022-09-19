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
  const {
    params: { username, password },
  } = req;

  const user = await Parse.User.logIn(username, password);

  const modifiedUser = {
    objectId: user.id,
    sessionToken: user.get('sessionToken'),
  };

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
  const Landmark = Parse.Object.extend('Landmark');
  const query = new Parse.Query(Landmark);

  const { objectId, payload } = req.params;

  query.equalTo('objectId', objectId);
  const results = await query.first();

  console.log(results)

  results.set("title", "a title");
  results.save();
});
