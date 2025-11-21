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

  // Initialize centroids deterministically by picking points closest to "ideal" cluster profiles
  // This ensures we target: Template (High Form/High Own), High Value (High Form/Mid Own), 
  // Differentials (High Form/Low Own), and Avoid (Low Form)

  // Ideal profiles [Form, Ownership] (normalized 0-1)
  // Note: We only care about the first two dimensions for seeding
  const targetProfiles = [
    [0.9, 0.9],  // Template: High Form, High Ownership
    [0.9, 0.4],  // High Value: High Form, Mid Ownership
    [0.9, 0.05], // Differential: High Form, Low Ownership
    [0.2, 0.1]   // Avoid: Low Form, Low Ownership
  ];

  let centroids: number[][] = [];
  const usedIndices = new Set<number>();

  // For each target profile, find the closest actual data point
  for (let i = 0; i < k; i++) {
    // If we have more clusters than profiles, default to the sorting method for the remainder
    if (i >= targetProfiles.length) {
      // Fallback: pick remaining based on form sorting
      const sortedIndices = normalizedData
        .map((_, idx) => idx)
        .sort((a, b) => normalizedData[b][0] - normalizedData[a][0]);

      let idx = 0;
      while (usedIndices.has(sortedIndices[idx]) && idx < sortedIndices.length) idx++;

      if (idx < sortedIndices.length) {
        usedIndices.add(sortedIndices[idx]);
        centroids.push([...normalizedData[sortedIndices[idx]]]);
      }
      continue;
    }

    const target = targetProfiles[i];
    let bestDist = Infinity;
    let bestIdx = -1;

    for (let j = 0; j < n; j++) {
      if (usedIndices.has(j)) continue;

      // Calculate distance based only on Form (0) and Ownership (1)
      const dist = Math.sqrt(
        Math.pow(normalizedData[j][0] - target[0], 2) +
        Math.pow(normalizedData[j][1] - target[1], 2)
      );

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }

    if (bestIdx !== -1) {
      usedIndices.add(bestIdx);
      centroids.push([...normalizedData[bestIdx]]);
    } else {
      // Fallback if we somehow run out of points (unlikely)
      centroids.push([...normalizedData[0]]);
    }
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

    if (avgForm > 7.0) {
      if (avgOwnership < 25) label = 'Differentials';
      else if (avgOwnership > 45) label = 'Template Picks';
      else label = 'High Value';
    } else if (avgForm < 4.0) {
      if (avgOwnership > 15) label = 'Underperforming';
      else label = 'Avoid';
    } else {
      // Form 4.0 - 7.0
      if (avgOwnership > 20) label = 'Consistent Returns';
      else label = 'Mid-tier Options';
    }

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
