import * as bcrypt from 'bcryptjs';

export class PasswordHelper {

  static async hashPassword(password: string, saltRounds: number = 10): Promise<string> {
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Error when hash password: ${error.message}`);
    }
  }


  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error(`Error when compare password: ${error.message}`);
    }
  }
} 