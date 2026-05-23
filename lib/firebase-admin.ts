/**
 * Firebase Admin SDK Configuration
 * For server-side operations (API routes, background jobs)
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminDb: Firestore;
let adminStorage: Storage;

/**
 * Initialize Firebase Admin SDK
 */
export function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      try {
        let serviceAccount;

        // Load directly from JSON file (development)
        const fs = require('fs');
        const path = require('path');
        const serviceAccountPath = path.join(process.cwd(), 'cricket-analysis-7761c-firebase-adminsdk-fbsvc-1b0aae5938.json');

        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          console.log('✅ Loaded service account from JSON file');
        } else {
          // Fall back to environment variable (for production deployment)
          const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
          if (serviceAccountKey) {
            try {
              const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
              serviceAccount = JSON.parse(decoded);
              console.log('✅ Loaded service account from environment variable');
            } catch (error) {
              throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ' + error);
            }
          } else {
            throw new Error(
              'Firebase service account not found.\n' +
              'Please ensure cricket-analysis-7761c-firebase-adminsdk-fbsvc-1b0aae5938.json exists in project root\n' +
              'Or set FIREBASE_SERVICE_ACCOUNT_KEY environment variable'
            );
          }
        }

        // Validate required fields
        if (!serviceAccount.client_email) {
          throw new Error('Service account is missing client_email field');
        }
        if (!serviceAccount.private_key) {
          throw new Error('Service account is missing private_key field');
        }

        adminApp = initializeApp({
          credential: cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });

        console.log('✅ Firebase Admin initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
        throw error;
      }
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

/**
 * Get Firestore Admin instance
 */
export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp());
    try {
      adminDb.settings({ ignoreUndefinedProperties: true });
    } catch (error) {
      // Settings already applied (happens during hot-reload in development)
    }
  }
  return adminDb;
}

/**
 * Get Storage Admin instance
 */
export function getAdminStorage(): Storage {
  if (!adminStorage) {
    adminStorage = getStorage(getAdminApp());
  }
  return adminStorage;
}

// Export initialized instances
export { adminApp, adminDb, adminStorage };
