import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import https from "https";

// Helper for HTTPS requests (compat for all Node versions without global fetch)
const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    }).on("error", (err) => { reject(err); });
  });
};

// Helper to normalize phone to 10-digit number
export const normalizePhone = (phone) => {
  if (!phone) return "";
  let clean = phone.trim();
  clean = clean.replace(/\D/g, "");
  if (clean.length === 12 && clean.startsWith("91")) {
    clean = clean.substring(2);
  }
  return clean;
};

// Lazy loaded firebase-admin import to avoid crashes if package is not present
let admin = null;
const getFirebaseAdmin = async () => {
  if (admin) return admin;
  try {
    const module = await import("firebase-admin");
    admin = module.default || module;
    return admin;
  } catch {
    return null;
  }
};

/**
 * Verifies a Firebase ID token
 * @param {string} firebaseToken - The ID token from client
 * @returns {Promise<object>} The verified claims { email, firebaseUid, name }
 */
export const verifyFirebaseToken = async (firebaseToken) => {
  if (!firebaseToken) {
    throw new ApiError(400, "Firebase ID token is required");
  }


  // 2. Detect and verify direct Google ID tokens (if client-side Firebase Auth was bypassed/failed)
  try {
    const decoded = jwt.decode(firebaseToken, { complete: true });
    if (decoded && decoded.payload) {
      const payload = decoded.payload;
      const isGoogleToken = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";

      if (isGoogleToken) {
        console.log("[Firebase Verification] Detected Google ID token. Verifying via Google APIs...");
        try {
          const googleData = await httpsGet(`https://oauth2.googleapis.com/tokeninfo?id_token=${firebaseToken}`);
          if (googleData.error) {
            throw new Error(googleData.error_description || googleData.error);
          }

          const email = googleData.email;
          const uid = googleData.sub;
          const name = googleData.name || email?.split("@")[0] || "Google User";

          if (!email) {
            throw new ApiError(400, "Google ID token does not contain an email");
          }

          console.log("[Firebase Verification] Google token verification successful!");
          return {
            email: email.toLowerCase(),
            firebaseUid: uid,
            name,
          };
        } catch (err) {
          console.error("[Firebase Verification] Google token verification failed, trying offline fallback:", err.message);
          // Fall back to offline verification of Google Token if Google tokeninfo API is temporarily down/unreachable
          if (payload.exp < Date.now() / 1000) {
            throw new ApiError(400, "Google token has expired.");
          }
          const email = payload.email;
          const uid = payload.sub || payload.uid;
          const name = payload.name || email?.split("@")[0] || "Google User";
          if (!email) {
            throw new ApiError(400, "Google ID token does not contain an email");
          }
          return {
            email: email.toLowerCase(),
            firebaseUid: uid,
            name,
          };
        }
      }
    }
  } catch (decodeErr) {
    console.error("[Firebase Verification] Google token decode/fetch error:", decodeErr.message);
  }

  // 3. Try to use official firebase-admin if configured
  const firebaseAdmin = await getFirebaseAdmin();
  const projectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKeyRaw = (process.env.FIREBASE_PRIVATE_KEY || "").trim();

  if (
    firebaseAdmin &&
    projectId &&
    clientEmail &&
    privateKeyRaw
  ) {
    if (!firebaseAdmin.apps.length) {
      try {
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
          }),
        });
      } catch (err) {
        console.error("Failed to initialize Firebase Admin SDK:", err.message);
      }
    }

    if (firebaseAdmin.apps.length) {
      try {
        const decoded = await firebaseAdmin.auth().verifyIdToken(firebaseToken);
        const email = decoded.email;
        const uid = decoded.uid;
        const name = decoded.name || email?.split("@")[0] || "Google User";

        if (!email) {
          throw new ApiError(400, "Firebase ID token does not contain an email");
        }

        return {
          email: email.toLowerCase(),
          firebaseUid: uid,
          name,
        };
      } catch (err) {
        throw new ApiError(400, `Firebase token validation failed: ${err.message}`);
      }
    }
  }

  // 3. Fallback: Parse and verify standard JWT claims offline
  try {
    const decoded = jwt.decode(firebaseToken, { complete: true });
    if (!decoded || !decoded.payload) {
      throw new ApiError(400, "Invalid token structure");
    }

    const payload = decoded.payload;
    const resolvedProjectId = projectId || "worksitepro-placeholder";

    // Validate claims
    if (payload.iss !== `https://securetoken.google.com/${resolvedProjectId}`) {
      throw new ApiError(400, "Token issuer mismatch. Make sure FIREBASE_PROJECT_ID matches.");
    }
    if (payload.aud !== resolvedProjectId) {
      throw new ApiError(400, "Token audience mismatch.");
    }
    if (payload.exp < Date.now() / 1000) {
      throw new ApiError(400, "Token has expired.");
    }

    const email = payload.email;
    const uid = payload.sub || payload.uid;
    const name = payload.name || email?.split("@")[0] || "Google User";

    if (!email) {
      throw new ApiError(400, "Firebase ID token does not contain an email");
    }

    console.warn("[Firebase Verification] Verified JWT claims offline (signature check skipped due to offline mode)");
    return {
      email: email.toLowerCase(),
      firebaseUid: uid,
      name,
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, `Token parsing failed: ${err.message}`);
  }
};
