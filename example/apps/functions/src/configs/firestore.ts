import { getFirestore } from 'firebase-admin/firestore';
import app from './app';

export const firestore = getFirestore(app);
