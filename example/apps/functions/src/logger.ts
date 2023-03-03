import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import { CloudPropagator } from '@google-cloud/opentelemetry-cloud-trace-propagator';
import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { gcpDetector } from '@opentelemetry/resource-detector-gcp';
import opentelemetry from '@opentelemetry/sdk-node';
import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';
import { ExpressInstrumentation } from 'opentelemetry-instrumentation-express';
import * as Sentry from '@sentry/node';

Sentry.init({
	dsn: '...',
	integrations: [
		new CaptureConsoleIntegration({
			// array of methods that should be captured
			levels: ['log', 'info', 'warn', 'error', 'debug', 'assert'],
		}),
	],
	normalizeDepth: 10, // or whatever depths suits your needs
	tracesSampleRate: 1.0,
});

const sdk = new opentelemetry.NodeSDK({
	// Setup automatic instrumentation for
	//   http, grpc, and express modules.
	instrumentations: [
		new HttpInstrumentation(),
		new GrpcInstrumentation(),
		new ExpressInstrumentation(),
	],
	// Automatically detect and include span metadata when running
	//   in GCP, e.g. region of the function.
	resourceDetectors: [gcpDetector],
	// Make sure opentelemetry know about Cloud Trace http headers
	//   i.e. 'X-Cloud-Trace-Context'
	textMapPropagator: new CloudPropagator(),
	// Export generated traces to Cloud Trace.
	traceExporter: new TraceExporter(),
});

sdk.start();

// Ensure that generated traces are exported when the container is
//   shutdown.
process.on('SIGTERM', async () => {
	await sdk.shutdown();
});
