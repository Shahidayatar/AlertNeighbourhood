export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // hashed
  createdAt: Date;
  isAdmin?: boolean;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  isAdmin?: boolean;
}

export function sanitizeUser(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin,
  };
}
