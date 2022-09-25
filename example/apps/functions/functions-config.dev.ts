// set you environment variables
// and do other stuff before executing a
// script here:
import { config } from 'dotenv';

config({
	path: './.env.dev',
});

process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
	projectId: '',
	privateKey: '',
	clientEmail: '',
});
