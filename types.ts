export interface Player {
  player_actual: number;
  player_name: string;
  player_position: string;
  player_projected: number;
  roster_position: string;
  started: boolean;
}
export interface Competitor {
  name: string;
  players: Player[];
  isHome: boolean;
}
export interface Matchup {
  week: number;
  competitors: Competitor[];
}

export interface Transaction {
  teamName: string;
  action: string;
  playerName: string;
  date: string;
  key: string;
}
