import "server-only";

import crypto from "crypto";

// Token encryption utilities
const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.ADS_TOKEN_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error("ADS_TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  
  if (key.length !== 32) {
    throw new Error("ADS_TOKEN_ENCRYPTION_KEY must be exactly 32 characters");
  }
  
  return Buffer.from(key, "utf8");
}

/**
 * Encrypt sensitive token
 */
export function encryptToken(token: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypt token
 */
export function decryptToken(
  encryptedToken: string,
  iv: string,
  authTag: string
): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(iv, "hex")
  );
  
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  
  let decrypted = decipher.update(encryptedToken, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Encrypt token for storage (format: encrypted:authTag)
 */
export function encryptTokenForStorage(token: string): {
  encryptedData: string;
  iv: string;
} {
  const { encrypted, iv, authTag } = encryptToken(token);
  return {
    encryptedData: `${encrypted}:${authTag}`,
    iv,
  };
}

/**
 * Decrypt token from storage format
 */
export function decryptTokenFromStorage(
  encryptedData: string,
  iv: string
): string {
  const [encrypted, authTag] = encryptedData.split(":");
  
  if (!encrypted || !authTag) {
    throw new Error("Invalid encrypted data format");
  }
  
  return decryptToken(encrypted, iv, authTag);
}

