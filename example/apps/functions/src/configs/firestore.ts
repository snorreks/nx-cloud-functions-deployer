import { FieldPath, FieldValue, Timestamp } from 'firebase-admin/firestore';

export const serverTimestamp = FieldValue.serverTimestamp;
export const serverIncrement = FieldValue.increment;
export const serverDelete = FieldValue.delete;
export const timestampFromDate = Timestamp.fromDate;
export const documentId = FieldPath.documentId;
export const arrayUnion = FieldValue.arrayUnion;
export const arrayRemove = FieldValue.arrayRemove;
export const timestampNow = Timestamp.now;
