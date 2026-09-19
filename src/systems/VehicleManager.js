import {
  VEHICLE_TYPES,
  VEHICLE_COLORS,
  VEHICLE_SPEED_BASE,
  VEHICLE_SPEED_VARIATION,
  VEHICLE_STOP_DISTANCE,
  VEHICLE_GAP,
  ROAD_LENGTH,
  HALF_ROAD,
  LANE_OFFSETS,
  DIRECTIONS,
} from '../utils/constants';
import {
  weightedRandomChoice,
  randomChoice,
  randomRange,
  exponentialRandom,
  decideTurn,
  generateId,
} from '../utils/helpers';

// Cubic Bezier interpolation for precise, smooth turning arcs
function evalCubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const x = mt2 * mt * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t2 * t * p3[0];
  const z = mt2 * mt * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t2 * t * p3[1];

  const dx = 3 * mt2 * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t2 * (p3[0] - p2[0]);
  const dz = 3 * mt2 * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t2 * (p3[1] - p2[1]);
  const rotation = Math.atan2(dx, dz);
  return { x, z, rotation };
}

// Geometric Bezier control points for all 8 turns staying strictly in respective lanes
const TURN_CURVES = {
  north_right: {
    p0: [10.3, -HALF_ROAD],
    p1: [10.3, -11.15],
    p2: [11.15, -10.3],
    p3: [HALF_ROAD, -10.3],
    exitDir: { dx: 1, dz: 0, rot: Math.PI / 2 },
    arcLength: 3.0,
  },
  north_left: {
    p0: [2.7, -HALF_ROAD],
    p1: [2.7, -1.0],
    p2: [-2.0, 2.7],
    p3: [-HALF_ROAD, 2.7],
    exitDir: { dx: -1, dz: 0, rot: -Math.PI / 2 },
    arcLength: 23.4,
  },
  south_right: {
    p0: [-10.3, HALF_ROAD],
    p1: [-10.3, 11.15],
    p2: [-11.15, 10.3],
    p3: [-HALF_ROAD, 10.3],
    exitDir: { dx: -1, dz: 0, rot: -Math.PI / 2 },
    arcLength: 3.0,
  },
  south_left: {
    p0: [-2.7, HALF_ROAD],
    p1: [-2.7, 1.0],
    p2: [2.0, -2.7],
    p3: [HALF_ROAD, -2.7],
    exitDir: { dx: 1, dz: 0, rot: Math.PI / 2 },
    arcLength: 23.4,
  },
  east_right: {
    p0: [HALF_ROAD, 10.3],
    p1: [11.15, 10.3],
    p2: [10.3, 11.15],
    p3: [10.3, HALF_ROAD],
    exitDir: { dx: 0, dz: 1, rot: 0 },
    arcLength: 3.0,
  },
  east_left: {
    p0: [HALF_ROAD, 2.7],
    p1: [1.0, 2.7],
    p2: [-2.7, -2.0],
    p3: [-2.7, -HALF_ROAD],
    exitDir: { dx: 0, dz: -1, rot: Math.PI },
    arcLength: 23.4,
  },
  west_right: {
    p0: [-HALF_ROAD, -10.3],
    p1: [-11.15, -10.3],
    p2: [-10.3, -11.15],
    p3: [-10.3, -HALF_ROAD],
    exitDir: { dx: 0, dz: -1, rot: Math.PI },
    arcLength: 3.0,
  },
  west_left: {
    p0: [-HALF_ROAD, -2.7],
    p1: [-1.0, -2.7],
    p2: [2.7, 2.0],
    p3: [2.7, HALF_ROAD],
    exitDir: { dx: 0, dz: 1, rot: 0 },
    arcLength: 23.4,
  },
};

// Driver personality archetypes for heterogeneous human traffic
const DRIVER_PROFILES = {
  cautious: { aMax: 3.0, bComf: 3.8, headwayT: 1.5, jamDist: 3.2, speedMultiplier: 0.9 },
  commuter: { aMax: 4.2, bComf: 4.8, headwayT: 1.2, jamDist: 2.6, speedMultiplier: 1.0 },
  aggressive: { aMax: 5.2, bComf: 5.8, headwayT: 0.95, jamDist: 2.0, speedMultiplier: 1.15 },
  truck: { aMax: 2.2, bComf: 2.8, headwayT: 1.9, jamDist: 4.0, speedMultiplier: 0.85 },
  emergency: { aMax: 6.0, bComf: 6.8, headwayT: 0.8, jamDist: 1.8, speedMultiplier: 1.35 },
};

// Intelligent Driver Model (IDM) interaction equation
function computeIDMInteraction(v, deltaV, s, aMax, bComf, jamDist, headwayT) {
  if (s <= 0.1) return -bComf * 2.5; // Firm stop
  const dynamicTerm = (v * deltaV) / (2 * Math.sqrt(Math.max(0.1, aMax * bComf)));
  const sStar = jamDist + Math.max(0, v * headwayT + dynamicTerm);
  const ratio = sStar / s;
  return -aMax * ratio * ratio;
}

