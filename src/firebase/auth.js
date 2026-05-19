import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, firebaseConfig } from './config';

export async function signInWithEmail(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logOut() {
  await signOut(auth);
}

export async function createAuthUser(email, password) {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary_${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    return userCredential.user
  } finally {
    await deleteApp(secondaryApp)
  }
}

export async function sendResetEmail(email) {
  await sendPasswordResetEmail(auth, email)
}

// Cambia la contraseña de otro usuario autenticándose como él en una app secundaria
export async function changeAuthUserPassword(email, currentPassword, newPassword) {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary_${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const { user } = await signInWithEmailAndPassword(secondaryAuth, email, currentPassword)
    await updatePassword(user, newPassword)
  } finally {
    await deleteApp(secondaryApp)
  }
}