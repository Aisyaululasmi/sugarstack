module.exports = {
  apps: [
    {
      name: 'api',
      script: '/app/apps/api/dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'web',
      cwd: '/app/apps/web',
      script: '/app/node_modules/.bin/next',
      args: `start -p ${process.env.PORT || 3000}`,
      env: {
        NODE_ENV: 'production',
        API_INTERNAL_URL: 'http://localhost:4000',
      },
    },
  ],
};
