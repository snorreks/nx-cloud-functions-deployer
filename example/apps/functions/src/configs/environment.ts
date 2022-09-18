import { config } from 'dotenv';

config(); // Load environment variables

export const flavor = process.env.FLAVOR;
