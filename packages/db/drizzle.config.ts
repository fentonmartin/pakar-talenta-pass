import { defineConfig } from 'drizzle-kit';

const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  throw new Error(
    'POSTGRES_URL is not set. Add it to your environment (see .env.example) before running Drizzle Kit.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/index.ts',
  out: './migrations',
  dbCredentials: {
    url: postgresUrl,
  },
  verbose: true,
  strict: true,
});
