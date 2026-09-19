import {
  PEDESTRIAN_SPEED_MIN,
  PEDESTRIAN_SPEED_MAX,
  HALF_ROAD,
  CROSSWALK_DISTANCE,
  DIRECTIONS,
  PEDESTRIAN_MODELS,
} from '../utils/constants';
import { randomRange, exponentialRandom, randomChoice, generateId } from '../utils/helpers';

function getPedSpawnRates(intensity, mode) {
  if (mode === 'low_power') {
    return { min: 8.0, max: 16.0, maxLimit: 2 };
  }
  if (mode === 'pedestrian_rush') {
    return { min: 0.4, max: 1.0, maxLimit: 18 };
  }
  switch (intensity) {
    case 'low': return { min: 6.0, max: 11.0, maxLimit: 4 };
    case 'mid': return { min: 2.4, max: 4.8, maxLimit: 8 };
    case 'high': return { min: 1.2, max: 2.4, maxLimit: 14 };
    case 'extreme': return { min: 0.5, max: 1.2, maxLimit: 22 };
    default: return { min: 2.4, max: 4.8, maxLimit: 8 };
  }
}

export class PedestrianManager {
  constructor() {
    this.spawnTimers = {};
    this.nextSpawnTime = {};
    this.lastWaitingCounts = null;
    this.statsTimer = 0;
    DIRECTIONS.forEach((dir) => {
      this.spawnTimers[dir] = 0;
      this.nextSpawnTime[dir] = randomRange(2.0, 5.0);
    });
  }

  reset() {
    this.lastWaitingCounts = null;
    this.statsTimer = 0;
    DIRECTIONS.forEach((dir) => {
      this.spawnTimers[dir] = 0;
      this.nextSpawnTime[dir] = randomRange(2.0, 5.0);
    });
  }

  // Crosswalk placement with realistic sidewalk approach and disperse corridors
  getSpawnConfig(crosswalkDirection) {
    const edgeDist = CROSSWALK_DISTANCE;
    const startSide = Math.random() > 0.5 ? 1 : -1;
    const curbDist = HALF_ROAD + 1.2;
    const spawnSidewalkDist = HALF_ROAD + 5.5;
    const disperseDist = HALF_ROAD + 6.5;
    const spread = (Math.random() - 0.5) * 2.2;

    switch (crosswalkDirection) {
      case 'north': // crosswalk at North, runs East-West
        return {
          x: startSide * spawnSidewalkDist,
          z: -edgeDist + spread,
          curbX: startSide * curbDist,
          curbZ: -edgeDist + spread,
          targetCurbX: -startSide * curbDist,
          targetCurbZ: -edgeDist + spread,
          targetX: -startSide * disperseDist,
          targetZ: -edgeDist + spread,
          movesAlongX: true,
          normalSide: startSide,
        };
      case 'south': // crosswalk at South, runs East-West
        return {
          x: startSide * spawnSidewalkDist,
          z: edgeDist + spread,
          curbX: startSide * curbDist,
          curbZ: edgeDist + spread,
          targetCurbX: -startSide * curbDist,
          targetCurbZ: edgeDist + spread,
          targetX: -startSide * disperseDist,
          targetZ: edgeDist + spread,
          movesAlongX: true,
          normalSide: startSide,
        };
      case 'east': // crosswalk at East, runs North-South
        return {
          x: edgeDist + spread,
          z: startSide * spawnSidewalkDist,
          curbX: edgeDist + spread,
          curbZ: startSide * curbDist,
          targetCurbX: edgeDist + spread,
          targetCurbZ: -startSide * curbDist,
          targetX: edgeDist + spread,
          targetZ: -startSide * disperseDist,
          movesAlongX: false,
          normalSide: startSide,
        };
      case 'west': // crosswalk at West, runs North-South
        return {
          x: -edgeDist + spread,
          z: startSide * spawnSidewalkDist,
          curbX: -edgeDist + spread,
          curbZ: startSide * curbDist,
          targetCurbX: -edgeDist + spread,
          targetCurbZ: -startSide * curbDist,
          targetX: -edgeDist + spread,
          targetZ: -startSide * disperseDist,
          movesAlongX: false,
          normalSide: startSide,
        };
      default:
        return { x: 0, z: 0, curbX: 0, curbZ: 0, targetCurbX: 0, targetCurbZ: 0, targetX: 0, targetZ: 0, movesAlongX: true, normalSide: 1 };
    }
  }

  isCrossing(ped) {
    // Pedestrian is actively crossing if within the asphalt roadway
    if (ped.movesAlongX) {
      return Math.abs(ped.x) < HALF_ROAD + 0.6;
    } else {
      return Math.abs(ped.z) < HALF_ROAD + 0.6;
    }
  }

