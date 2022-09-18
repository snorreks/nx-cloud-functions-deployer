import type { Timestamp as BackendTimestamp } from '@google-cloud/firestore';
import type { Timestamp as FrontendTimestamp } from 'firebase/firestore';

type Timestamp = FrontendTimestamp | BackendTimestamp;

export interface CoreData {
	/**
	 * The document's ID
	 *
	 * @see https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot#id
	 */
	id: string;
	/**
	 * The time when the document was created
	 *
	 * @see https://firebase.google.com/docs/reference/node/firebase.firestore.Timestamp
	 */
	createdAt: Timestamp;
	/**
	 * The time when the document was last updated
	 *
	 * @see https://firebase.google.com/docs/reference/node/firebase.firestore.Timestamp
	 */
	updatedAt?: Timestamp;
	/**
	 * Optional field used to sort documents.
	 *
	 * Recommended to use a unix timestamp of the {@link createdAt} field.
	 *
	 * @see https://firebase.google.com/docs/firestore/query-data/order-limit-data
	 */
	priority?: number;
}
