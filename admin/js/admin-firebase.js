/**
 * admin-firebase.js — ISOLATED Firebase context for the admin panel.
 *
 * Creates a SECONDARY Firebase app (name: 'admin') with its own Auth and
 * Firestore instances. Benefits over sharing the default app with the
 * public study site:
 *   - Separate persisted session bucket ("[admin]" storage keys) → the
 *     learner site can never see or inherit the admin login, and vice-versa.
 *   - No cross-tab auth-state broadcasting between the two surfaces.
 *   - Signing out on the public site cannot terminate the admin session,
 *     and admin sign-in does not sign the learner site in.
 *
 * The secondary app points at the SAME Firebase project, so the
 * email/password account created in Authentication → Users works here and
 * Firestore rules evaluate identically.
 */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from '../../assets/js/firebase-config.js';

export const adminApp = getApps().find(a => a.name === 'admin')
    ?? initializeApp(firebaseConfig, 'admin');

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
