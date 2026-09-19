import {
  AI_DECISION_INTERVAL,
  AI_MIN_GREEN_TIME,
  AI_MAX_GREEN_TIME,
  AI_VEHICLE_WEIGHT,
  AI_WAIT_TIME_WEIGHT,
  AI_MAX_WAIT_WEIGHT,
  AI_PEDESTRIAN_WEIGHT,
  YELLOW_DURATION,
  ALL_RED_DURATION,
  PEDESTRIAN_CLEARANCE_DURATION,
} from '../utils/constants';

// 4 operational phases for 3-lane intersection:
// 1. 'ns-left': North & South Left Turn Lanes (Lane 0)
// 2. 'ns-through': North & South Through Lanes (Lanes 1 & 2) + EW Crosswalks
// 3. 'ew-left': East & West Left Turn Lanes (Lane 0)
// 4. 'ew-through': East & West Through Lanes (Lanes 1 & 2) + NS Crosswalks
const PHASES = ['ns-left', 'ns-through', 'ew-left', 'ew-through'];

// Crosswalks that get WALK during each phase
const CROSSWALKS_BY_PHASE = {
  'ns-through': ['east', 'west'],
  'ew-through': ['north', 'south'],
};

// ---------------------------------------------------------------------------
// Tunables (all "intelligence" knobs in one place)
// ---------------------------------------------------------------------------
const TUNING = {
  // Green may end this early when nobody is waiting AND nobody is approaching
  fastMinGreen: 1.8,

  // Gap-out detector: vehicles of the green phase closer than this to the
  // intersection centre (same units as v.x / v.z) keep the green alive.
  // Tune to your scene scale.
  detectorRange: 30,

  // A competing phase must beat the current one by this ratio...
  pressureRatio: 1.35,
  // ...plus a switching penalty, and exceed this absolute score
  minPressureScore: 9,
  // Score-equivalent cost per second of dead time (yellow + all-red + ped clearance)
  switchPenaltyPerSecond: 0.8,

  // Starvation guards: a phase with demand that has waited this long gets green next
  pedMaxWait: 60,
  vehicleMaxWait: 90,

  // Emergency preemption
  emergencyMargin: 3, // extra seconds of safety on top of clearance time
  emergencyNearDistance: 25, // always preempt inside this distance
  emergencyMinSpeed: 8, // assumed units/sec if v.speed is missing or tiny
  emergencyHoldCountdown: 30, // countdown shown while green is held
};

// Per-simulation-mode behaviour (replaces scattered magic numbers)
const DEFAULT_MODE_CONFIG = {
  countMovingVehicles: false, // also count vehicles that are not stopped
  lonelyWaitBoost: 0, // added to maxWaitTime when phase has any vehicle
  lonelyCountBoost: 0, // added to vehicleCount when phase has any vehicle
  fastSwitch: false, // always use fastMinGreen
  ewVehicleMultiplier: 1, // multiplier on East-West vehicle demand
  ewMaxGreen: null, // max green override for East-West phases
  pedWeight: AI_PEDESTRIAN_WEIGHT,
};

const MODE_CONFIG = {
  low_power: {
    countMovingVehicles: true,
    lonelyWaitBoost: 15,
    lonelyCountBoost: 6,
    fastSwitch: true,
  },
  asymmetric_rush: {
    ewVehicleMultiplier: 1.45,
    ewMaxGreen: 55,
  },
  pedestrian_rush: {
    pedWeight: 9.5,
  },
};

function getModeConfig(mode) {
  return { ...DEFAULT_MODE_CONFIG, ...(MODE_CONFIG[mode] || {}) };
}

function freshWaitTimes() {
  return { 'ns-left': 0, 'ns-through': 0, 'ew-left': 0, 'ew-through': 0 };
}

