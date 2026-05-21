import { clerkSetup } from '@clerk/testing/playwright';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env.local' });

export default async function globalSetup() {
  await clerkSetup();
}
