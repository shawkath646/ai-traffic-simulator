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

    // Movement wait times tracking
    this.waitTimes = {
      'ns-left': 0,
      'ns-through': 0,
      'ew-left': 0,
      'ew-through': 0,
    };
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
    this.waitTimes = {
      'ns-left': 0,
      'ns-through': 0,
      'ew-left': 0,
      'ew-through': 0,
    };
  }

  syncFromCurrentState(store) {
    const state = store.getState();
    const rawPhase = state.currentPhase || 'ew-through';
    const basePhase = rawPhase.split('-')[0] + '-' + (rawPhase.includes('left') ? 'left' : 'through');
    if (['ns-left', 'ns-through', 'ew-left', 'ew-through'].includes(basePhase)) {
      this.currentPhase = basePhase;
      this.phaseTimer = 0;
      this.decisionTimer = 0;
      this.transitionState = 'none';
      this.transitionTimer = 0;
      this.nextPhase = null;
      this.lastAppliedLights = null;
    }
  }

  // Calculate demand score for a phase
  computePhaseScore(phaseName, store) {
    const state = store.getState();
    const vehicles = state.vehicles;
    const pedestrians = state.pedestrians;

    let vehicleCount = 0;
    let maxWaitTime = 0;
    let sumWaitTime = 0;
    let pedestrianCount = 0;

    // Filter vehicles for this movement phase
    vehicles.forEach((v) => {
      if (v.passedIntersection) return;

      let matches = false;
      if (phaseName === 'ns-left') {
        matches = (v.direction === 'north' || v.direction === 'south') && v.turn === 'left';
      } else if (phaseName === 'ns-through') {
        matches = (v.direction === 'north' || v.direction === 'south') && v.turn !== 'left';
      } else if (phaseName === 'ew-left') {
        matches = (v.direction === 'east' || v.direction === 'west') && v.turn === 'left';
      } else if (phaseName === 'ew-through') {
        matches = (v.direction === 'east' || v.direction === 'west') && v.turn !== 'left';
      }

      if (matches && (v.waiting || (state.simulationMode === 'low_power' && !v.passedIntersection))) {
        vehicleCount++;
        sumWaitTime += v.waitTime;
        if (v.waitTime > maxWaitTime) maxWaitTime = v.waitTime;
      }
    });

    const simMode = state.simulationMode || 'custom';
    if (simMode === 'low_power' && vehicleCount > 0) {
      // In low power mode, immediately award high urgency to oncoming lone vehicle
      maxWaitTime += 15;
      vehicleCount += 6;
    }

    if (simMode === 'asymmetric_rush' && (phaseName === 'ew-through' || phaseName === 'ew-left')) {
      // Reward clearing dense East-West commuter platoons
      vehicleCount *= 1.45;
    }

    // Count waiting pedestrians for crosswalks allowed in this phase
    // In ns-through: pedestrians cross East & West roads (east & west crosswalks)
    // In ew-through: pedestrians cross North & South roads (north & south crosswalks)
    if (phaseName === 'ns-through') {
      pedestrians.forEach((p) => {
        if ((p.crosswalkDirection === 'east' || p.crosswalkDirection === 'west') && p.waiting) {
          pedestrianCount++;
        }
      });
    } else if (phaseName === 'ew-through') {
      pedestrians.forEach((p) => {
        if ((p.crosswalkDirection === 'north' || p.crosswalkDirection === 'south') && p.waiting) {
          pedestrianCount++;
        }
      });
    }

    const avgWait = vehicleCount > 0 ? sumWaitTime / vehicleCount : 0;
    const phaseWait = this.waitTimes[phaseName] || 0;
    const pedWeight = simMode === 'pedestrian_rush' ? 9.5 : AI_PEDESTRIAN_WEIGHT;

    // Advanced pressure scoring formula
    const score =
      vehicleCount * AI_VEHICLE_WEIGHT +
      avgWait * AI_WAIT_TIME_WEIGHT +
      maxWaitTime * AI_MAX_WAIT_WEIGHT +
      phaseWait * 0.5 +
      pedestrianCount * pedWeight;

    return {
      score,
      vehicleCount,
      maxWaitTime,
      pedestrianCount,
    };
  }

  // Check if any pedestrian is actively in the crosswalk for conflicting phases
  hasPedestriansCrossing(store) {
    const state = store.getState();
    // In ns-through, east & west crosswalks are active
    // In ew-through, north & south crosswalks are active
    const activeCrosswalks =
      this.currentPhase === 'ns-through'
        ? ['east', 'west']
        : this.currentPhase === 'ew-through'
          ? ['north', 'south']
          : [];

    return state.pedestrians.some(
      (p) => p.crossing && activeCrosswalks.includes(p.crosswalkDirection)
    );
  }

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

    const activeDirs =
      phaseName === 'ns-through' ? ['east', 'west'] : phaseName === 'ew-through' ? ['north', 'south'] : [];

    activeDirs.forEach((dir) => {
      peds[dir] = clearance ? 'flashing' : 'walk';
      countdowns[dir] = remainingSeconds;
    });

    return { peds, countdowns };
  }

  update(delta, store) {
    this.phaseTimer += delta;

    // Accumulate wait time for inactive movements
    const phases = ['ns-left', 'ns-through', 'ew-left', 'ew-through'];
    phases.forEach((p) => {
      if (p !== this.currentPhase) {
        this.waitTimes[p] = (this.waitTimes[p] || 0) + delta;
      }
    });

    // Check for approaching emergency vehicles (Ambulance)
    const state = store.getState();
    const vehicles = state.vehicles || [];
    const approachingAmbulance = vehicles
      .filter(
        (v) =>
          v.isEmergency &&
          !v.passedIntersection &&
          (
            (v.direction === 'north' && v.z < 0) ||
            (v.direction === 'south' && v.z > 0) ||
            (v.direction === 'east' && v.x > 0) ||
            (v.direction === 'west' && v.x < 0)
          )
      )
      .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0];

    let targetEmergencyPhase = null;
    if (approachingAmbulance) {
      if (approachingAmbulance.direction === 'north' || approachingAmbulance.direction === 'south') {
        targetEmergencyPhase = approachingAmbulance.turn === 'left' ? 'ns-left' : 'ns-through';
      } else {
        targetEmergencyPhase = approachingAmbulance.turn === 'left' ? 'ew-left' : 'ew-through';
      }
    }

    // Emergency Preemption Handling
    if (targetEmergencyPhase) {
      store.getState().updateStats({ emergencyPreemption: true });

      // If the light is already green for the ambulance, lock green on and hold
      if (this.currentPhase === targetEmergencyPhase && this.transitionState === 'none') {
        this.phaseTimer = 0; // Hold green until ambulance has safely cleared
        const lights = this.getLightsForPhase(this.currentPhase);
        const { peds, countdowns } = this.getPedestrianSignalsForPhase(this.currentPhase, false, 30);
        this.applySignals(lights, peds, countdowns, store);
        return;
      }

      // If different phase, initiate preemptive switch with pedestrian safety check
      const hasCrossingPeds = this.hasPedestriansCrossing(store);

      if (this.transitionState === 'none') {
        if (hasCrossingPeds) {
          // Check pedestrian mid-way: allow active pedestrians to finish crossing safely first!
          this.transitionState = 'ped_clearance';
          this.transitionTimer = 0;
          this.nextPhase = targetEmergencyPhase;
        } else {
          // No pedestrians mid-way crossing: rapid switch to yellow
          this.transitionState = 'yellow';
          this.transitionTimer = 0;
          this.nextPhase = targetEmergencyPhase;
        }
      } else if (this.transitionState === 'ped_clearance') {
        this.nextPhase = targetEmergencyPhase;
        this.transitionTimer += delta;
        const remaining = Math.max(0, Math.ceil(PEDESTRIAN_CLEARANCE_DURATION - this.transitionTimer));
        const { peds, countdowns } = this.getPedestrianSignalsForPhase(this.currentPhase, true, remaining);
        const lights = this.getLightsForPhase(this.currentPhase);
        this.applySignals(lights, peds, countdowns, store);

        // Transition to yellow once pedestrians have finished crossing
        if (!hasCrossingPeds || this.transitionTimer >= PEDESTRIAN_CLEARANCE_DURATION) {
          this.transitionState = 'yellow';
          this.transitionTimer = 0;
        }
        return;
      } else if (this.transitionState === 'yellow') {
        this.nextPhase = targetEmergencyPhase;
        this.transitionTimer += delta;
        const yellowLights = this.getYellowLightsForPhase(this.currentPhase);
        const { peds, countdowns } = this.getPedestrianSignalsForPhase(this.currentPhase, true, 0);
        Object.keys(peds).forEach((k) => (peds[k] = 'stop'));
        this.applySignals(yellowLights, peds, countdowns, store);

        if (this.transitionTimer >= YELLOW_DURATION) {
          this.transitionState = 'all_red';
          this.transitionTimer = 0;
        }
        return;
      } else if (this.transitionState === 'all_red') {
        this.transitionTimer += delta;
        const allRedLights = this.getLightsForPhase('all-red');
        const peds = { north: 'stop', south: 'stop', east: 'stop', west: 'stop' };
        const countdowns = { north: 0, south: 0, east: 0, west: 0 };
        this.applySignals(allRedLights, peds, countdowns, store);
        store.getState().setCurrentPhase('all-red');

        if (this.transitionTimer >= ALL_RED_DURATION) {
          this.currentPhase = targetEmergencyPhase;
          this.waitTimes[this.currentPhase] = 0;
          this.phaseTimer = 0;
          this.transitionState = 'none';
          this.transitionTimer = 0;
          this.nextPhase = null;

          const newLights = this.getLightsForPhase(this.currentPhase);
          const { peds: newPeds, countdowns: newCountdowns } = this.getPedestrianSignalsForPhase(
            this.currentPhase,
            false,
            24
          );
          this.applySignals(newLights, newPeds, newCountdowns, store);
          store.getState().setCurrentPhase(this.currentPhase);
        }
        return;
      }
    } else {
      store.getState().updateStats({ emergencyPreemption: false });
    }

    // Handle normal active transitions (ped clearance -> yellow -> all red)
    if (this.transitionState !== 'none') {
      this.transitionTimer += delta;

      if (this.transitionState === 'ped_clearance') {
        const remaining = Math.max(0, Math.ceil(PEDESTRIAN_CLEARANCE_DURATION - this.transitionTimer));
        const { peds, countdowns } = this.getPedestrianSignalsForPhase(
          this.currentPhase,
          true,
          remaining
        );
        const lights = this.getLightsForPhase(this.currentPhase);
        this.applySignals(lights, peds, countdowns, store);

        // Don't terminate pedestrian clearance while pedestrians are still inside the crosswalk
        const hasCrossing = this.hasPedestriansCrossing(store);
        if (this.transitionTimer >= PEDESTRIAN_CLEARANCE_DURATION && !hasCrossing) {
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
        const allRedLights = this.getLightsForPhase('all-red');
        const peds = { north: 'stop', south: 'stop', east: 'stop', west: 'stop' };
        const countdowns = { north: 0, south: 0, east: 0, west: 0 };
        this.applySignals(allRedLights, peds, countdowns, store);
        store.getState().setCurrentPhase('all-red');

        if (this.transitionTimer >= ALL_RED_DURATION) {
          // Switch to new winner phase
          this.currentPhase = this.nextPhase || 'ew-through';
          this.waitTimes[this.currentPhase] = 0;
          this.phaseTimer = 0;
          this.transitionState = 'none';
          this.transitionTimer = 0;
          this.nextPhase = null;

          const newLights = this.getLightsForPhase(this.currentPhase);
          const { peds: newPeds, countdowns: newCountdowns } = this.getPedestrianSignalsForPhase(
            this.currentPhase,
            false,
            24
          );
          this.applySignals(newLights, newPeds, newCountdowns, store);
          store.getState().setCurrentPhase(this.currentPhase);
        }
        return;
      }
    }

    // Standard Green operation: update live countdown when seconds change
    const estRemaining = Math.max(0, Math.ceil(AI_MAX_GREEN_TIME - this.phaseTimer));
    if (estRemaining !== this.lastEstRemaining) {
      this.lastEstRemaining = estRemaining;
      const { peds, countdowns } = this.getPedestrianSignalsForPhase(
        this.currentPhase,
        false,
        estRemaining
      );
      const lights = this.getLightsForPhase(this.currentPhase);
      this.applySignals(lights, peds, countdowns, store);
    }

    // AI decision tick
    this.decisionTimer += delta;
    if (this.decisionTimer < AI_DECISION_INTERVAL) return;
    this.decisionTimer = 0;

    // Minimum green hold:
    // If simulationMode is low_power or current phase has zero vehicles and zero waiting pedestrians,
    // allow fast dynamic transition after just 1.8s! Otherwise use AI_MIN_GREEN_TIME.
    const simMode = state.simulationMode || 'custom';
    const currentPhaseResult = this.computePhaseScore(this.currentPhase, store);
    const currentActiveDemand = currentPhaseResult.vehicleCount + currentPhaseResult.pedestrianCount;
    const minGreen = (simMode === 'low_power' || currentActiveDemand === 0) ? 1.8 : AI_MIN_GREEN_TIME;

    if (this.phaseTimer < minGreen) return;

    // Score all candidate phases
    const scores = {};
    let highestScore = -1;
    let bestPhase = this.currentPhase;

    phases.forEach((p) => {
      const result = this.computePhaseScore(p, store);
      scores[p] = result.score;
      if (p !== this.currentPhase && result.score > highestScore) {
        highestScore = result.score;
        bestPhase = p;
      }
    });

    // Update stats for UI panel
    store.getState().updateStats({
      aiScores: {
        ns: (scores['ns-through'] || 0) + (scores['ns-left'] || 0),
        ew: (scores['ew-through'] || 0) + (scores['ew-left'] || 0),
      },
      currentWaitTime: {
        ns: Math.max(this.waitTimes['ns-through'] || 0, this.waitTimes['ns-left'] || 0),
        ew: Math.max(this.waitTimes['ew-through'] || 0, this.waitTimes['ew-left'] || 0),
      },
    });

    const currentScore = currentPhaseResult.score;

    // Switch criteria:
    // 1. Exceeded max green time (allow up to 55s for East-West commuter platoon rush)
    // 2. Current phase has cleared (0 vehicles and 0 pedestrians) and another phase has demand
    // 3. Competing phase has significantly higher pressure/urgency
    const maxGreen =
      simMode === 'asymmetric_rush' && (this.currentPhase === 'ew-through' || this.currentPhase === 'ew-left')
        ? 55
        : AI_MAX_GREEN_TIME;
    const forceSwitch = this.phaseTimer >= maxGreen;
    const currentCleared = currentActiveDemand === 0 && highestScore > 0;
    const highPressureSwitch = highestScore > currentScore * 1.35 && highestScore > 9;

    if (forceSwitch || currentCleared || highPressureSwitch) {
      this.nextPhase = bestPhase;

      // If current phase includes active pedestrians, enter pedestrian clearance first
      const hasCrossingPeds = this.hasPedestriansCrossing(store);
      const isPedPhase = this.currentPhase === 'ns-through' || this.currentPhase === 'ew-through';

      if (isPedPhase || hasCrossingPeds) {
        this.transitionState = 'ped_clearance';
        this.transitionTimer = 0;
      } else {
        this.transitionState = 'yellow';
        this.transitionTimer = 0;
      }
    }
  }
}