export class AITrafficController {
  constructor() {
    this.currentPhase = 'ew-through';
    this.phaseTimer = 0;
    this.decisionTimer = 0;
    this.transitionState = 'none'; // 'none' | 'ped_clearance' | 'yellow' | 'all_red'
    this.transitionTimer = 0;
    this.nextPhase = null;
    this.lastEstRemaining = -1;
    this.lastAppliedLights = null;
    this.lastEmergencyFlag = null;

    // Time each movement has been waiting WHILE it had demand
    this.waitTimes = freshWaitTimes();
  }

  reset() {
    this.currentPhase = 'ew-through';
    this.phaseTimer = 0;
    this.decisionTimer = 0;
    this.transitionState = 'none';
    this.transitionTimer = 0;
    this.nextPhase = null;
    this.lastEstRemaining = -1;
    this.lastAppliedLights = null;
    this.lastEmergencyFlag = null;
    this.waitTimes = freshWaitTimes();
  }

  syncFromCurrentState(store) {
    const state = store.getState();
    const rawPhase = state.currentPhase || 'ew-through';
    const basePhase = rawPhase.split('-')[0] + '-' + (rawPhase.includes('left') ? 'left' : 'through');
    if (PHASES.includes(basePhase)) {
      this.currentPhase = basePhase;
      this.phaseTimer = 0;
      this.decisionTimer = 0;
      this.transitionState = 'none';
      this.transitionTimer = 0;
      this.nextPhase = null;
      this.lastEstRemaining = -1;
      this.lastAppliedLights = null;
      this.lastEmergencyFlag = null;
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  isPedPhase(phaseName) {
    return !!CROSSWALKS_BY_PHASE[phaseName];
  }

  // Dead time incurred when leaving a phase (yellow + all-red + ped clearance)
  getClearanceTime(phaseName) {
    return (
      YELLOW_DURATION +
      ALL_RED_DURATION +
      (this.isPedPhase(phaseName) ? PEDESTRIAN_CLEARANCE_DURATION : 0)
    );
  }

  getMaxGreen(phaseName, cfg) {
    const isEW = phaseName === 'ew-through' || phaseName === 'ew-left';
    return isEW && cfg.ewMaxGreen ? cfg.ewMaxGreen : AI_MAX_GREEN_TIME;
  }

  matchesPhase(v, phaseName) {
    const isNS = v.direction === 'north' || v.direction === 'south';
    const isEW = v.direction === 'east' || v.direction === 'west';
    const isLeft = v.turn === 'left';
    switch (phaseName) {
      case 'ns-left':
        return isNS && isLeft;
      case 'ns-through':
        return isNS && !isLeft;
      case 'ew-left':
        return isEW && isLeft;
      case 'ew-through':
        return isEW && !isLeft;
      default:
        return false;
    }
  }

  // Vehicles of this phase that are moving (not queued) but close enough to
  // the intersection that cutting the green would strand them.
  countApproaching(phaseName, store) {
    const vehicles = store.getState().vehicles || [];
    let count = 0;
    for (const v of vehicles) {
      if (v.passedIntersection || v.waiting) continue;
      if (!this.matchesPhase(v, phaseName)) continue;
      if (Math.hypot(v.x, v.z) <= TUNING.detectorRange) count++;
    }
    return count;
  }

  setEmergencyFlag(store, active) {
    if (this.lastEmergencyFlag !== active) {
      this.lastEmergencyFlag = active;
      store.getState().updateStats({ emergencyPreemption: active });
    }
  }

  // -------------------------------------------------------------------------
  // Scoring
  // -------------------------------------------------------------------------

  // Calculate demand score for a phase
  computePhaseScore(phaseName, store) {
    const state = store.getState();
    const vehicles = state.vehicles;
    const pedestrians = state.pedestrians;
    const cfg = getModeConfig(state.simulationMode || 'custom');

    let vehicleCount = 0;
    let maxWaitTime = 0;
    let sumWaitTime = 0;
    let pedestrianCount = 0;

    vehicles.forEach((v) => {
      if (v.passedIntersection) return;
      if (!this.matchesPhase(v, phaseName)) return;
      if (v.waiting || cfg.countMovingVehicles) {
        vehicleCount++;
        sumWaitTime += v.waitTime;
        if (v.waitTime > maxWaitTime) maxWaitTime = v.waitTime;
      }
    });

    if (vehicleCount > 0) {
      // low_power: immediately award urgency to a lone oncoming vehicle
      maxWaitTime += cfg.lonelyWaitBoost;
      vehicleCount += cfg.lonelyCountBoost;
    }

    if (phaseName === 'ew-through' || phaseName === 'ew-left') {
      vehicleCount *= cfg.ewVehicleMultiplier;
    }

    // Waiting pedestrians on the crosswalks that this phase would release
    const crosswalks = CROSSWALKS_BY_PHASE[phaseName] || [];
    if (crosswalks.length > 0) {
      pedestrians.forEach((p) => {
        if (p.waiting && crosswalks.includes(p.crosswalkDirection)) pedestrianCount++;
      });
    }

    const avgWait = vehicleCount > 0 ? sumWaitTime / vehicleCount : 0;
    const phaseWait = this.waitTimes[phaseName] || 0;

    const score =
      vehicleCount * AI_VEHICLE_WEIGHT +
      avgWait * AI_WAIT_TIME_WEIGHT +
      maxWaitTime * AI_MAX_WAIT_WEIGHT +
      phaseWait * 0.5 +
      pedestrianCount * cfg.pedWeight;

    return { score, vehicleCount, maxWaitTime, pedestrianCount };
  }

  // Score every phase. A phase with no demand has no urgency: its accumulated
  // wait is cleared and its score forced to 0, so the controller never hands
  // green to an empty approach.
  evaluatePhases(store) {
    const results = {};
    PHASES.forEach((p) => {
      const r = this.computePhaseScore(p, store);
      if (r.vehicleCount + r.pedestrianCount === 0) {
        this.waitTimes[p] = 0;
        r.score = 0;
      }
      results[p] = r;
    });
    return results;
  }

  // Phase with demand that has waited past its starvation limit (worst first)
  findStarvedPhase(results) {
    let worst = null;
    let worstOver = 0;
    PHASES.forEach((p) => {
      if (p === this.currentPhase) return;
      const r = results[p];
      if (r.vehicleCount + r.pedestrianCount === 0) return;
      const limit = r.pedestrianCount > 0 ? TUNING.pedMaxWait : TUNING.vehicleMaxWait;
      const over = (this.waitTimes[p] || 0) - limit;
      if (over >= 0 && (worst === null || over > worstOver)) {
        worst = p;
        worstOver = over;
      }
    });
    return worst;
  }

  // Check if any pedestrian is actively in the crosswalk for the current phase
  hasPedestriansCrossing(store) {
    const state = store.getState();
    const activeCrosswalks = CROSSWALKS_BY_PHASE[this.currentPhase] || [];
    return state.pedestrians.some(
      (p) => p.crossing && activeCrosswalks.includes(p.crosswalkDirection)
    );
  }

  // -------------------------------------------------------------------------
  // Signal output
  // -------------------------------------------------------------------------

  // Apply traffic light states to store
  applySignals(lights, pedestrians, countdowns, store) {
    const signature = JSON.stringify(lights);
    if (this.lastAppliedLights !== signature) {
      this.lastAppliedLights = signature;
      store.getState().setTrafficLightStates(lights);
    }
    store.getState().setPedestrianSignals(pedestrians, countdowns);
  }

  getLightsForPhase(phaseName) {
    const allRed = {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    };

    switch (phaseName) {
      case 'ns-left':
        return {
          ...allRed,
          north: { through: 'red', left: 'green', right: 'red' },
          south: { through: 'red', left: 'green', right: 'red' },
        };
      case 'ns-through':
        return {
          ...allRed,
          north: { through: 'green', left: 'red', right: 'green' },
          south: { through: 'green', left: 'red', right: 'green' },
        };
      case 'ew-left':
        return {
          ...allRed,
          east: { through: 'red', left: 'green', right: 'red' },
          west: { through: 'red', left: 'green', right: 'red' },
        };
      case 'ew-through':
        return {
          ...allRed,
          east: { through: 'green', left: 'red', right: 'green' },
          west: { through: 'green', left: 'red', right: 'green' },
        };
      default:
        return allRed;
    }
  }

  getYellowLightsForPhase(phaseName) {
    const lights = this.getLightsForPhase(phaseName);
    if (phaseName === 'ns-left') {
      lights.north.left = 'yellow';
      lights.south.left = 'yellow';
    } else if (phaseName === 'ns-through') {
      lights.north.through = 'yellow';
      lights.north.right = 'yellow';
      lights.south.through = 'yellow';
      lights.south.right = 'yellow';
    } else if (phaseName === 'ew-left') {
      lights.east.left = 'yellow';
      lights.west.left = 'yellow';
    } else if (phaseName === 'ew-through') {
      lights.east.through = 'yellow';
      lights.east.right = 'yellow';
      lights.west.through = 'yellow';
      lights.west.right = 'yellow';
    }
    return lights;
  }

  getPedestrianSignalsForPhase(phaseName, clearance = false, remainingSeconds = 0) {
    const peds = { north: 'stop', south: 'stop', east: 'stop', west: 'stop' };
    const countdowns = { north: 0, south: 0, east: 0, west: 0 };

    (CROSSWALKS_BY_PHASE[phaseName] || []).forEach((dir) => {
      peds[dir] = clearance ? 'flashing' : 'walk';
      countdowns[dir] = remainingSeconds;
    });

    return { peds, countdowns };
  }

  // Green output for the current phase with the live estimated countdown
  refreshGreenSignals(store, force = false) {
    const cfg = getModeConfig(store.getState().simulationMode || 'custom');
    const estRemaining = Math.max(
      0,
      Math.ceil(this.getMaxGreen(this.currentPhase, cfg) - this.phaseTimer)
    );
    if (!force && estRemaining === this.lastEstRemaining) return;
    this.lastEstRemaining = estRemaining;

    const { peds, countdowns } = this.getPedestrianSignalsForPhase(
      this.currentPhase,
      false,
      estRemaining
    );
    this.applySignals(this.getLightsForPhase(this.currentPhase), peds, countdowns, store);
  }

  // -------------------------------------------------------------------------
  // Transitions (ped clearance -> yellow -> all red -> next phase)
  // -------------------------------------------------------------------------

  beginTransition(nextPhase, store, emergency = false) {
    this.nextPhase = nextPhase;
    this.transitionTimer = 0;
    const crossing = this.hasPedestriansCrossing(store);
    // Normal changes always flash the ped signal in a ped phase; emergency
    // changes only wait if someone is actually in the crosswalk.
    const needsPedClearance = emergency ? crossing : this.isPedPhase(this.currentPhase) || crossing;
    this.transitionState = needsPedClearance ? 'ped_clearance' : 'yellow';
  }

  runTransition(delta, store, emergency = false) {
    this.transitionTimer += delta;

    if (this.transitionState === 'ped_clearance') {
      const remaining = Math.max(0, Math.ceil(PEDESTRIAN_CLEARANCE_DURATION - this.transitionTimer));
      const { peds, countdowns } = this.getPedestrianSignalsForPhase(this.currentPhase, true, remaining);
      this.applySignals(this.getLightsForPhase(this.currentPhase), peds, countdowns, store);

      const hasCrossing = this.hasPedestriansCrossing(store);
      const timeUp = this.transitionTimer >= PEDESTRIAN_CLEARANCE_DURATION;
      // Normal: wait for full clearance AND empty crosswalk.
      // Emergency: leave as soon as the crosswalk empties (or clearance time is up).
      const done = emergency ? !hasCrossing || timeUp : timeUp && !hasCrossing;
      if (done) {
        this.transitionState = 'yellow';
        this.transitionTimer = 0;
      }
      return;
    }

    if (this.transitionState === 'yellow') {
      const yellowLights = this.getYellowLightsForPhase(this.currentPhase);
      const { peds, countdowns } = this.getPedestrianSignalsForPhase(this.currentPhase, true, 0);
      Object.keys(peds).forEach((k) => (peds[k] = 'stop'));
      this.applySignals(yellowLights, peds, countdowns, store);

      if (this.transitionTimer >= YELLOW_DURATION) {
        this.transitionState = 'all_red';
        this.transitionTimer = 0;
      }
      return;
    }

    if (this.transitionState === 'all_red') {
      const peds = { north: 'stop', south: 'stop', east: 'stop', west: 'stop' };
      const countdowns = { north: 0, south: 0, east: 0, west: 0 };
      this.applySignals(this.getLightsForPhase('all-red'), peds, countdowns, store);
      store.getState().setCurrentPhase('all-red');

      if (this.transitionTimer >= ALL_RED_DURATION) {
        this.currentPhase = this.nextPhase || 'ew-through';
        this.waitTimes[this.currentPhase] = 0;
        this.phaseTimer = 0;
        this.transitionState = 'none';
        this.transitionTimer = 0;
        this.nextPhase = null;

        this.refreshGreenSignals(store, true);
        store.getState().setCurrentPhase(this.currentPhase);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Emergency vehicle preemption
  // -------------------------------------------------------------------------

  isBeforeIntersection(v) {
    return (
      (v.direction === 'north' && v.z < 0) ||
      (v.direction === 'south' && v.z > 0) ||
      (v.direction === 'east' && v.x > 0) ||
      (v.direction === 'west' && v.x < 0)
    );
  }

  // The emergency vehicle that will reach the intersection first
  findEmergencyRequest(store) {
    const vehicles = store.getState().vehicles || [];
    let best = null;

    for (const v of vehicles) {
      if (!v.isEmergency || v.passedIntersection || !this.isBeforeIntersection(v)) continue;

      const dist = Math.hypot(v.x, v.z);
      const speed = Math.max(Math.abs(Number(v.speed)) || 0, TUNING.emergencyMinSpeed);
      const eta = dist / speed;
      if (best && eta >= best.eta) continue;

      const isNS = v.direction === 'north' || v.direction === 'south';
      const phase = isNS
        ? v.turn === 'left' ? 'ns-left' : 'ns-through'
        : v.turn === 'left' ? 'ew-left' : 'ew-through';

      best = { vehicle: v, dist, eta, phase };
    }
    return best;
  }

  // Returns true when preemption consumed this frame
  handleEmergency(delta, store) {
    const req = this.findEmergencyRequest(store);

    let active = false;
    if (req) {
      // Start early enough that the green is ready BEFORE the vehicle arrives
      const leadTime = this.getClearanceTime(this.currentPhase) + TUNING.emergencyMargin;
      active =
        req.phase === this.currentPhase ||
        req.dist <= TUNING.emergencyNearDistance ||
        req.eta <= leadTime;
    }

    this.setEmergencyFlag(store, active);
    if (!active) return false;

    // Its phase is already ours
    if (req.phase === this.currentPhase) {
      if (this.transitionState === 'none' || this.transitionState === 'ped_clearance') {
        // Cancel any not-yet-yellow change of phase and hold green
        this.transitionState = 'none';
        this.transitionTimer = 0;
        this.nextPhase = null;
        this.phaseTimer = 0; // hold until the vehicle has cleared

        const { peds, countdowns } = this.getPedestrianSignalsForPhase(
          this.currentPhase,
          false,
          TUNING.emergencyHoldCountdown
        );
        this.applySignals(this.getLightsForPhase(this.currentPhase), peds, countdowns, store);
        this.lastEstRemaining = -1; // refresh countdown when the hold ends
        return true;
      }
      // Yellow / all-red already running: it must finish, then we return to this phase
      this.nextPhase = req.phase;
      this.runTransition(delta, store, true);
      return true;
    }

    // Needs a different phase
    if (this.transitionState === 'none') {
      this.beginTransition(req.phase, store, true);
    } else {
      this.nextPhase = req.phase;
    }
    this.runTransition(delta, store, true);
    return true;
  }

  // -------------------------------------------------------------------------
  // Main loop
  // -------------------------------------------------------------------------

  update(delta, store) {
    this.phaseTimer += delta;

    // Accumulate wait time for inactive movements
    PHASES.forEach((p) => {
      if (p !== this.currentPhase) {
        this.waitTimes[p] = (this.waitTimes[p] || 0) + delta;
      }
    });

    // 1. Emergency preemption has priority over everything
    if (this.handleEmergency(delta, store)) return;

    // 2. Normal in-progress transition
    if (this.transitionState !== 'none') {
      this.runTransition(delta, store, false);
      return;
    }

    // 3. Standard green: refresh live countdown when the second changes
    this.refreshGreenSignals(store);

    // 4. AI decision tick
    this.decisionTimer += delta;
    if (this.decisionTimer < AI_DECISION_INTERVAL) return;
    this.decisionTimer = 0;

    const state = store.getState();
    const cfg = getModeConfig(state.simulationMode || 'custom');

    const results = this.evaluatePhases(store);
    const current = results[this.currentPhase];

    // Stats for UI panel
    const scores = {};
    PHASES.forEach((p) => (scores[p] = results[p].score));
    store.getState().updateStats({
      aiScores: {
        ns: scores['ns-through'] + scores['ns-left'],
        ew: scores['ew-through'] + scores['ew-left'],
      },
      currentWaitTime: {
        ns: Math.max(this.waitTimes['ns-through'] || 0, this.waitTimes['ns-left'] || 0),
        ew: Math.max(this.waitTimes['ew-through'] || 0, this.waitTimes['ew-left'] || 0),
      },
    });

    // Current phase still "busy"? Queued demand OR moving vehicles inside the
    // detector zone (gap-out: don't cut off a platoon that is still arriving).
    const currentDemand = current.vehicleCount + current.pedestrianCount;
    const approaching = this.countApproaching(this.currentPhase, store);
    const currentBusy = currentDemand + approaching > 0;

    const minGreen = cfg.fastSwitch || !currentBusy ? TUNING.fastMinGreen : AI_MIN_GREEN_TIME;
    if (this.phaseTimer < minGreen) return;

    // Best competing phase (only phases that actually have demand score > 0)
    let bestPhase = null;
    let bestScore = 0;
    PHASES.forEach((p) => {
      if (p === this.currentPhase) return;
      if (results[p].score > bestScore) {
        bestScore = results[p].score;
        bestPhase = p;
      }
    });

    // Starvation guard overrides the score ranking
    const starved = this.findStarvedPhase(results);
    if (starved) {
      bestPhase = starved;
      bestScore = results[starved].score;
    }

    // Nobody else wants green: rest in the current phase
    if (!bestPhase) return;

    // Switch criteria:
    // 1. Max green reached (and someone else is actually waiting)
    // 2. Current phase cleared: no queue, no pedestrians, nothing approaching
    // 3. Competing pressure beats current pressure by ratio + switching cost
    // 4. A phase is starved (ped / vehicle max-wait guarantee)
    const forceSwitch = this.phaseTimer >= this.getMaxGreen(this.currentPhase, cfg);
    const currentCleared = !currentBusy;
    const switchPenalty = this.getClearanceTime(this.currentPhase) * TUNING.switchPenaltyPerSecond;
    const highPressureSwitch =
      bestScore > current.score * TUNING.pressureRatio + switchPenalty &&
      bestScore > TUNING.minPressureScore;

    if (forceSwitch || currentCleared || highPressureSwitch || starved) {
      this.beginTransition(bestPhase, store, false);
    }
  }
}