import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  seed: 'tsx prisma/seed.ts',
});
