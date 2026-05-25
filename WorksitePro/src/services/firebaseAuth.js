import { auth, isConfigured } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from "firebase/auth";
import { Platform } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Initialize Google Sign-In configuration for native platforms
if (Platform.OS !== "web") {
  try {
    GoogleSignin.configure({
      webClientId: "319787442541-c89jrk04vkl1o77i21do3gcro83sfooi.apps.googleusercontent.com",
      offlineAccess: true,
    });
  } catch (error) {
    console.error("[Google Auth] Error configuring Google Sign-In:", error);
  }
}

/**
 * Authenticates the user with Google.
 * On Native (Android/iOS), uses the Google Play Services SDK to display the native account picker.
 * On Web, uses Google Sign-In with popup.
 * @returns {Promise<{ idToken: string, email: string, name: string }>}
 */
export const signInWithGoogle = async () => {
  if (Platform.OS === "web") {
    if (isConfigured && auth) {
      console.log("[Firebase Real Auth] Initiating Web Google Sign-In");
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

    throw new Error("Firebase Authentication is not configured on this web application.");
  }

  // Native Mobile Flow (Android & iOS)
  console.log("[Google Auth] Initiating Native Google Sign-In");
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    
    // Support both older and newer versions of the library return structures
    const idToken = signInResult.data?.idToken || signInResult.idToken;
    const email = signInResult.data?.user?.email || signInResult.user?.email;
    const name = signInResult.data?.user?.name || signInResult.user?.name;

    if (!idToken) {
      throw new Error("Could not retrieve ID token from Google Sign-In.");
    }

    if (isConfigured && auth) {
      try {
        console.log("[Google Auth] Authenticating with Firebase Auth using Google Credential");
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;
        const firebaseIdToken = await firebaseUser.getIdToken();

        console.log("[Google Auth] Firebase verification successful!");
        return {
          idToken: firebaseIdToken,
          email: firebaseUser.email,
          name: firebaseUser.displayName || name || firebaseUser.email.split("@")[0],
        };
      } catch (fbError) {
        console.warn("[Google Auth] Native Firebase Auth failed. Falling back to direct Google Token.", fbError.message);
        return {
          idToken,
          email,
          name,
        };
      }
    }

    // Offline / unconfigured Firebase fallback: Return the Google ID token directly
    console.log("[Google Auth] Firebase not configured on client. Returning Google Token.");
    return {
      idToken,
      email,
      name,
    };
  } catch (error) {
    console.error("[Google Auth] Native Google Sign-In error:", error);
    throw error;
  }
};
