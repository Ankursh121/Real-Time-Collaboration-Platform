import "dotenv/config";

const rawKeyId = process.env.RAZORPAY_KEY_ID || "";
const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

console.log("Raw Key ID Length:", rawKeyId.length);
console.log("Raw Key ID Char Codes:", Array.from(rawKeyId).map(c => c.charCodeAt(0)));

console.log("Raw Key Secret Length:", rawKeySecret.length);
console.log("Raw Key Secret Char Codes:", Array.from(rawKeySecret).map(c => c.charCodeAt(0)));

const keyId = rawKeyId.trim();
const keySecret = rawKeySecret.trim();

console.log("Trimmed Key ID Length:", keyId.length);
console.log("Trimmed Key ID Char Codes:", Array.from(keyId).map(c => c.charCodeAt(0)));

console.log("Trimmed Key Secret Length:", keySecret.length);
console.log("Trimmed Key Secret Char Codes:", Array.from(keySecret).map(c => c.charCodeAt(0)));
