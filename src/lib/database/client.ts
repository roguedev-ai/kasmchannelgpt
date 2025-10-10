import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';

const DB_PATH = process.env.DATABASE_PATH || './data/rag-platform.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

interface User {
  id: number;
  partner_id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'partner';
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  metadata: string | null;
}

interface CreateUserParams {
  partnerId: string;
  email: string;
  password: string;
  role: 'admin' | 'partner';
  displayName?: string;
}

class DatabaseClient {
  private db: Database.Database;
  
  constructor() {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize database
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    
    console.log(`[Database] Connected to: ${DB_PATH}`);
    
    // Initialize schema
    this.initializeSchema();
    
    // Create default admin if none exists
    this.ensureDefaultAdmin();
  }
  
  private initializeSchema(): void {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    this.db.exec(schema);
    console.log('[Database] Schema initialized');
  }
  
  private async ensureDefaultAdmin(): Promise<void> {
    const adminExists = this.db
      .prepare('SELECT COUNT(*) as count FROM users WHERE role = ?')
      .get('admin') as { count: number };
    
    if (adminExists.count === 0) {
      console.log('[Database] Creating default admin user');
      
      await this.createUser({
        partnerId: 'admin',
        email: 'admin@rag-platform.local',
        password: 'admin123', // CHANGE THIS IN PRODUCTION!
        role: 'admin',
        displayName: 'System Administrator',
      });
      
      console.log('[Database] Default admin created:');
      console.log('  Email: admin@rag-platform.local');
      console.log('  Password: admin123');
      console.log('  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    }
  }
  
  /**
   * Create a new user
   */
  async createUser(params: CreateUserParams): Promise<User> {
    const { partnerId, email, password, role, displayName } = params;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const stmt = this.db.prepare(`
      INSERT INTO users (partner_id, email, password_hash, role, display_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(partnerId, email, passwordHash, role, displayName || null);
    
    console.log(`[Database] Created user: ${email} (${role})`);
    
    return this.getUserById(result.lastInsertRowid as number)!;
  }
  
  /**
   * Authenticate a user
   */
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = this.db
      .prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
      .get(email) as User | undefined;
    
    if (!user) {
      return null;
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return null;
    }
    
    // Update last login
    this.db
      .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
      .run(user.id);
    
    console.log(`[Database] Authenticated user: ${email}`);
    
    return user;
  }
  
  /**
   * Get user by ID
   */
  getUserById(id: number): User | null {
    return this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as User | null;
  }
  
  /**
   * Get user by partner ID
   */
  getUserByPartnerId(partnerId: string): User | null {
    return this.db
      .prepare('SELECT * FROM users WHERE partner_id = ?')
      .get(partnerId) as User | null;
  }
  
  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | null {
    return this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as User | null;
  }
  
  /**
   * List all users (admin only)
   */
  listUsers(role?: 'admin' | 'partner'): User[] {
    if (role) {
      return this.db
        .prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC')
        .all(role) as User[];
    }
    
    return this.db
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all() as User[];
  }
  
  /**
   * Update user password
   */
  async updatePassword(userId: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    this.db
      .prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(passwordHash, userId);
    
    console.log(`[Database] Updated password for user ID: ${userId}`);
  }
  
  /**
   * Deactivate user
   */
  deactivateUser(userId: number): void {
    this.db
      .prepare('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(userId);
    
    console.log(`[Database] Deactivated user ID: ${userId}`);
  }
  
  /**
   * Log audit event
   */
  logAudit(userId: number | null, action: string, resource?: string, details?: any, ipAddress?: string): void {
    this.db
      .prepare(`
        INSERT INTO audit_log (user_id, action, resource, details, ip_address)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        userId,
        action,
        resource || null,
        details ? JSON.stringify(details) : null,
        ipAddress || null
      );
  }
  
  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    console.log('[Database] Connection closed');
  }
}

// Singleton instance
export const db = new DatabaseClient();

// Export types
export type { User, CreateUserParams };
