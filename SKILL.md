---
name: gps-cluster-engine
description: Group GPS points by proximity with capacity constraints. The algorithm behind dispatch and logistics clustering — respects bus/vehicle capacity, minimizes total distance. Use when building dispatch systems, delivery route planning, or ride-sharing grouping. Documents why raw K-means on lat/lon is mathematically wrong.
---

# GPS Cluster Engine

## When to use this skill

Invoke this skill when grouping GPS points by proximity for dispatch, delivery, or ride-sharing. Use when you need capacity-constrained clustering that respects vehicle/bus limits and minimizes total driving distance.

## What this skill provides

Haversine-aware proximity clustering with capacity constraints — the mathematically correct approach for geospatial grouping on Earth's surface.

### Core API

```typescript
import { clusterByProximity } from 'gps-cluster-engine';

const clusters = clusterByProximity(pickups, {
  maxDistanceKm: 5,        // group within 5km radius
  maxPerCluster: 14,       // bus capacity
});
// Returns: [{ points, totalPassengers, center: { lat, lng } }]
```

### Why not K-means?

**Raw K-means is mathematically incompatible with lat/lon coordinates.** The mean of lat/lon pairs is not a valid geographic centroid — it distorts near the poles and doesn't account for Earth's curvature. This engine uses **Haversine distance** throughout.

### Algorithm

1. Calculate Haversine distance matrix between all point pairs
2. Greedy clustering: for each unassigned point, find neighbors within `maxDistanceKm`, add nearest first until capacity reached
3. Output clusters with center point and total passenger count

### Use cases

- **Travel dispatch** — group hotel pickups by proximity for bus routes
- **Delivery logistics** — cluster nearby deliveries for driver routes
- **Ride-sharing** — group passengers heading the same direction
- **Field service** — group nearby service calls for technician routes

### Integration pattern

For full capacity-constrained vehicle routing (CVRP), use **Cluster-First, Route-Second**: cluster with this engine, then solve each cluster with OR-Tools.

