import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface MatchResult {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
    age: number;
  };
  score: number;
  common: number;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private api = inject(ApiService);

  findMatches(threshold = 75) {
    return this.api.get<MatchResult[]>(`/matches?threshold=${threshold}`);
  }
}
