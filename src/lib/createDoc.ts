import { doc, setDoc, addDoc, collection, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from './firebase';

export interface CreateDocOptions {
  collection: string;
  data: DocumentData;
  id?: string;
  merge?: boolean;
}

export interface CreateDocResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Create a document in Firestore with automatic timestamps
 * @param options - Configuration options for document creation
 * @returns Promise with creation result
 */
export async function createDoc(options: CreateDocOptions): Promise<CreateDocResult> {
  try {
    const { collection: collectionName, data, id, merge = false } = options;
    
    // Add timestamps
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    let docId: string;

    if (id) {
      // Use specified ID
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, docData, { merge });
      docId = id;
    } else {
      // Auto-generate ID
      const docRef = await addDoc(collection(db, collectionName), docData);
      docId = docRef.id;
    }

    return {
      success: true,
      id: docId,
    };
  } catch (error) {
    console.error('Error creating document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update an existing document in Firestore
 * @param collection - Collection name
 * @param id - Document ID
 * @param data - Data to update
 * @returns Promise with update result
 */
export async function updateDoc(
  collection: string,
  id: string,
  data: DocumentData
): Promise<CreateDocResult> {
  try {
    const docRef = doc(db, collection, id);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a document from Firestore
 * @param collection - Collection name
 * @param id - Document ID
 * @returns Promise with deletion result
 */
export async function deleteDoc(
  collection: string,
  id: string
): Promise<CreateDocResult> {
  try {
    const docRef = doc(db, collection, id);
    await setDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
