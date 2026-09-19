import {
  LEFT_GREEN_DURATION,
  THROUGH_GREEN_DURATION,
  YELLOW_DURATION,
  ALL_RED_DURATION,
  PEDESTRIAN_CLEARANCE_DURATION,
} from '../utils/constants';

// Realistic 4-movement cycle for 3-lane intersections:
// 1. NS Protected Left Turns -> Yellow -> All-Red
// 2. NS Through & Right Turns (EW Pedestrians Cross) -> Yellow -> All-Red
// 3. EW Protected Left Turns -> Yellow -> All-Red
// 4. EW Through & Right Turns (NS Pedestrians Cross) -> Yellow -> All-Red
const PHASES = [
  // 1. NS Left Turn Phase
  {
    name: 'ns-left',
    duration: LEFT_GREEN_DURATION,
    lights: {
      north: { through: 'red', left: 'green', right: 'red' },
      south: { through: 'red', left: 'green', right: 'red' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },
  {
    name: 'ns-left-yellow',
    duration: YELLOW_DURATION,
    lights: {
      north: { through: 'red', left: 'yellow', right: 'red' },
      south: { through: 'red', left: 'yellow', right: 'red' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },
  {
    name: 'all-red-1',
    duration: ALL_RED_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },

  // 2. NS Through & Right Phase (EW Pedestrians cross EW street)
  {
    name: 'ns-through',
    duration: THROUGH_GREEN_DURATION,
    lights: {
      north: { through: 'green', left: 'red', right: 'green' },
      south: { through: 'green', left: 'red', right: 'green' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'walk', west: 'walk' },
  },
  {
    name: 'ns-through-yellow',
    duration: YELLOW_DURATION,
    lights: {
      north: { through: 'yellow', left: 'red', right: 'yellow' },
      south: { through: 'yellow', left: 'red', right: 'yellow' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'flashing', west: 'flashing' },
  },
  {
    name: 'all-red-2',
    duration: ALL_RED_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },

  // 3. EW Left Turn Phase
  {
    name: 'ew-left',
    duration: LEFT_GREEN_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'red', left: 'green', right: 'red' },
      west: { through: 'red', left: 'green', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },
  {
    name: 'ew-left-yellow',
    duration: YELLOW_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'red', left: 'yellow', right: 'red' },
      west: { through: 'red', left: 'yellow', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },
  {
    name: 'all-red-3',
    duration: ALL_RED_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },

  // 4. EW Through & Right Phase (NS Pedestrians cross NS street)
  {
    name: 'ew-through',
    duration: THROUGH_GREEN_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'green', left: 'red', right: 'green' },
      west: { through: 'green', left: 'red', right: 'green' },
    },
    pedestrians: { north: 'walk', south: 'walk', east: 'stop', west: 'stop' },
  },
  {
    name: 'ew-through-yellow',
    duration: YELLOW_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'yellow', left: 'red', right: 'yellow' },
      west: { through: 'yellow', left: 'red', right: 'yellow' },
    },
    pedestrians: { north: 'flashing', south: 'flashing', east: 'stop', west: 'stop' },
  },
  {
    name: 'all-red-4',
    duration: ALL_RED_DURATION,
    lights: {
      north: { through: 'red', left: 'red', right: 'red' },
      south: { through: 'red', left: 'red', right: 'red' },
      east: { through: 'red', left: 'red', right: 'red' },
      west: { through: 'red', left: 'red', right: 'red' },
    },
    pedestrians: { north: 'stop', south: 'stop', east: 'stop', west: 'stop' },
  },
];

export class TraditionalController {
  constructor(store) {
    this.currentPhaseIndex = 0;
    this.phaseTimer = 0;
    this.lastRemainingTime = -1;
    if (store) {
      const initialPhase = PHASES[0];
      store.getState().setTrafficLightStates(initialPhase.lights);
      store.getState().setPedestrianSignals(initialPhase.pedestrians);
      store.getState().setCurrentPhase(initialPhase.name);
    }
  }

  reset() {
    this.currentPhaseIndex = 0;
    this.phaseTimer = 0;
    this.lastRemainingTime = -1;
  }

  syncFromCurrentState(store) {
    const state = store.getState();
    const phaseName = state.currentPhase || 'ew-through';
    const idx = PHASES.findIndex((p) => p.name === phaseName || p.name.startsWith(phaseName));
    if (idx !== -1) {
      this.currentPhaseIndex = idx;
      this.phaseTimer = 0;
      this.lastRemainingTime = -1;
    }
  }

  getCurrentPhase() {
    return PHASES[this.currentPhaseIndex];
  }

  update(delta, store) {
    this.phaseTimer += delta;
    const currentPhase = this.getCurrentPhase();

    // Calculate remaining pedestrian countdown
    const remainingTime = Math.max(0, Math.ceil(currentPhase.duration - this.phaseTimer));

    if (remainingTime !== this.lastRemainingTime) {
      this.lastRemainingTime = remainingTime;
      const countdowns = {
        north: currentPhase.pedestrians.north !== 'stop' ? remainingTime : 0,
        south: currentPhase.pedestrians.south !== 'stop' ? remainingTime : 0,
        east: currentPhase.pedestrians.east !== 'stop' ? remainingTime : 0,
        west: currentPhase.pedestrians.west !== 'stop' ? remainingTime : 0,
      };

      // Pedestrian signal transitions to flashing hand when nearing the end
      const pedSignals = { ...currentPhase.pedestrians };
      if (remainingTime <= PEDESTRIAN_CLEARANCE_DURATION) {
        Object.keys(pedSignals).forEach((dir) => {
          if (pedSignals[dir] === 'walk') pedSignals[dir] = 'flashing';
        });
      }

      store.getState().setPedestrianSignals(pedSignals, countdowns);
    }

    if (this.phaseTimer >= currentPhase.duration) {
      this.phaseTimer = 0;
      this.currentPhaseIndex = (this.currentPhaseIndex + 1) % PHASES.length;
      const newPhase = this.getCurrentPhase();
      const initialCountdowns = {
        north: newPhase.pedestrians.north !== 'stop' ? Math.ceil(newPhase.duration) : 0,
        south: newPhase.pedestrians.south !== 'stop' ? Math.ceil(newPhase.duration) : 0,
        east: newPhase.pedestrians.east !== 'stop' ? Math.ceil(newPhase.duration) : 0,
        west: newPhase.pedestrians.west !== 'stop' ? Math.ceil(newPhase.duration) : 0,
      };
      this.lastRemainingTime = Math.ceil(newPhase.duration);

      store.getState().setTrafficLightStates(newPhase.lights);
      store.getState().setPedestrianSignals(newPhase.pedestrians, initialCountdowns);
      store.getState().setCurrentPhase(newPhase.name);
    }
  }
}
