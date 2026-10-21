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
export interface RegisterData {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  photo: string;
}

export interface Movie {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
}

export interface CatalogMovie {
  _id?: string;
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string;
  releaseDate: string;
  voteAverage: number;
  addedBy?: string;
}

export interface MatchResult {
  user: Pick<AppUser, 'id' | 'firstName' | 'lastName' | 'photo' | 'age'>;
  score: number;
  common: number;
}
