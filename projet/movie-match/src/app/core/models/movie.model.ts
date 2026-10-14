export interface Movie {
  id: number;          // tmdbId
  title: string;
  overview: string;
  posterPath: string;
  releaseDate: string;
  voteAverage: number;
  addedBy: string;     // uid admin ou 'system'
  addedAt: number;
}
