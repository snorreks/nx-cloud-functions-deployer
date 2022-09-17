import type { Timestamp as BackendTimestamp } from '@google-cloud/firestore';
import type { Timestamp as FrontendTimestamp } from 'firebase/firestore';

type Timestamp = FrontendTimestamp | BackendTimestamp;

export interface CoreData {
	id: string;
	createdAt: Timestamp;
	updatedAt?: Timestamp;
	priority?: number;
}
