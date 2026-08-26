<div align="center">

# 📍 gps-cluster-engine

**Group GPS points by proximity with capacity constraints.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*The algorithm behind dispatch logistics. Group nearby pickups. Respect bus capacity. Minimize total distance.*

> **DBSCAN dominates geospatial clustering** — and raw K-means is fundamentally incompatible with lat/lon coordinates. This engine uses Haversine-aware proximity clustering with capacity constraints.

[Quick Start](#-quick-start) •
[Demo](#-demo) •
[How it works](#-how-it-works) •
[API](#-api) •
[Use cases](#-use-cases)

</div>

---

## 🤔 Why this exists

You have 50 bookings. You have 3 buses with 14 seats each. How do you group them?

**The naive approach:** Group by zone. Naama Bay bookings in Bus 1, Sharm Bay in Bus 2.

**The problem:** Two hotels 200m apart can be in different zones. A bus drives past a pickup to get to another one 5 minutes away.

**The right approach:** Group by actual GPS proximity, respect capacity, minimize total driving distance.

That's what this engine does.

---

## ✨ Features

| Feature | Status |
|---|---|
| **Proximity clustering** | ✅ Haversine distance, configurable radius |
| **Capacity constraints** | ✅ Max points per cluster |
| **Distance optimization** | ✅ Minimizes total intra-cluster distance |
| **Zero dependencies** | ✅ Pure TypeScript, ~2KB |
| **Edge-ready** | ✅ Runs on Cloudflare Workers |
| **Type-safe** | ✅ Full TypeScript types |

---

## 🚀 Quick Start

### 1. Install

```bash
npm install gps-cluster-engine
```

### 2. Use

```typescript
import { clusterByProximity } from 'gps-cluster-engine';

const pickups = [
  { id: 'booking-1', lat: 27.915, lng: 34.33, passengers: 4 },
  { id: 'booking-2', lat: 27.916, lng: 34.331, passengers: 6 },
  { id: 'booking-3', lat: 27.85, lng: 34.28, passengers: 3 },
  { id: 'booking-4', lat: 27.86, lng: 34.29, passengers: 5 },
];

const clusters = clusterByProximity(pickups, {
  maxDistanceKm: 5,        // group within 5km radius
  maxPerCluster: 14,       // bus capacity
});

console.log(clusters);
// [
//   { points: [booking-1, booking-2], totalPassengers: 10, center: { lat: 27.9155, lng: 34.3305 } },
//   { points: [booking-3, booking-4], totalPassengers: 8, center: { lat: 27.855, lng: 34.285 } },
// ]
```

---

## 📸 Demo

### Before (zone-based grouping)
```
Bus 1: Naama Bay (4 passengers) — drives 8km to pickup
Bus 2: Naama Bay (6 passengers) — drives 8km to pickup
Bus 3: Sharm Bay (8 passengers) — drives 12km to pickup

Total distance: 28km
```

### After (GPS proximity grouping)
```
Bus 1: Naama Bay nearby (10 passengers) — drives 2km total
Bus 2: Sharm Bay nearby (8 passengers) — drives 3km total

Total distance: 5km — 82% reduction
```

---

## 🏗️ How it works

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT                                   │
│                                                             │
│  [{ id, lat, lng, passengers }, ...]                        │
│                                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              1. DISTANCE MATRIX                             │
│                                                             │
│  Calculate Haversine distance between all pairs             │
│                                                             │
│  d = 2r × arcsin(√(sin²(Δlat/2) + cos(lat1)cos(lat2)sin²(Δlng/2))) │
│                                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              2. GREEDY CLUSTERING                           │
│                                                             │
│  For each unassigned point:                                 │
│    - Find all points within maxDistanceKm                   │
│    - Sort by distance (nearest first)                       │
│    - Add to cluster until maxPerCluster reached             │
│                                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              3. OUTPUT                                      │
│                                                             │
│  [{ points, totalPassengers, center }, ...]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 API

### `clusterByProximity(points, options)`

| Parameter | Type | Required | Description |
|---|---|---|---|
| `points` | `Point[]` | ✅ | Array of points with lat/lng |
| `options` | `ClusterOptions` | ❌ | Clustering configuration |

#### Point

```typescript
interface Point {
  id: string;
  lat: number;
  lng: number;
  passengers?: number;  // default: 1
}
```

#### ClusterOptions

```typescript
interface ClusterOptions {
  maxDistanceKm?: number;   // max distance between points in a cluster (default: 5)
  maxPerCluster?: number;   // max passengers per cluster (default: 14)
}
```

#### Returns

```typescript
interface Cluster {
  points: Point[];
  totalPassengers: number;
  center: { lat: number; lng: number };
}
```

---

## 🔗 Related algorithms and tools

| Tool | What it does | When to use |
|---|---|---|
| **[DBSCAN](https://scikit-learn.org/stable/modules/clustering.html#dbscan)** | Density-based clustering, arbitrary shapes | Unknown number of clusters |
| **[HDBSCAN](https://hdbscan.readthedocs.io/)** | Hierarchical DBSCAN, varying density | Clusters of different densities |
| **[OR-Tools](https://developers.google.com/optimization/cp)** | Constraint-based vehicle routing | Capacity-constrained VRP |
| **[scikit-learn](https://scikit-learn.org/stable/modules/clustering.html)** | General clustering toolkit | Quick prototyping |

**Pattern:** For capacity-constrained vehicle routing problems (CVRP), use the **Cluster-First, Route-Second** approach — cluster nearby points with this engine, then solve each cluster as a separate routing problem with OR-Tools.

---

## 🌍 Use cases

| Use case | How |
|---|---|
| **Travel dispatch** | Group hotel pickups by proximity for bus routes |
| **Delivery logistics** | Cluster nearby deliveries for driver routes |
| **Ride-sharing** | Group passengers heading in the same direction |
| **Field service** | Group nearby service calls for technician routes |
| **Event transport** | Cluster attendee pickups for shuttle buses |

---

## 📋 FAQ

### Can I use K-means instead?

**No.** Raw K-means is incompatible with lat/lon coordinates — the mean of lat/lon pairs is not a valid geographic centroid. Use DBSCAN or Haversine-aware variants instead.

---

## 📄 License

MIT © [Project Alpha Tech](https://projectalpha.tech)

---

<div align="center">

**⭐ Star this repo if you've ever driven past a pickup to get to another one!**

</div>
