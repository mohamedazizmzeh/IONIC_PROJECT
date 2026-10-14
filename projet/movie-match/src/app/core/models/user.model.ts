export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  photo: string;
  role: 'user' | 'admin';
  active: boolean;
  favorites: number[];
}

export interface AuthResponse {
  token: string;
  user: AppUser;
}
