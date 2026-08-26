// src/index.ts
// GPS Clustering Engine — Group points by proximity with capacity constraints

export interface Point {
  id: string;
  lat: number;
  lng: number;
  passengers?: number;
}

export interface ClusterOptions {
  maxDistanceKm?: number;
  maxPerCluster?: number;
}

export interface Cluster {
  points: Point[];
  totalPassengers: number;
  center: { lat: number; lng: number };
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate Haversine distance between two GPS points.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) ** 2;
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

/**
 * Group GPS points by proximity, respecting capacity constraints.
 * Uses greedy clustering: for each unassigned point, find nearest neighbors.
 */
export function clusterByProximity(
  points: Point[],
  options: ClusterOptions = {}
): Cluster[] {
  const {
    maxDistanceKm = 5,
    maxPerCluster = 14,
  } = options;

  if (points.length === 0) return [];

  const assigned = new Set<string>();
  const clusters: Cluster[] = [];

  for (const point of points) {
    if (assigned.has(point.id)) continue;

    const clusterPoints: Point[] = [point];
    let totalPassengers = point.passengers ?? 1;
    assigned.add(point.id);

    // Find all unassigned points within maxDistanceKm
    const neighbors = points
      .filter(p => !assigned.has(p.id))
      .map(p => ({
        point: p,
        distance: haversineDistance(point.lat, point.lng, p.lat, p.lng),
      }))
      .filter(n => n.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance);

    for (const neighbor of neighbors) {
      const neighborPassengers = neighbor.point.passengers ?? 1;
      if (totalPassengers + neighborPassengers > maxPerCluster) continue;
      
      clusterPoints.push(neighbor.point);
      totalPassengers += neighborPassengers;
      assigned.add(neighbor.point.id);
    }

    // Calculate center
    const centerLat = clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length;
    const centerLng = clusterPoints.reduce((sum, p) => sum + p.lng, 0) / clusterPoints.length;

    clusters.push({
      points: clusterPoints,
      totalPassengers,
      center: { lat: centerLat, lng: centerLng },
    });
  }

  return clusters;
}

export default clusterByProximity;