// Multi-circle boundary generator for non-penetrating collision envelope
function getVehicleCircles(v) {
  const len = v.length || 4.2;
  const w = v.width || 1.8;
  const r = (w / 2) + 0.12;
  const hx = v.exitMovement ? v.exitMovement.dx : Math.sin(v.rotation);
  const hz = v.exitMovement ? v.exitMovement.dz : Math.cos(v.rotation);
  const halfSpan = (len - w) / 2;

  if (len > 6.0) {
    // Long vehicles (Bus): 4 bounding circles
    return [
      { x: v.x + hx * halfSpan, z: v.z + hz * halfSpan, r },
      { x: v.x + hx * (halfSpan * 0.33), z: v.z + hz * (halfSpan * 0.33), r },
      { x: v.x - hx * (halfSpan * 0.33), z: v.z - hz * (halfSpan * 0.33), r },
      { x: v.x - hx * halfSpan, z: v.z - hz * halfSpan, r },
    ];
  } else if (len > 4.5) {
    // Medium vehicles (Truck, Pickup, Ambulance): 3 bounding circles
    return [
      { x: v.x + hx * halfSpan, z: v.z + hz * halfSpan, r },
      { x: v.x, z: v.z, r },
      { x: v.x - hx * halfSpan, z: v.z - hz * halfSpan, r },
    ];
  } else {
    // Standard vehicles (Car, Taxi, SUV, Police): 2 bounding circles
    return [
      { x: v.x + hx * halfSpan, z: v.z + hz * halfSpan, r },
      { x: v.x - hx * halfSpan, z: v.z - hz * halfSpan, r },
    ];
  }
}

function getSpawnRates(intensity, mode, dir) {
  if (mode === 'low_power') {
    return { min: 4.5, max: 8.5, maxActive: 2 };
  }
  if (mode === 'asymmetric_rush') {
    if (dir === 'east' || dir === 'west') {
      return { min: 0.6, max: 1.2, maxActive: 36 };
    } else {
      return { min: 8.0, max: 15.0, maxActive: 4 };
    }
  }
  switch (intensity) {
    case 'low': return { min: 4.0, max: 7.0, maxActive: 12 };
    case 'mid': return { min: 2.2, max: 4.2, maxActive: 22 };
    case 'high': return { min: 1.2, max: 2.2, maxActive: 32 };
    case 'extreme': return { min: 0.6, max: 1.3, maxActive: 45 };
    default: return { min: 2.2, max: 4.2, maxActive: 22 };
  }
}

export class VehicleManager {
  constructor() {
    this.spawnTimers = {};
    this.nextSpawnTime = {};
    this.lastDispatchTrigger = 0;
    this.emergencyTimer = 0;
    this.lastWaitingCounts = null;
    this.statsTimer = 0;
    this.gridlockActive = false;
    this.gridlockTimer = 0;
    this.gridlockClearTimer = 0;
    DIRECTIONS.forEach((dir) => {
      this.spawnTimers[dir] = 0;
      this.nextSpawnTime[dir] = randomRange(2.0, 4.0);
    });
  }

  reset() {
    this.lastDispatchTrigger = 0;
    this.emergencyTimer = 0;
    this.lastWaitingCounts = null;
    this.statsTimer = 0;
    this.gridlockActive = false;
    this.gridlockTimer = 0;
    this.gridlockClearTimer = 0;
    DIRECTIONS.forEach((dir) => {
      this.spawnTimers[dir] = 0;
      this.nextSpawnTime[dir] = randomRange(2.0, 4.0);
    });
  }

  handleModeSwitch(_newScenarioMode) {
    DIRECTIONS.forEach((dir) => {
      this.spawnTimers[dir] = 0;
      this.nextSpawnTime[dir] = randomRange(1.5, 3.0);
    });
    this.emergencyTimer = 0;
    this.gridlockTimer = 0;
  }

  getSpawnPosition(direction, laneIndex) {
    const lateral = LANE_OFFSETS[laneIndex];
    switch (direction) {
      case 'north':
        return { x: lateral, z: -ROAD_LENGTH, rotation: 0 };
      case 'south':
        return { x: -lateral, z: ROAD_LENGTH, rotation: Math.PI };
      case 'east':
        return { x: ROAD_LENGTH, z: lateral, rotation: -Math.PI / 2 };
      case 'west':
        return { x: -ROAD_LENGTH, z: -lateral, rotation: Math.PI / 2 };
      default:
        return { x: 0, z: 0, rotation: 0 };
    }
  }

  getMovementVector(direction) {
    switch (direction) {
      case 'north': return { dx: 0, dz: 1 };
      case 'south': return { dx: 0, dz: -1 };
      case 'east': return { dx: -1, dz: 0 };
      case 'west': return { dx: 1, dz: 0 };
      default: return { dx: 0, dz: 0 };
    }
  }

  isOutOfBounds(vehicle) {
    return (
      Math.abs(vehicle.x) > ROAD_LENGTH + 18 ||
      Math.abs(vehicle.z) > ROAD_LENGTH + 18
    );
  }

