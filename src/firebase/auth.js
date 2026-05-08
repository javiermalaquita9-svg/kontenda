import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, firebaseConfig } from './config'; // Asegúrate de exportar firebaseConfig en config.js

export async function signInWithEmail(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logOut() {
  await signOut(auth);
}

// Nueva función para crear un usuario en Firebase Authentication
export async function createAuthUser(email, password) {
  // Creamos una instancia secundaria temporal para no afectar la sesión del admin
  const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
  const secondaryAuth = getAuth(secondaryApp);

  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  
  // Cerramos la instancia secundaria inmediatamente después de crear al usuario
  await deleteApp(secondaryApp);
  
  return userCredential.user; // Retorna el objeto User de Firebase
}