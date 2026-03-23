module.exports = {
  apps: [
    {
      name: 'api',
      script: 'apps/api/dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'web',
      cwd: '/app/apps/web',
      script: '/app/node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        // Next.js rewrites /api/* → http://localhost:4000/api/* (see next.config.ts)
        API_INTERNAL_URL: 'http://localhost:4000',
      },
    },
  ],
};