  spawnAmbulance(direction = 'north', turn = 'straight') {
    const ambType = VEHICLE_TYPES.find((t) => t.name === 'ambulance') || {
      name: 'ambulance',
      model: '/models/ambulance.glb',
      scale: 0.27,
      width: 2.5,
      height: 2.6,
      length: 5.8,
      isEmergency: true,
    };
    const laneIndex = turn === 'left' ? 0 : turn === 'right' ? 2 : 1;
    const pos = this.getSpawnPosition(direction, laneIndex);
    const profile = DRIVER_PROFILES.emergency;

    return {
      id: generateId(),
      direction,
      laneIndex,
      type: 'ambulance',
      model: '/models/ambulance.glb',
      modelScale: ambType.scale || 0.27,
      width: ambType.width || 2.5,
      height: ambType.height || 2.6,
      length: ambType.length || 5.8,
      color: '#ffffff',
      speed: VEHICLE_SPEED_BASE * profile.speedMultiplier,
      currentSpeed: VEHICLE_SPEED_BASE * profile.speedMultiplier,
      acceleration: 0,
      x: pos.x,
      z: pos.z,
      rotation: pos.rotation,
      turn,
      waiting: false,
      passedIntersection: false,
      enteredIntersection: false,
      turning: false,
      turnProgress: 0,
      turnKey: `${direction}_${turn}`,
      queuePosition: 0,
      waitTime: 0,
      exitMovement: null,
      isEmergency: true,
      personality: 'emergency',
      profile,
      turnSignal: turn === 'straight' ? null : turn,
      isBraking: false,
      rtoStopTimer: 0,
      rtoPermitted: false,
      distanceTraveled: 0,
    };
  }

  spawnVehicle(direction) {
    const type = weightedRandomChoice(VEHICLE_TYPES);
    const isAmbulance = type.name === 'ambulance';
    const isTaxi = type.name === 'taxi';
    const isTruck = type.name === 'truck' || type.name === 'bus';
    const color = isAmbulance
      ? '#ffffff'
      : isTaxi
        ? '#f59e0b'
        : isTruck
          ? randomChoice(['#1d4ed8', '#b91c1c', '#15803d', '#475569', '#d97706', '#0284c7'])
          : randomChoice(VEHICLE_COLORS);

    let personality = 'commuter';
    if (isAmbulance) {
      personality = 'emergency';
    } else if (isTruck) {
      personality = 'truck';
    } else {
      const roll = Math.random();
      if (roll < 0.22) personality = 'cautious';
      else if (roll < 0.80) personality = 'commuter';
      else personality = 'aggressive';
    }
    const profile = DRIVER_PROFILES[personality];

    const speed = (VEHICLE_SPEED_BASE + randomRange(-VEHICLE_SPEED_VARIATION, VEHICLE_SPEED_VARIATION)) * profile.speedMultiplier;
    const turn = isAmbulance ? (Math.random() < 0.25 ? 'left' : 'straight') : decideTurn();

    let laneIndex = 1;
    if (turn === 'left') {
      laneIndex = 0;
    } else if (turn === 'right') {
      laneIndex = 2;
    } else {
      laneIndex = Math.random() < 0.6 ? 1 : 2;
    }

    const pos = this.getSpawnPosition(direction, laneIndex);

    return {
      id: generateId(),
      direction,
      laneIndex,
      type: type.name,
      model: type.model,
      modelScale: type.scale,
      width: type.width,
      height: type.height,
      length: type.length,
      color,
      speed,
      currentSpeed: speed,
      acceleration: 0,
      x: pos.x,
      z: pos.z,
      rotation: pos.rotation,
      turn,
      waiting: false,
      passedIntersection: false,
      enteredIntersection: false,
      turning: false,
      turnProgress: 0,
      turnKey: `${direction}_${turn}`,
      queuePosition: 0,
      waitTime: 0,
      exitMovement: null,
      isEmergency: !!type.isEmergency,
      personality,
      profile,
      turnSignal: turn === 'straight' ? null : turn,
      isBraking: false,
      rtoStopTimer: 0,
      rtoPermitted: false,
      distanceTraveled: 0,
    };
  }

