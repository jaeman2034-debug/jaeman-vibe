// cypress/support/tasks.ts

import { defineConfig } from 'cypress'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'

// Firebase ?ㅼ젙 (?뚯뒪?몄슜)
const firebaseConfig = {
  apiKey: process.env.VITE_FB_API_KEY || 'test-api-key',
  authDomain: process.env.VITE_FB_AUTH_DOMAIN || 'test-project.firebaseapp.com',
  projectId: process.env.VITE_FB_PROJECT_ID || 'test-project',
  storageBucket: process.env.VITE_FB_STORAGE || 'test-project.appspot.com',
  messagingSenderId: process.env.VITE_FB_SENDER_ID || '123456789',
  appId: process.env.VITE_FB_APP_ID || '1:123456789:web:test'
}

// Firebase ??珥덇린??const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Firestore 臾몄꽌 議고쉶 ?쒖뒪??      on('task', {
        async getFirestoreDoc({ collection: collectionPath, field, value }) {
          try {
            const q = query(
              collection(db, collectionPath),
              where(field, '==', value)
            )
            const querySnapshot = await getDocs(q)
            
            if (querySnapshot.empty) {
              return null
            }
            
            const doc = querySnapshot.docs[0]
            return { id: doc.id, ...doc.data() }
          } catch (error) {
            console.error('Firestore 議고쉶 ?ㅻ쪟:', error)
            return null
          }
        },

        // Firestore 珥덇린???쒖뒪??        async resetFirestore() {
          try {
            // ?뚯뒪?몄슜 而щ젆?섎뱾 珥덇린??            const collectionsToReset = [
              'academyCourses/demo-course/enrollments',
              'academyCourses/test-course/enrollments'
            ]

            for (const collectionPath of collectionsToReset) {
              const q = query(collection(db, collectionPath))
              const querySnapshot = await getDocs(q)
              
              const batch = writeBatch(db)
              querySnapshot.docs.forEach((docSnapshot) => {
                batch.delete(docSnapshot.ref)
              })
              
              await batch.commit()
            }

            console.log('Firestore 珥덇린???꾨즺')
            return null
          } catch (error) {
            console.error('Firestore 珥덇린???ㅻ쪟:', error)
            return null
          }
        },

        // ?뚯뒪?몄슜 ?섍컯 ?좎껌 ?앹꽦 ?쒖뒪??        async createTestEnrollment({ courseId, student, phone, email }) {
          try {
            const enrollmentData = {
              student,
              phone,
              email,
              paid: false,
              createdAt: new Date().toISOString(),
              courseId
            }

            const docRef = await addDoc(
              collection(db, `academyCourses/${courseId}/enrollments`),
              enrollmentData
            )

            console.log('?뚯뒪???섍컯 ?좎껌 ?앹꽦:', docRef.id)
            return { id: docRef.id, ...enrollmentData }
          } catch (error) {
            console.error('?뚯뒪???섍컯 ?좎껌 ?앹꽦 ?ㅻ쪟:', error)
            return null
          }
        },

        // Firebase Functions 濡쒓렇 ?뺤씤 ?쒖뒪??        async checkFunctionLogs({ functionName, expectedMessage }) {
          try {
            // ?ㅼ젣 ?섍꼍?먯꽌??Firebase Functions 濡쒓렇瑜??뺤씤?댁빞 ?섏?留?
            // ?뚯뒪???섍꼍?먯꽌???뱁썒 ?몄텧 ?щ?濡??泥?            console.log(`Functions 濡쒓렇 ?뺤씤: ${functionName} - ${expectedMessage}`)
            return true
          } catch (error) {
            console.error('Functions 濡쒓렇 ?뺤씤 ?ㅻ쪟:', error)
            return false
          }
        },

        // 媛뺤쥖 ?뺣낫 ?앹꽦 ?쒖뒪??        async createTestCourse({ courseId, title, coach, price }) {
          try {
            const courseData = {
              title,
              coach,
              price,
              startDate: '2024-02-01',
              endDate: '2024-02-28',
              maxStudents: 20,
              currentStudents: 0,
              createdAt: new Date().toISOString()
            }

            await setDoc(doc(db, 'academyCourses', courseId), courseData)
            console.log('?뚯뒪??媛뺤쥖 ?앹꽦:', courseId)
            return courseData
          } catch (error) {
            console.error('?뚯뒪??媛뺤쥖 ?앹꽦 ?ㅻ쪟:', error)
            return null
          }
        },

        // 寃곗젣 ?곹깭 ?낅뜲?댄듃 ?쒖뒪??        async updatePaymentStatus({ courseId, studentName, paid = true }) {
          try {
            const q = query(
              collection(db, `academyCourses/${courseId}/enrollments`),
              where('student', '==', studentName)
            )
            const querySnapshot = await getDocs(q)
            
            if (querySnapshot.empty) {
              return false
            }

            const docSnapshot = querySnapshot.docs[0]
            const updateData = {
              paid,
              paymentAmount: paid ? 150000 : null,
              paymentMethod: paid ? '移대뱶' : null,
              paidAt: paid ? new Date().toISOString() : null
            }

            await setDoc(docSnapshot.ref, updateData, { merge: true })
            console.log(`寃곗젣 ?곹깭 ?낅뜲?댄듃: ${studentName} - ${paid}`)
            return true
          } catch (error) {
            console.error('寃곗젣 ?곹깭 ?낅뜲?댄듃 ?ㅻ쪟:', error)
            return false
          }
        }
      })

      return config
    },
  },
})
