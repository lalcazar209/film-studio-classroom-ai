// Env vars are loaded by the `test` npm script itself (`node --env-file=.env`),
// mirroring how the smoke-test scripts get DATABASE_URL and friends. This
// file exists so vitest.config.ts has a stable setupFiles target even as
// what it needs to do here grows (e.g. future global DB truncation).
export {};
