const crypto = require("crypto");

// 6-digit numeric verification code using crypto-grade randomness
function generateVerificationCode() {
  // 0..999999 inclusive, zero-padded to 6 digits
  const num = crypto.randomInt(0, 1_000_000);
  return num.toString().padStart(6, "0");
}

// URL-safe password reset token (raw value to email the user)
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

// SHA-256 hash of a token (stored in DB so DB leaks can't reset accounts)
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Sanitize free-text user input before injecting into an AI prompt.
// Strips control chars, template-breaking chars, and clamps length.
function sanitizeForPrompt(input, maxLength = 500) {
  if (input == null) return "";
  let out = "";
  const src = String(input);
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i);
    const ch = src[i];
    // Skip control characters (0x00-0x1F and DEL 0x7F)
    if (code < 32 || code === 127) {
      out += " ";
      continue;
    }
    // Strip template/JSON-breaking chars
    if (ch === "`" || ch === "{" || ch === "}") continue;
    out += ch;
  }
  out = out.trim();
  return out.length > maxLength ? out.slice(0, maxLength) : out;
}

// Sanitize an array of free-text items
function sanitizeArrayForPrompt(arr, maxItems = 20, maxLengthEach = 80) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((v) => sanitizeForPrompt(v, maxLengthEach))
    .filter(Boolean);
}

module.exports = {
  generateVerificationCode,
  generateResetToken,
  hashToken,
  sanitizeForPrompt,
  sanitizeArrayForPrompt,
};
