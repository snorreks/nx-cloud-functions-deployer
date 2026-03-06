import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';
import { close, init, setTag } from '@sentry/node';

init({
	dsn: process.env.SENTRY_DSN,
	integrations: [
		new CaptureConsoleIntegration({
			// array of methods that should be captured
			levels: ['log', 'info', 'warn', 'error', 'debug', 'assert'],
		}),
	],
	normalizeDepth: 10, // or whatever depths suits your needs
	tracesSampleRate: 1.0,
});

const functionName = process.env['CFD_FUNCTION_NAME']; // We get the function name automatically from the environment variable
if (functionName) {
	setTag('function-name', functionName);
}

// Ensure that generated traces are exported when the container is
//   shutdown.
process.on('SIGTERM', async () => {
	await close(2000);
});
