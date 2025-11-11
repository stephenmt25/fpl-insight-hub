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

export interface PriceChangePrediction {
  playerId: number;
  playerName: string;
  teamName: string;
  position: string;
  currentPrice: number;
  priceChangeDirection: 'rise' | 'fall' | 'stable';
  probability: number;
  transfersIn24h: number;
  transfersOut24h: number;
  transferDelta: number;
  ownership: number;
  form: number;
  reasoning: string[];
  expectedChangeDate: string;
  confidence: 'high' | 'medium' | 'low';
}
