import { getMessaging } from 'firebase-admin/messaging';
import app from './app';

export const fcm = getMessaging(app);
