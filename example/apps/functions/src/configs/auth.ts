import { getAuth } from 'firebase-admin/auth';
import app from './app';
export const auth = getAuth(app);