  update(delta, store) {
    const dt = Math.max(0.0001, Math.min(delta, 0.08));
    const state = store.getState();
    const lightStates = state.trafficLightStates;
    const pedestrians = state.pedestrians || [];
    const intensity = state.vehicleIntensity || 'mid';
    const mode = state.simulationMode || 'custom';
    let vehicles = [...state.vehicles];
    const toRemove = [];

    // On-demand manual emergency dispatch from HUD
    if (state.dispatchAmbulanceTrigger > this.lastDispatchTrigger) {
      this.lastDispatchTrigger = state.dispatchAmbulanceTrigger;
      const ambDirs = ['north', 'east', 'south', 'west'];
      const chosenDir = randomChoice(ambDirs);
      const amb = this.spawnAmbulance(chosenDir, Math.random() < 0.2 ? 'left' : 'straight');
      vehicles.push(amb);
    }

    // In Emergency scenario mode: maintain active ambulance approaching
    if (mode === 'emergency') {
      const activeAmbulances = vehicles.filter((v) => v.isEmergency && !v.passedIntersection);
      this.emergencyTimer = (this.emergencyTimer || 0) + dt;

      if (activeAmbulances.length === 0 || (activeAmbulances.length === 1 && this.emergencyTimer > 8.0)) {
        this.emergencyTimer = 0;
        const ambDirs = ['north', 'east', 'south', 'west'];
        const lastDir = activeAmbulances[0]?.direction;
        const availableDirs = ambDirs.filter((d) => d !== lastDir);
        const dir = randomChoice(availableDirs.length > 0 ? availableDirs : ambDirs);
        const amb = this.spawnAmbulance(dir, Math.random() < 0.25 ? 'left' : 'straight');
        const tooClose = vehicles.some(
          (v) => v.direction === dir && v.laneIndex === amb.laneIndex && Math.hypot(v.x - amb.x, v.z - amb.z) < VEHICLE_GAP * 1.5
        );
        if (!tooClose) {
          vehicles.push(amb);
        }
      }
    }

    // Spawning vehicles
    DIRECTIONS.forEach((dir) => {
      const cfg = getSpawnRates(intensity, mode, dir);
      if (vehicles.length >= cfg.maxActive) return;

      this.spawnTimers[dir] = (this.spawnTimers[dir] || 0) + dt;
      if (this.spawnTimers[dir] >= (this.nextSpawnTime[dir] || 3)) {
        this.spawnTimers[dir] = 0;
        this.nextSpawnTime[dir] = exponentialRandom((cfg.min + cfg.max) / 2);
        this.nextSpawnTime[dir] = Math.max(cfg.min, Math.min(this.nextSpawnTime[dir], cfg.max * 2));

        const newVehicle = this.spawnVehicle(dir);
        const tooClose = vehicles.some(
          (v) =>
            v.direction === dir &&
            v.laneIndex === newVehicle.laneIndex &&
            Math.hypot(v.x - newVehicle.x, v.z - newVehicle.z) < VEHICLE_GAP * 1.5
        );
        if (!tooClose) {
          vehicles.push(newVehicle);
        }
      }
    });

    // Update queue position per approach lane before entering intersection
    DIRECTIONS.forEach((dir) => {
      [0, 1, 2].forEach((lane) => {
        const laneVehicles = vehicles
          .filter((v) => v.direction === dir && v.laneIndex === lane && !v.enteredIntersection)
          .sort((a, b) => {
            switch (dir) {
              case 'north': return b.z - a.z;
              case 'south': return a.z - b.z;
              case 'east': return a.x - b.x;
              case 'west': return b.x - a.x;
              default: return 0;
            }
          });
        laneVehicles.forEach((v, i) => {
          v.queuePosition = i;
        });
      });
    });

    // Active ambulances approaching
    const activeAmbulances = vehicles.filter((v) => v.isEmergency && !v.passedIntersection);

    // Anti-Gridlock Collision Prevention & Detection (Autonomous AI)
    const trappedVehicles = vehicles.filter(
      (v) => (v.enteredIntersection && !v.passedIntersection) ||
             (Math.abs(v.x) <= HALF_ROAD + 0.5 && Math.abs(v.z) <= HALF_ROAD + 0.5 && !v.passedIntersection && v.enteredIntersection)
    );
    const stalledTrapped = trappedVehicles.filter((v) => (v.currentSpeed || 0) < 0.35);

    if (!this.gridlockActive) {
      if (stalledTrapped.length >= 2) {
        this.gridlockTimer += dt;
        if (this.gridlockTimer >= 1.8) {
          this.gridlockActive = true;
          this.gridlockTimer = 0;
          this.gridlockClearTimer = 0;
          store.getState().setAntiGridlockActive(true);
        }
      } else {
        this.gridlockTimer = Math.max(0, this.gridlockTimer - dt * 0.5);
      }
    } else {
      if (trappedVehicles.length === 0) {
        this.gridlockClearTimer += dt;
        if (this.gridlockClearTimer >= 0.6) {
          this.gridlockActive = false;
          this.gridlockTimer = 0;
          this.gridlockClearTimer = 0;
          store.getState().setAntiGridlockActive(false);
        }
      } else {
        this.gridlockClearTimer = 0;
      }
    }

    let trappedRanked = [];
    if (this.gridlockActive && trappedVehicles.length > 0) {
      trappedRanked = [...trappedVehicles].sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;

        const getProgress = (v) => {
          if (v.turn !== 'straight') {
            return v.turnProgress || 0;
          }
          let dist = 0;
          switch (v.direction) {
            case 'north': dist = v.z + HALF_ROAD; break;
            case 'south': dist = HALF_ROAD - v.z; break;
            case 'east': dist = HALF_ROAD - v.x; break;
            case 'west': dist = v.x + HALF_ROAD; break;
            default: dist = 0;
          }
          return dist / (HALF_ROAD * 2);
        };

        return getProgress(b) - getProgress(a);
      });
    }

    // Update physics for each vehicle
    vehicles.forEach((vehicle) => {
      if (this.isOutOfBounds(vehicle)) {
        toRemove.push(vehicle.id);
        return;
      }

      const isTrapped = this.gridlockActive && vehicle.enteredIntersection && !vehicle.passedIntersection;
      if (isTrapped) {
        // Anti-Gridlock Collision-Free Evacuation Protocol
        const vHeadX = vehicle.exitMovement ? vehicle.exitMovement.dx : Math.sin(vehicle.rotation);
        const vHeadZ = vehicle.exitMovement ? vehicle.exitMovement.dz : Math.cos(vehicle.rotation);

        let blockedAhead = false;
        // Check higher-priority vehicles in trapped list
        for (const other of trappedRanked) {
          if (other.id === vehicle.id) break; // All earlier elements have higher priority
          const dx = other.x - vehicle.x;
          const dz = other.z - vehicle.z;
          const forwardProj = dx * vHeadX + dz * vHeadZ;
          const lateralProj = Math.abs(-dx * vHeadZ + dz * vHeadX);
          const safeLateral = ((vehicle.width || 1.8) + (other.width || 1.8)) * 0.65;
          const minClearanceDist = ((vehicle.length || 4.2) + (other.length || 4.2)) / 2 + 2.0;

          if (forwardProj > -0.2 && forwardProj < minClearanceDist && lateralProj < safeLateral) {
            blockedAhead = true;
            break;
          }
        }

        // Check if pedestrians are crossing directly in front
        for (const ped of pedestrians) {
          if (!ped.crossing) continue;
          const dx = ped.x - vehicle.x;
          const dz = ped.z - vehicle.z;
          const forwardProj = dx * vHeadX + dz * vHeadZ;
          const lateralProj = Math.abs(-dx * vHeadZ + dz * vHeadX);
          if (forwardProj > 0 && forwardProj < 4.0 && lateralProj < 2.2) {
            blockedAhead = true;
            break;
          }
        }

        const vTarget = blockedAhead ? 0 : (vehicle.isEmergency ? 5.0 : 3.8);
        const accelRate = blockedAhead ? -4.5 : 3.2;
        vehicle.acceleration = accelRate;
        if (blockedAhead) {
          vehicle.currentSpeed = Math.max(0, vehicle.currentSpeed - 4.5 * dt);
          vehicle.isBraking = true;
          vehicle.waiting = vehicle.currentSpeed < 0.1;
        } else {
          vehicle.currentSpeed = Math.min(vTarget, vehicle.currentSpeed + 3.2 * dt);
          vehicle.isBraking = false;
          vehicle.waiting = false;
        }

        // Advance along designated collision-free trajectory
        if (vehicle.currentSpeed > 0) {
          const stepDist = vehicle.currentSpeed * dt;
          vehicle.distanceTraveled = (vehicle.distanceTraveled || 0) + stepDist;

          if (vehicle.turn === 'straight' || vehicle.passedIntersection) {
            const movement = vehicle.exitMovement || this.getMovementVector(vehicle.direction);
            vehicle.x += movement.dx * stepDist;
            vehicle.z += movement.dz * stepDist;

            switch (vehicle.direction) {
              case 'north': if (vehicle.z > HALF_ROAD) vehicle.passedIntersection = true; break;
              case 'south': if (vehicle.z < -HALF_ROAD) vehicle.passedIntersection = true; break;
              case 'east': if (vehicle.x < -HALF_ROAD) vehicle.passedIntersection = true; break;
              case 'west': if (vehicle.x > HALF_ROAD) vehicle.passedIntersection = true; break;
            }
          } else {
            const curve = TURN_CURVES[vehicle.turnKey];
            if (curve) {
              vehicle.turning = true;
              const curveLength = curve.arcLength || (vehicle.turn === 'left' ? 23.4 : 3.0);
              vehicle.turnProgress += (stepDist / curveLength);

              if (vehicle.turnProgress >= 1.0) {
                const excess = (vehicle.turnProgress - 1.0) * curveLength;
                vehicle.turning = false;
                vehicle.passedIntersection = true;
                vehicle.rotation = curve.exitDir.rot;
                vehicle.exitMovement = { dx: curve.exitDir.dx, dz: curve.exitDir.dz };
                vehicle.x = curve.p3[0] + curve.exitDir.dx * excess;
                vehicle.z = curve.p3[1] + curve.exitDir.dz * excess;
              } else {
                const pos = evalCubicBezier(curve.p0, curve.p1, curve.p2, curve.p3, vehicle.turnProgress);
                vehicle.x = pos.x;
                vehicle.z = pos.z;
                vehicle.rotation = pos.rotation;
              }
            } else {
              const movement = this.getMovementVector(vehicle.direction);
              vehicle.x += movement.dx * stepDist;
              vehicle.z += movement.dz * stepDist;
            }
          }
        }
        return;
      }

      const profile = vehicle.profile || DRIVER_PROFILES.commuter;
      const halfLen = (vehicle.length || 4.2) / 2;

      // 1. Precise intersection entry check (only triggers when vehicle boundary reaches HALF_ROAD)
      if (!vehicle.enteredIntersection) {
        let entered = false;
        let overshoot = 0;
        switch (vehicle.direction) {
          case 'north':
            if (vehicle.z >= -HALF_ROAD) {
              entered = true;
              overshoot = vehicle.z - (-HALF_ROAD);
            }
            break;
          case 'south':
            if (vehicle.z <= HALF_ROAD) {
              entered = true;
              overshoot = HALF_ROAD - vehicle.z;
            }
            break;
          case 'east':
            if (vehicle.x <= HALF_ROAD) {
              entered = true;
              overshoot = HALF_ROAD - vehicle.x;
            }
            break;
          case 'west':
            if (vehicle.x >= -HALF_ROAD) {
              entered = true;
              overshoot = vehicle.x - (-HALF_ROAD);
            }
            break;
        }

        if (entered) {
          vehicle.enteredIntersection = true;
          if (vehicle.turn !== 'straight') {
            const curve = TURN_CURVES[vehicle.turnKey];
            if (curve) {
              vehicle.turning = true;
              vehicle.turnProgress = Math.max(0, Math.min(0.95, overshoot / curve.arcLength));
            }
          }
        }
      }

      // 2. Traffic Signal and Stop Line calculations
      const dirSignals = lightStates[vehicle.direction] || { through: 'red', left: 'red' };
      const light = vehicle.laneIndex === 0 ? dirSignals.left : dirSignals.through;
      const frontBuffer = 0.4;
      const leadStopCenter = VEHICLE_STOP_DISTANCE + halfLen + frontBuffer;
      const targetStopCenter = leadStopCenter + vehicle.queuePosition * (VEHICLE_GAP + halfLen * 2);

      let distToStop = 999;
      switch (vehicle.direction) {
        case 'north':
          // Approaching from -z towards +z; stop target is at -targetStopCenter
          distToStop = (-targetStopCenter) - vehicle.z;
          break;
        case 'south':
          // Approaching from +z towards -z; stop target is at +targetStopCenter
          distToStop = vehicle.z - targetStopCenter;
          break;
        case 'east':
          // Approaching from +x towards -x; stop target is at +targetStopCenter
          distToStop = vehicle.x - targetStopCenter;
          break;
        case 'west':
          // Approaching from -x towards +x; stop target is at -targetStopCenter
          distToStop = (-targetStopCenter) - vehicle.x;
          break;
      }

      // 3. IDM Desired Velocity & Cornering Speed Limits
      let v0 = vehicle.speed;
      if (vehicle.isEmergency) v0 *= 1.15;
      if (vehicle.turning) {
        const turnRadius = vehicle.turn === 'right' ? 1.9 : 14.9;
        const maxTurnV = Math.sqrt(3.2 * turnRadius);
        if (maxTurnV < v0) v0 = maxTurnV;
      }

      // IDM Free-road acceleration: a_max * [ 1 - (v / v0)^4 ]
      const vCurr = Math.max(0, vehicle.currentSpeed || 0);
      const freeRatio = vCurr / Math.max(0.1, v0);
      let freeAccel = profile.aMax * (1 - Math.pow(freeRatio, 4));

      // IDM Braking constraint aggregator
      let minInteractionAccel = 0;

      // Obstacle A: Red / Yellow Signal before entering intersection
      if (!vehicle.enteredIntersection) {
        let obeyLight = (light === 'red') || this.gridlockActive;
        if (light === 'yellow' && !this.gridlockActive) {
          const stoppingDist = (vCurr * vCurr) / (2 * profile.bComf) + vCurr * 0.5;
          obeyLight = distToStop > stoppingDist;
        }

        // Right Turn On Red (RTOR): only if stopped at line, crosswalk is clear, cross-traffic is clear, and not in gridlock
        if (!this.gridlockActive && vehicle.turn === 'right' && light === 'red' && vehicle.queuePosition === 0) {
          if (distToStop <= 1.2 && vCurr < 0.4) {
            vehicle.rtoStopTimer = (vehicle.rtoStopTimer || 0) + dt;
            if (vehicle.rtoStopTimer > 1.2) {
              const pedsCrossing = pedestrians.some((p) => p.crossing && Math.hypot(p.x - vehicle.x, p.z - vehicle.z) < 10.0);
              const crossTraffic = vehicles.some((v) => {
                if (v.id === vehicle.id || v.direction === vehicle.direction) return false;
                return Math.hypot(v.x - vehicle.x, v.z - vehicle.z) < 25.0;
              });

              if (!pedsCrossing && !crossTraffic) {
                obeyLight = false;
              }
            }
          } else {
            vehicle.rtoStopTimer = 0;
          }
        }

        if (obeyLight) {
          if (distToStop <= 0.2) {
            // Reached stop line: hold completely stopped! Do not creep into intersection on red
            freeAccel = Math.min(freeAccel, 0);
            const aHold = -Math.max(vCurr / dt, profile.bComf * 2.0);
            if (aHold < minInteractionAccel) minInteractionAccel = aHold;
          } else {
            // Smooth IDM approach to the stop bar
            const aLight = computeIDMInteraction(vCurr, vCurr, Math.max(0.1, distToStop), profile.aMax, profile.bComf, 0.6, profile.headwayT);
            if (aLight < minInteractionAccel) minInteractionAccel = aLight;
          }
        }
      }

      // Current heading vector of vehicle
      const headingX = vehicle.exitMovement ? vehicle.exitMovement.dx : Math.sin(vehicle.rotation);
      const headingZ = vehicle.exitMovement ? vehicle.exitMovement.dz : Math.cos(vehicle.rotation);

      // Obstacle B: Preceding Vehicle Ahead (Universal Forward Detection across all states)
      let closestAheadDist = 999;
      let aheadCandidate = null;
      const halfW = (vehicle.width || 1.8) / 2;

      for (const other of vehicles) {
        if (other.id === vehicle.id) continue;
        const dx = other.x - vehicle.x;
        const dz = other.z - vehicle.z;
        const forwardProj = dx * headingX + dz * headingZ;
        const lateralProj = Math.abs(-dx * headingZ + dz * headingX);
        const otherHalfW = (other.width || 1.8) / 2;
        const lateralThreshold = halfW + otherHalfW + 0.35;

        // Check if other vehicle is directly ahead along our path
        if (forwardProj > 0.3 && forwardProj < 32.0 && lateralProj < lateralThreshold) {
          if (forwardProj < closestAheadDist) {
            closestAheadDist = forwardProj;
            aheadCandidate = other;
          }
        }
      }

      // Hard non-penetration speed limit (Guarantees visible bumper-to-bumper gap)
      let maxAllowedSpeed = v0;
      const MIN_SAFETY_GAP = 1.4; // Strict 1.4m minimum physical asphalt gap between bumpers

      if (aheadCandidate) {
        const otherHalfLen = (aheadCandidate.length || 4.2) / 2;
        const physicalGap = closestAheadDist - halfLen - otherHalfLen;
        const deltaV = vCurr - (aheadCandidate.currentSpeed || 0);
        const aLead = computeIDMInteraction(
          vCurr,
          deltaV,
          Math.max(0.1, physicalGap),
          profile.aMax,
          profile.bComf,
          Math.max(2.4, profile.jamDist),
          profile.headwayT
        );
        if (aLead < minInteractionAccel) minInteractionAccel = aLead;

        // Absolute Non-Penetration Speed Clamp
        const safeGapRemaining = physicalGap - MIN_SAFETY_GAP;
        if (safeGapRemaining <= 0) {
          maxAllowedSpeed = 0;
        } else {
          const maxGapSpeed = safeGapRemaining / dt;
          if (maxGapSpeed < maxAllowedSpeed) maxAllowedSpeed = maxGapSpeed;
        }
      }

      // Multi-circle boundary check for turning & lateral conflict avoidance (prevents corner/side clipping)
      const myCircles = getVehicleCircles(vehicle);
      for (const other of vehicles) {
        if (other.id === vehicle.id) continue;
        const cDist = Math.hypot(other.x - vehicle.x, other.z - vehicle.z);
        if (cDist > 12.0) continue;

        const dx = other.x - vehicle.x;
        const dz = other.z - vehicle.z;
        const forwardProj = dx * headingX + dz * headingZ;
        const lateralProj = Math.abs(-dx * headingZ + dz * headingX);

        // Vehicles traveling in adjacent parallel lanes on the approach road are already queued safely.
        // Ignore them if laterally separated by more than 2.0m so they don't trigger false braking.
        if (!vehicle.enteredIntersection && !other.enteredIntersection && vehicle.direction === other.direction) {
          if (lateralProj > 2.0) {
            continue;
          }
        }

        const otherCircles = getVehicleCircles(other);
        let minCircleGap = Infinity;
        for (const c1 of myCircles) {
          for (const c2 of otherCircles) {
            const d = Math.hypot(c2.x - c1.x, c2.z - c1.z);
            const gap = d - c1.r - c2.r;
            if (gap < minCircleGap) minCircleGap = gap;
          }
        }

        const CIRCLE_SAFE_MARGIN = 0.50; // 0.50m safety margin around circle boundaries
        if (minCircleGap < CIRCLE_SAFE_MARGIN && forwardProj > -0.2) {
          // Other vehicle is ahead or encroaching our turning sweep
          const safeSpeed = Math.max(0, (minCircleGap - CIRCLE_SAFE_MARGIN) / dt);
          if (safeSpeed < maxAllowedSpeed) maxAllowedSpeed = safeSpeed;
          const aCircle = -profile.bComf * 1.8;
          if (aCircle < minInteractionAccel) minInteractionAccel = aCircle;
        }
      }

      // Obstacle C: Crossing Pedestrians
      let closestPedS = Infinity;
      for (const ped of pedestrians) {
        if (!ped.crossing) continue;
        const pDist = Math.hypot(ped.x - vehicle.x, ped.z - vehicle.z);
        if (pDist < 8.5) {
          const dx = ped.x - vehicle.x;
          const dz = ped.z - vehicle.z;
          const forwardProj = dx * headingX + dz * headingZ;
          const lateralProj = Math.abs(-dx * headingZ + dz * headingX);
          if (forwardProj > 0 && forwardProj < 7.5 && lateralProj < 2.4) {
            const sPed = Math.max(0.1, forwardProj - halfLen - 0.8);
            if (sPed < closestPedS) closestPedS = sPed;
          }
        }
      }
      if (closestPedS < Infinity) {
        const aPed = computeIDMInteraction(vCurr, vCurr, closestPedS, profile.aMax, profile.bComf * 1.4, 1.2, 0.6);
        if (aPed < minInteractionAccel) minInteractionAccel = aPed;
      }

      // Obstacle D: Emergency Ambulance Yielding
      // Replacement
      if (!vehicle.isEmergency && activeAmbulances.length > 0) {
        for (const amb of activeAmbulances) {
          if (amb.direction === vehicle.direction && amb.laneIndex === vehicle.laneIndex) {
            const ambDist = Math.hypot(amb.x - vehicle.x, amb.z - vehicle.z);
            if (ambDist < 30.0) {
              freeAccel = Math.min(freeAccel, -profile.bComf * 0.6);
            }
          }
        }
      }

      // 4. Net IDM Acceleration Integration with Non-Penetration Gap Enforcement
      const targetAccel = Math.max(-profile.bComf * 2.5, Math.min(profile.aMax, freeAccel + minInteractionAccel));
      vehicle.acceleration = targetAccel;
      let newSpeed = Math.max(0, vCurr + targetAccel * dt);
      newSpeed = Math.min(newSpeed, maxAllowedSpeed);
      vehicle.currentSpeed = newSpeed;

      // Stop detection & wait timer
      if (vehicle.currentSpeed < 0.05 && (minInteractionAccel < -0.5 || maxAllowedSpeed <= 0.05)) {
        vehicle.currentSpeed = 0;
        vehicle.waiting = true;
        vehicle.waitTime += dt;
      } else {
        vehicle.waiting = false;
      }

      // Brake light & turn signal status
      vehicle.isBraking = targetAccel < -0.8 || (vehicle.waiting && vehicle.currentSpeed === 0);
      if (!vehicle.passedIntersection && vehicle.turn !== 'straight') {
        vehicle.turnSignal = vehicle.turn;
      } else {
        vehicle.turnSignal = null;
      }

      // 5. Movement along trajectory
      if (vehicle.currentSpeed > 0) {
        const stepDist = vehicle.currentSpeed * dt;
        vehicle.distanceTraveled = (vehicle.distanceTraveled || 0) + stepDist;

        if (vehicle.turn === 'straight' || !vehicle.enteredIntersection || vehicle.passedIntersection) {
          const movement = vehicle.exitMovement || this.getMovementVector(vehicle.direction);
          vehicle.x += movement.dx * stepDist;
          vehicle.z += movement.dz * stepDist;

          if (!vehicle.passedIntersection && vehicle.enteredIntersection) {
            switch (vehicle.direction) {
              case 'north': if (vehicle.z > HALF_ROAD) vehicle.passedIntersection = true; break;
              case 'south': if (vehicle.z < -HALF_ROAD) vehicle.passedIntersection = true; break;
              case 'east': if (vehicle.x < -HALF_ROAD) vehicle.passedIntersection = true; break;
              case 'west': if (vehicle.x > HALF_ROAD) vehicle.passedIntersection = true; break;
            }
          }
        } else {
          const curve = TURN_CURVES[vehicle.turnKey];
          if (curve) {
            vehicle.turning = true;
            const curveLength = curve.arcLength || (vehicle.turn === 'left' ? 23.4 : 3.0);
            vehicle.turnProgress += (stepDist / curveLength);

            if (vehicle.turnProgress >= 1.0) {
              const excess = (vehicle.turnProgress - 1.0) * curveLength;
              vehicle.turning = false;
              vehicle.passedIntersection = true;
              vehicle.rotation = curve.exitDir.rot;
              vehicle.exitMovement = { dx: curve.exitDir.dx, dz: curve.exitDir.dz };
              vehicle.x = curve.p3[0] + curve.exitDir.dx * excess;
              vehicle.z = curve.p3[1] + curve.exitDir.dz * excess;
            } else {
              const pos = evalCubicBezier(curve.p0, curve.p1, curve.p2, curve.p3, vehicle.turnProgress);
              vehicle.x = pos.x;
              vehicle.z = pos.z;
              vehicle.rotation = pos.rotation;
            }
          } else {
            const movement = this.getMovementVector(vehicle.direction);
            vehicle.x += movement.dx * stepDist;
            vehicle.z += movement.dz * stepDist;
          }
        }
      }
    });

    // Remove despawned vehicles
    const prevCount = state.vehicles.length;
    vehicles = vehicles.filter((v) => !toRemove.includes(v.id));

    // Calculate waiting vehicles stats
    const waitingCounts = { north: 0, south: 0, east: 0, west: 0 };
    vehicles.forEach((v) => {
      if (v.waiting) waitingCounts[v.direction]++;
    });

    if (vehicles.length !== prevCount || toRemove.length > 0) {
      store.getState().setVehicles(vehicles);
    }

    // Stats throttle
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
      store.getState().updateStats({ vehiclesWaiting: waitingCounts });
      if (state.selectedVehicleId) {
        store.getState().setVehicles([...vehicles]);
      }
    }
  }
}
