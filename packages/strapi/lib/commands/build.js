'use strict';

const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { green, cyan, yellow } = require('chalk');
const strapiAdmin = require('strapi-admin');
const { cli } = require('strapi-utils');
const loadConfigFile = require('../load/load-config-files');

// build script shoul only run in production mode
module.exports = async () => {
  // Check that we're in a valid Strapi project.
  if (!cli.isStrapiApp()) {
    return console.log(
      `⛔️ ${cyan('strapi start')} can only be used inside a Strapi project.`
    );
  }

  const dir = process.cwd();
  const env = process.env.NODE_ENV || 'development';

  const envConfigDir = path.join(dir, 'config', 'environments', env);

  if (!fs.existsSync(envConfigDir)) {
    console.log(
      `Missing envrionnment config for env: ${green(
        env
      )}.\nMake sure the directory ${yellow(
        `./config/environments/${env}`
      )} exists`
    );
    process.exit(1);
  }

  const serverConfig = await loadConfigFile(envConfigDir, 'server.+(js|json)');

  const adminPath = _.get(serverConfig, 'admin.path', '/admin');
  // const adminHost = _.get(serverConfig, 'admin.build.host', '/admin');
  const adminBackend = _.get(serverConfig, 'admin.build.backend', '/');

  console.log(`Building your admin UI with ${green(env)} configuration ...`);

  return strapiAdmin
    .build({
      dir,
      // front end build env is always production for now
      env: 'production',
      options: {
        backend: adminBackend,
        publicPath: addSlash(adminPath),
      },
    })
    .then(() => {
      process.exit();
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
};

function addSlash(path) {
  if (typeof path !== 'string') throw new Error('admin.path must be a string');
  if (path === '' || path === '/') return '/';

  if (path[0] != '/') path = '/' + path;
  if (path[path.length - 1] != '/') path = path + '/';
  return path;
}
