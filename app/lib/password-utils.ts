// lib/password-utils.ts
import bcrypt from 'bcrypt';

export class PasswordUtils {
  /**
   * Hashes a password with bcrypt
   * @param password The plain text password to hash
   * @returns Promise<string> The hashed password
   * @throws Error if hashing fails
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      // If already a bcrypt hash, return as-is
      const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
      if (bcryptRegex.test(password)) {
        return password;
      }
      // Use salt rounds of 12 for better security
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Verify the hash was created correctly
      const testResult = await bcrypt.compare(password, hashedPassword);
      if (!testResult) {
        throw new Error('Hash verification failed');
      }
      
      return hashedPassword;
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compares a plain text password with a bcrypt hash
   * @param password The plain text password to compare
   * @param hash The bcrypt hash to compare against
   * @returns Promise<boolean> True if password matches hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      // Input validation
      if (!password || !hash) {
        console.error('Missing password or hash');
        return false;
      }

      if (typeof password !== 'string' || typeof hash !== 'string') {
        console.error('Invalid input types');
        return false;
      }

      // Validate hash format
      if (!this.isValidHash(hash)) {
        console.error('Invalid hash format');
        return false;
      }

      // Clean the password
      const cleanPassword = password.trim();
      
      // Use bcrypt.compare directly - this is the most reliable method
      const result = await bcrypt.compare(cleanPassword, hash);
      console.log(`bcrypt.compare result: ${result}`);
      
      return result;
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }

  /**
   * Validates if a string is a proper bcrypt hash
   * @param hash The hash to validate
   * @returns boolean True if valid bcrypt hash format
   */
  static isValidHash(hash: string): boolean {
    // Check if it's a valid bcrypt hash format
    const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
    return bcryptRegex.test(hash);
  }

  /**
   * Rehashes a password if current hash uses insufficient salt rounds
   * @param password The plain text password
   * @param currentHash The current bcrypt hash
   * @returns Promise<string | null> New hash if rehash was needed, otherwise null
   */
  static async rehashIfNeeded(password: string, currentHash: string): Promise<string | null> {
    try {
      // Check if current hash uses old/weak salt rounds
      const match = currentHash.match(/^\$2[aby]\$(\d{2})\$/);
      if (!match) return null;
      
      const rounds = parseInt(match[1], 10);
      if (rounds < 12) {
        // Verify password first
        const isValid = await this.comparePassword(password, currentHash);
        if (isValid) {
          return await this.hashPassword(password);
        }
      }
      return null;
    } catch (error) {
      console.error('Rehashing error:', error);
      return null;
    }
  }
}