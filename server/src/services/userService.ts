import { User } from '../models/User';
import bcrypt from 'bcryptjs';

// In-memory user storage (will reset on server restart)
const users: User[] = [];

// Initialize admin user
async function initializeAdmin() {
  const adminExists = users.find(u => u.username === 'shahid');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('shahid', 10);
    const adminUser: User = {
      id: 'admin-1',
      username: 'shahid',
      email: 'shahid@admin.com',
      password: hashedPassword,
      createdAt: new Date(),
      isAdmin: true,
    };
    users.push(adminUser);
    console.log('✅ Admin user created: shahid / shahid');
  }
}

// Call initialization
initializeAdmin();

export function getAllUsers(): User[] {
  return users;
}

export function findUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}

export function findUserByUsername(username: string): User | undefined {
  return users.find(u => u.username === username);
}

export function findUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function createUser(user: User): User {
  users.push(user);
  return user;
}

export function deleteUser(id: string): boolean {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const user = findUserById(id);
  if (!user) return null;
  Object.assign(user, updates);
  return user;
}
