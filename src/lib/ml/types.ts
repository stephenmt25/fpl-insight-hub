export interface PlayerFeatures {
  playerId: number;
  name: string;
  teamName: string | null;
  form: number;
  ownership: number;
  xgPer90: number;
  xaPer90: number;
  ictIndex: number;
  priceValue: number;
  pointsPerGame: number;
}

export interface ClusterResult {
  playerId: number;
  name: string;
  teamName: string | null;
  cluster: number;
  features: PlayerFeatures;
  confidenceScore: number;
}

export interface DifferentialPick extends ClusterResult {
  reasoning: string[];
}
