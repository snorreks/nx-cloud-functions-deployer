import { config } from 'firebase-functions';
const environment = config();

export const isDevelopmentFlavor = !!environment.dev;
