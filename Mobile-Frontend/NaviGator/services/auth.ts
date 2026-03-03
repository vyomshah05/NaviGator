// services/auth.ts
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authService = {
  // Sign up new user
  async signup(data: SignupData): Promise<User> {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      return userCredential.user;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Sign in existing user
  async signin(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Signin error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  // Sign out
  async signout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Signout error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Get ID token for API calls
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  },

  // User-friendly error messages
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  },
};