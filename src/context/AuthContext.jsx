import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { signInWithEmail, logOut } from '../firebase/auth'
import { AuthContext } from './authContextObject' // Import AuthContext from its new dedicated file

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null)
  const [role,     setRole]     = useState(null)
  const [clientId, setClientId] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthContext - onAuthStateChanged: firebaseUser", firebaseUser); // Depuración: Verifica si Firebase detecta un usuario
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            const data = snap.data()
            console.log("AuthContext - Firestore user data:", data); // Depuración: Verifica los datos del usuario en Firestore
            setUser(firebaseUser)
            setRole((data.role ?? '').trim() || null)
            setClientId((data.clientId ?? '').trim() || null)
          } else {
            console.warn("AuthContext - Documento de usuario no encontrado en Firestore para UID:", firebaseUser.uid); // Depuración
            // Si el documento de usuario no existe en Firestore, el usuario no está completamente configurado en la aplicación.
            // Aunque Firebase lo autentique, la aplicación no tiene su rol/clientId.
            // Establecemos user, pero role y clientId a null, para que ProtectedRoute lo maneje y posiblemente redirija.
            setUser(firebaseUser)
            setRole(null)
            setClientId(null)
          }
        } catch (firestoreError) {
          console.error("AuthContext - Error fetching user data from Firestore:", firestoreError); // Depuración
          // En caso de error al obtener datos de Firestore, tratamos al usuario como no autorizado por la aplicación.
          // Aunque Firebase lo autentique, no podemos determinar su rol/clientId.
          // Esto podría ocurrir por reglas de seguridad de Firestore o problemas de conexión.
          setUser(firebaseUser)
          setRole(null)
          setClientId(null)
        }
      } else {
        console.log("AuthContext - No user logged in."); // Depuración: Confirma que no hay usuario autenticado
        // Limpiar todos los estados si no hay usuario autenticado.
        // Esto es importante para asegurar que no queden datos de una sesión anterior.
        setUser(null)
        setRole(null)
        setClientId(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, clientId, loading, signIn: signInWithEmail, signOut: logOut }}>
      {children}
    </AuthContext.Provider>
  )
}