  spawnPedestrian(crosswalkDirection) {
    const cfg = this.getSpawnConfig(crosswalkDirection);
    const baseSpeed = randomRange(PEDESTRIAN_SPEED_MIN, PEDESTRIAN_SPEED_MAX);
    const character = randomChoice(PEDESTRIAN_MODELS);
    const skinColors = ['#f5d0a9', '#d4a574', '#8d5524', '#c68642', '#e0ac69', '#f1c27d'];
    const clothingColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];

    return {
      id: generateId(),
      crosswalkDirection,
      model: character.model,
      modelScale: character.scale,
      walkAnim: character.walkAnim,
      idleAnim: character.idleAnim,
      x: cfg.x,
      z: cfg.z,
      curbX: cfg.curbX,
      curbZ: cfg.curbZ,
      targetCurbX: cfg.targetCurbX,
      targetCurbZ: cfg.targetCurbZ,
      targetX: cfg.targetX,
      targetZ: cfg.targetZ,
      movesAlongX: cfg.movesAlongX,
      baseSpeed,
      speed: baseSpeed,
      state: 'approaching', // 'approaching' | 'waiting' | 'crossing' | 'dispersing'
      waiting: false,
      crossing: false,
      isJogging: false,
      finished: false,
      waitTime: 0,
      skinColor: randomChoice(skinColors),
      clothingColor: randomChoice(clothingColors),
      walkCycle: Math.random() * Math.PI * 2,
      lateralOffset: 0,
    };
  }

  update(delta, store) {
    const dt = Math.min(delta, 0.1);
    const state = store.getState();
    const pedSignals = state.pedestrianSignals;
    const vehicles = state.vehicles || [];
    const intensity = state.pedestrianIntensity || 'mid';
    const mode = state.simulationMode || 'custom';
    const cfg = getPedSpawnRates(intensity, mode);
    let pedestrians = [...state.pedestrians];
    const toRemove = [];

    // Spawn pedestrians at crosswalks
    DIRECTIONS.forEach((dir) => {
      this.spawnTimers[dir] += dt;
      if (this.spawnTimers[dir] >= (this.nextSpawnTime[dir] || 3)) {
        this.spawnTimers[dir] = 0;
        this.nextSpawnTime[dir] = exponentialRandom((cfg.min + cfg.max) / 2);
        this.nextSpawnTime[dir] = Math.max(cfg.min, Math.min(this.nextSpawnTime[dir], cfg.max * 2));

        const existing = pedestrians.filter((p) => p.crosswalkDirection === dir && !p.finished);
        const availableSlots = cfg.maxLimit - existing.length;
        if (availableSlots > 0) {
          const spawnCount = mode === 'pedestrian_rush'
            ? Math.min(availableSlots, Math.floor(randomRange(2, 5)))
            : 1;
          for (let s = 0; s < spawnCount; s++) {
            pedestrians.push(this.spawnPedestrian(dir));
          }
        }
      }
    });

    // Update each pedestrian lifecycle and kinematics
    const pedsByDirection = {};
    pedestrians.forEach((p) => {
      (pedsByDirection[p.crosswalkDirection] ||= []).push(p);
    });
    pedestrians.forEach((ped) => {
      if (ped.finished) {
        toRemove.push(ped.id);
        return;
      }

      const signal = pedSignals[ped.crosswalkDirection] || 'stop';
      ped.walkCycle += dt * 8;

      // 1. Social force: avoid head-on collisions with other pedestrians on same crosswalk
      let separationZ = 0;
      let separationX = 0;
      for (const other of pedsByDirection[ped.crosswalkDirection]) {
        if (other.id === ped.id) continue;
        const d = Math.hypot(other.x - ped.x, other.z - ped.z);
        if (d < 1.4 && d > 0.01) {
          // Gently push sideways away from oncoming neighbor
          if (ped.movesAlongX) {
            separationZ += (ped.z >= other.z ? 0.4 : -0.4) * dt;
          } else {
            separationX += (ped.x >= other.x ? 0.4 : -0.4) * dt;
          }
        }
      }
      ped.x += separationX;
      ped.z += separationZ;

      // 2. Proximity check to approaching vehicles: trigger reactive jogging / alert speed
      let vehicleDanger = false;
      for (const veh of vehicles) {
        const vDist = Math.hypot(veh.x - ped.x, veh.z - ped.z);
        if (vDist < 7.5 && (veh.currentSpeed || 0) > 1.2) {
          vehicleDanger = true;
          break;
        }
      }

      // 3. State Machine Execution
      switch (ped.state) {
        case 'approaching': {
          // Walk from sidewalk spawn to the crosswalk curb
          ped.waiting = false;
          ped.crossing = false;
          ped.isJogging = false;
          ped.speed = ped.baseSpeed;

          if (ped.movesAlongX) {
            const dir = ped.curbX > ped.x ? 1 : -1;
            ped.x += dir * ped.speed * dt;
            if ((dir > 0 && ped.x >= ped.curbX) || (dir < 0 && ped.x <= ped.curbX)) {
              ped.x = ped.curbX;
              ped.state = 'waiting';
            }
          } else {
            const dir = ped.curbZ > ped.z ? 1 : -1;
            ped.z += dir * ped.speed * dt;
            if ((dir > 0 && ped.z >= ped.curbZ) || (dir < 0 && ped.z <= ped.curbZ)) {
              ped.z = ped.curbZ;
              ped.state = 'waiting';
            }
          }
          break;
        }

        case 'waiting': {
          ped.waiting = true;
          ped.crossing = false;
          ped.isJogging = false;
          ped.waitTime += dt;

          // If signal is walk, step out and begin crossing!
          if (signal === 'walk') {
            ped.waiting = false;
            ped.state = 'crossing';
          }
          break;
        }

        case 'crossing': {
          ped.waiting = false;
          ped.crossing = this.isCrossing(ped);

          // Reactive hurrying/jogging if signal is in clearance (flashing hand) or car approaches
          const hurry = signal === 'flashing' || vehicleDanger;
          ped.isJogging = hurry;
          ped.speed = hurry ? ped.baseSpeed * 1.85 : ped.baseSpeed;

          // Advance across the crosswalk
          if (ped.movesAlongX) {
            const dir = ped.targetCurbX > ped.x ? 1 : -1;
            ped.x += dir * ped.speed * dt;
            if ((dir > 0 && ped.x >= ped.targetCurbX) || (dir < 0 && ped.x <= ped.targetCurbX)) {
              ped.x = ped.targetCurbX;
              ped.state = 'dispersing';
            }
          } else {
            const dir = ped.targetCurbZ > ped.z ? 1 : -1;
            ped.z += dir * ped.speed * dt;
            if ((dir > 0 && ped.z >= ped.targetCurbZ) || (dir < 0 && ped.z <= ped.targetCurbZ)) {
              ped.z = ped.targetCurbZ;
              ped.state = 'dispersing';
            }
          }
          break;
        }

        case 'dispersing': {
          // Reached destination curb! Continue walking outward along sidewalk before despawning
          ped.waiting = false;
          ped.crossing = false;
          ped.isJogging = false;
          ped.speed = ped.baseSpeed;

          if (ped.movesAlongX) {
            const dir = ped.targetX > ped.x ? 1 : -1;
            ped.x += dir * ped.speed * dt;
            if ((dir > 0 && ped.x >= ped.targetX) || (dir < 0 && ped.x <= ped.targetX)) {
              ped.x = ped.targetX;
              ped.finished = true;
            }
          } else {
            const dir = ped.targetZ > ped.z ? 1 : -1;
            ped.z += dir * ped.speed * dt;
            if ((dir > 0 && ped.z >= ped.targetZ) || (dir < 0 && ped.z <= ped.targetZ)) {
              ped.z = ped.targetZ;
              ped.finished = true;
            }
          }
          break;
        }
      }
    });

    // Remove finished pedestrians
    const prevPedCount = state.pedestrians.length;
    pedestrians = pedestrians.filter((p) => !toRemove.includes(p.id));

    // Update crossing pedestrians list for AI vehicle safety checks
    const crossingPeds = pedestrians.filter((p) => p.crossing);

    // Calculate waiting stats
    const waitingCounts = { north: 0, south: 0, east: 0, west: 0 };
    pedestrians.forEach((p) => {
      if (p.waiting) waitingCounts[p.crosswalkDirection]++;
    });

    // Only dispatch setPedestrians when count changed
    if (pedestrians.length !== prevPedCount || toRemove.length > 0) {
      store.getState().setPedestrians(pedestrians);
    }
    store.getState().setCrossingPedestrians(crossingPeds);

    // Throttle stats update
    this.statsTimer = (this.statsTimer || 0) + dt;
    const countsChanged =
      !this.lastWaitingCounts ||
      waitingCounts.north !== this.lastWaitingCounts.north ||
      waitingCounts.south !== this.lastWaitingCounts.south ||
      waitingCounts.east !== this.lastWaitingCounts.east ||
      waitingCounts.west !== this.lastWaitingCounts.west;

    if (this.statsTimer >= 0.25 || countsChanged) {
      this.statsTimer = 0;
      this.lastWaitingCounts = { ...waitingCounts };
      store.getState().updateStats({
        pedestriansWaiting: waitingCounts,
        activePedestriansCrossing: crossingPeds.length,
      });
    }
  }
}
