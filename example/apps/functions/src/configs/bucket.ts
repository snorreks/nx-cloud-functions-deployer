import { getStorage } from 'firebase-admin/storage';
import app from './app';

export const bucket = getStorage(app).bucket();
