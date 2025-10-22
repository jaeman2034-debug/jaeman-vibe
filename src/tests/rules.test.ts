import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'jaeman-vibe-platform',
    firestore: {
      rules: require('../../firestore.rules'),
    },
    storage: {
      rules: require('../../storage.rules'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

describe('Firestore Security Rules', () => {
  it('should allow authenticated users to read public documents', async () => {
    const db = testEnv.authenticatedContext('user1').firestore();
    await expect(getDoc(doc(db, 'public', 'test'))).toAllow();
  });

  it('should allow users to read/write their own profile', async () => {
    const db = testEnv.authenticatedContext('user1').firestore();
    const userDoc = doc(db, 'users', 'user1');
    
    await expect(setDoc(userDoc, {
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    })).toAllow();
    
    await expect(getDoc(userDoc)).toAllow();
  });

  it('should deny users from accessing other users profiles', async () => {
    const db = testEnv.authenticatedContext('user1').firestore();
    const otherUserDoc = doc(db, 'users', 'user2');
    
    await expect(getDoc(otherUserDoc)).toDeny();
    await expect(setDoc(otherUserDoc, { displayName: 'Hacked' })).toDeny();
  });

  it('should allow authenticated users to create posts', async () => {
    const db = testEnv.authenticatedContext('user1').firestore();
    const postDoc = doc(db, 'posts', 'post1');
    
    await expect(setDoc(postDoc, {
      ownerId: 'user1',
      title: 'Test Post',
      content: 'Test content',
      createdAt: new Date(),
      updatedAt: new Date()
    })).toAllow();
  });

  it('should deny unauthenticated access to protected collections', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    
    await expect(getDoc(doc(db, 'users', 'user1'))).toDeny();
    await expect(getDoc(doc(db, 'posts', 'post1'))).toDeny();
  });
});

describe('Storage Security Rules', () => {
  it('should allow authenticated users to upload to public folder', async () => {
    const storage = testEnv.authenticatedContext('user1').storage();
    const fileRef = ref(storage, 'public/test.jpg');
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    
    await expect(uploadBytes(fileRef, testFile)).toAllow();
  });

  it('should allow users to upload to their own folder', async () => {
    const storage = testEnv.authenticatedContext('user1').storage();
    const fileRef = ref(storage, 'user_uploads/user1/test.jpg');
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    
    await expect(uploadBytes(fileRef, testFile)).toAllow();
  });

  it('should deny users from uploading to other users folders', async () => {
    const storage = testEnv.authenticatedContext('user1').storage();
    const fileRef = ref(storage, 'user_uploads/user2/test.jpg');
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    
    await expect(uploadBytes(fileRef, testFile)).toDeny();
  });

  it('should deny unauthenticated uploads', async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    const fileRef = ref(storage, 'public/test.jpg');
    const testFile = new Blob(['test'], { type: 'image/jpeg' });
    
    await expect(uploadBytes(fileRef, testFile)).toDeny();
  });
});
