import { PlayerFeatures, ClusterResult, DifferentialPick } from './types';

/**
 * Normalize features to 0-1 range for K-means clustering
 */
function normalizeFeatures(players: PlayerFeatures[]): number[][] {
  const features = ['form', 'ownership', 'xgPer90', 'xaPer90', 'ictIndex', 'priceValue', 'pointsPerGame'] as const;
  
  const mins: Record<string, number> = {};
  const maxs: Record<string, number> = {};
  
  features.forEach(feature => {
    const values = players.map(p => p[feature]);
    mins[feature] = Math.min(...values);
    maxs[feature] = Math.max(...values);
  });
  
  return players.map(player => 
    features.map(feature => {
      const value = player[feature];
      const min = mins[feature];
      const max = maxs[feature];
      return max === min ? 0 : (value - min) / (max - min);
    })
  );
}

/**
 * Calculate Euclidean distance between two points
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}

/**
 * K-means clustering algorithm
 */
export function kMeansClustering(
  players: PlayerFeatures[],
  k: number = 4,
  maxIterations: number = 100
): ClusterResult[] {
  if (players.length === 0) return [];
  
  const normalizedData = normalizeFeatures(players);
  const n = normalizedData.length;
  const dimensions = normalizedData[0].length;
  
  // Initialize centroids randomly
  let centroids: number[][] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < k; i++) {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * n);
    } while (usedIndices.has(randomIndex));
    
    usedIndices.add(randomIndex);
    centroids.push([...normalizedData[randomIndex]]);
  }
  
  let assignments = new Array(n).fill(0);
  let iterations = 0;
  let converged = false;
  
  while (!converged && iterations < maxIterations) {
    // Assign points to nearest centroid
    const newAssignments = normalizedData.map(point => {
      const distances = centroids.map(centroid => euclideanDistance(point, centroid));
      return distances.indexOf(Math.min(...distances));
    });
    
    // Check for convergence
    converged = newAssignments.every((val, i) => val === assignments[i]);
    assignments = newAssignments;
    
    if (!converged) {
      // Update centroids
      centroids = centroids.map((_, clusterIdx) => {
        const clusterPoints = normalizedData.filter((_, i) => assignments[i] === clusterIdx);
        
        if (clusterPoints.length === 0) return centroids[clusterIdx];
        
        return Array.from({ length: dimensions }, (_, dim) => {
          const sum = clusterPoints.reduce((acc, point) => acc + point[dim], 0);
          return sum / clusterPoints.length;
        });
      });
    }
    
    iterations++;
  }
  
  // Calculate confidence scores (inverse of distance to centroid)
  return players.map((player, i) => {
    const clusterIdx = assignments[i];
    const distance = euclideanDistance(normalizedData[i], centroids[clusterIdx]);
    const confidenceScore = Math.max(0, Math.min(100, (1 - distance) * 100));
    
    return {
      playerId: player.playerId,
      name: player.name,
      teamName: player.teamName,
      cluster: clusterIdx,
      features: player,
      confidenceScore: Math.round(confidenceScore)
    };
  });
}

/**
 * Identify differential picks from clustered players
 * Differentials are high-performing, low-ownership players
 */
export function identifyDifferentials(
  clusteredPlayers: ClusterResult[],
  ownershipThreshold: number = 35,
  formThreshold: number = 5.0
): DifferentialPick[] {
  const differentials = clusteredPlayers
    .filter(p => 
      p.features.ownership < ownershipThreshold &&
      p.features.form > formThreshold
    )
    .map(player => {
      const reasoning: string[] = [];
      
      // Form analysis
      if (player.features.form > 6.5) {
        reasoning.push('Excellent form');
      } else if (player.features.form > 5.5) {
        reasoning.push('Good form');
      }
      
      // xG/xA analysis
      if (player.features.xgPer90 > 0.5) {
        reasoning.push('High xG per 90');
      }
      if (player.features.xaPer90 > 0.3) {
        reasoning.push('High xA per 90');
      }
      
      // ICT analysis
      if (player.features.ictIndex > 10) {
        reasoning.push('High ICT index');
      }
      
      // Price value
      if (player.features.priceValue > 7) {
        reasoning.push('Great value for price');
      }
      
      // Ownership differential
      if (player.features.ownership < 10) {
        reasoning.push('Very low ownership');
      } else if (player.features.ownership < 20) {
        reasoning.push('Low ownership');
      }
      
      return {
        ...player,
        reasoning
      };
    })
    .sort((a, b) => {
      // Sort by combination of form and confidence
      const scoreA = a.features.form * (a.confidenceScore / 100);
      const scoreB = b.features.form * (b.confidenceScore / 100);
      return scoreB - scoreA;
    });
  
  return differentials;
}

/**
 * Get cluster statistics for visualization
 */
export function getClusterStats(clusteredPlayers: ClusterResult[]) {
  const clusters = [...new Set(clusteredPlayers.map(p => p.cluster))];
  
  return clusters.map(clusterIdx => {
    const clusterPlayers = clusteredPlayers.filter(p => p.cluster === clusterIdx);
    
    const avgForm = clusterPlayers.reduce((sum, p) => sum + p.features.form, 0) / clusterPlayers.length;
    const avgOwnership = clusterPlayers.reduce((sum, p) => sum + p.features.ownership, 0) / clusterPlayers.length;
    const avgIct = clusterPlayers.reduce((sum, p) => sum + p.features.ictIndex, 0) / clusterPlayers.length;
    
    let label = 'Unknown';
    if (avgForm > 5 && avgOwnership < 25) label = 'Differentials';
    else if (avgForm > 5 && avgOwnership > 50) label = 'Template Picks';
    else if (avgForm < 3) label = 'Avoid';
    else label = 'Mid-tier Options';
    
    return {
      cluster: clusterIdx,
      count: clusterPlayers.length,
      avgForm: avgForm.toFixed(2),
      avgOwnership: avgOwnership.toFixed(1),
      avgIct: avgIct.toFixed(1),
      label
    };
  });
}
