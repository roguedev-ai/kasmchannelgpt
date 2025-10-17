import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generatePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  
  // Ensure at least one character from each category
  const lowercase = charset.match(/[a-z]/)![0];  // lowercase
  const uppercase = charset.match(/[A-Z]/)![0];  // uppercase
  const number = charset.match(/[0-9]/)![0];  // number
  const special = charset.match(/[!@#$%^&*()_+]/)![0];  // special char
  
  password = lowercase + uppercase + number + special;
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
