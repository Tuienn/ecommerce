require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());

// Master key must be 32 bytes (256-bit) for AES-256
const masterKey = Buffer.from(process.env.MASTER_KEY, "hex");
const internalKey = process.env.INTERNAL_KEY;

// Encrypt function using AES-256-GCM
function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encryptedData (all in hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString(
    "hex"
  )}`;
}

// Decrypt function using AES-256-GCM
function decrypt(ciphertext, key) {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

// Middleware to verify internal secret
const verifyInternalSecret = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];

  if (!secret || secret !== internalKey) {
    return res
      .status(403)
      .json({ error: "Forbidden: Invalid internal secret" });
  }

  next();
};

// Apply middleware to all routes
app.use(verifyInternalSecret);

// Generate a new key and return both plain and encrypted versions
app.get("/generate-key", (_req, res) => {
  try {
    // Generate a random 256-bit key (32 bytes = 64 hex chars)
    const plainKey = crypto.randomBytes(32).toString("hex");

    // Encrypt the key with masterKey
    const encryptedKey = encrypt(plainKey, masterKey);

    res.json({
      plainKey,
      encryptedKey,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to generate key", details: error.message });
  }
});

app.post("/decrypt-dek", (req, res) => {
  const { encryptedDek } = req.body;

  if (!encryptedDek) {
    return res
      .status(400)
      .json({ error: "Missing encryptedDek in request body" });
  }

  try {
    const decryptedDek = decrypt(encryptedDek, masterKey);

    if (!decryptedDek) {
      throw new Error("Decryption failed");
    }

    res.json({ plainKey: decryptedDek });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to decrypt DEK", details: error.message });
  }
});

const PORT = 8008;
app.listen(PORT, () => console.log(`Key Manager running on port ${PORT}`));
