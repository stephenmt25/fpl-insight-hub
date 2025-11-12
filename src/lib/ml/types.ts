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

export interface FormTrendPrediction {
  playerId: number;
  playerName: string;
  teamName: string;
  position: string;
  currentForm: number;
  historicalForm: number[];
  gameweeks: number[];
  predictedForm: {
    gameweek: number;
    predictedPoints: number;
    confidence: number;
  }[];
  trend: 'rising' | 'falling' | 'stable';
  trendStrength: number;
  volatility: number;
  momentum: number;
  reasoning: string[];
  overallConfidence: 'high' | 'medium' | 'low';
}
