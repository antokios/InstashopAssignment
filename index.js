// Example express application adding the parse-server module to expose Parse
// compatible API routes.
require('dotenv').config();

const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const ParseDashboard = require('parse-dashboard');
const path = require('path');
const args = process.argv || [];
const test = args.some(arg => arg.includes('jasmine'));

const databaseUri = process.env.DATABASE_URI;

const apiConfig = {
  databaseURI: databaseUri,
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY, //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL, // Don't forget to change to https if needed
  liveQuery: {
    classNames: ['Posts', 'Comments'], // List of classes to support for query subscriptions
  },
  // classLevelPermissions: {
  //   find: {
  //     requiresAuthentication: false,
  //     'role:admin': false,
  //   },
  //   get: {
  //     requiresAuthentication: false,
  //     'role:admin': false,
  //   },
  //   create: { 'role:admin': true },
  //   update: { 'role:admin': true },
  //   delete: { 'role:admin': true },
  // },
};

const dashboardConfig = {
  apps: [
    {
      serverURL: process.env.SERVER_URL,
      appId: process.env.APP_ID,
      masterKey: process.env.MASTER_KEY,
      appName: process.env.APP_NAME,
    },
  ],
  users: [
    {
      user: process.env.APP_USER,
      pass: process.env.APP_PASS
    },
  ],
};
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

const app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
const mountPath = process.env.PARSE_MOUNT || '/parse';
if (!test) {
  const api = new ParseServer(apiConfig);
  const dashboard = new ParseDashboard(dashboardConfig);
  app.use(mountPath, api);
  app.use('/dashboard', dashboard)
}

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

const port = process.env.PORT || 5000;
if (!test) {
  const httpServer = require('http').createServer(app);
  httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
  });
  // This will enable the Live Query real-time server
  ParseServer.createLiveQueryServer(httpServer);
}

module.exports = {
  app,
  apiConfig,
  dashboardConfig,
};
