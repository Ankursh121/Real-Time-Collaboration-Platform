import { auth, isConfigured } from "./firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { Platform } from "react-native";

/**
 * Authenticates the user with Google.
 * If Firebase is configured and running on Web, uses Google Sign-In with popup.
 * Otherwise, falls back to a mock login prompt.
 * @returns {Promise<{ idToken: string, email: string, name: string }>}
 */
export const signInWithGoogle = async (customEmail = null) => {
  if (isConfigured && auth && Platform.OS === "web") {
    console.log("[Firebase Real Auth] Initiating Google Sign-In");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      console.log("[Firebase Real Auth] Google Sign-In successful!");
      return {
        idToken,
        email: user.email,
        name: user.displayName,
      };
    } catch (error) {
      console.error("[Firebase Real Auth] Google Sign-In failed:", error);
      throw error;
    }
  }

  // Fallback Mock Mode: Ask for a mock email on Web, or return a default
  console.log("[Firebase Mock Auth] Simulating Google Sign-In in offline/fallback mode");
  
  let mockEmail = customEmail || "testowner@example.com";
  if (Platform.OS === "web" && !customEmail) {
    const enteredEmail = window.prompt(
      "Enter mock Google email for development/testing:",
      "testowner@example.com"
    );
    if (enteredEmail === null) {
      throw new Error("Mock Google login cancelled by user.");
    }
    if (enteredEmail.trim() !== "") {
      mockEmail = enteredEmail.trim();
    }
  }

  const mockName = mockEmail.split("@")[0];
  const mockToken = `mock-google-token-${mockEmail}`;
  
  console.log(`[Firebase Mock Auth] Logged in as: ${mockEmail}`);
  return {
    idToken: mockToken,
    email: mockEmail,
    name: mockName,
  };
};

/**
 * Authenticates the user with Email and Password using Firebase.
 * @returns {Promise<{ idToken: string, email: string, name: string }>}
 */
export const authenticateWithEmailAndPassword = async (email, password, isRegister = false) => {
  if (isConfigured && auth) {
    console.log(`[Firebase Real Auth] Initiating Email/Password ${isRegister ? "Registration" : "Login"}`);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      
      console.log("[Firebase Real Auth] Email/Password Auth successful!");
      return {
        idToken,
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
      };
    } catch (error) {
      console.error("[Firebase Real Auth] Email/Password Auth failed:", error);
      throw error;
    }
  }

  // Fallback Mock Mode
  console.log("[Firebase Mock Auth] Simulating Email/Password Auth in offline/fallback mode");
  const mockName = email.split("@")[0];
  const mockToken = `mock-firebase-token-${email}`;
  
  return {
    idToken: mockToken,
    email: email,
    name: mockName,
  };
};
