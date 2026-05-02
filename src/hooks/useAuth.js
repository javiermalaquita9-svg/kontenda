import { useContext } from 'react';
import { AuthContext } from '../context/authContextObject'; // Import the context object from its new dedicated file

export function useAuth() {
  return useContext(AuthContext);
}