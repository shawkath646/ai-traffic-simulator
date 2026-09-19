import { create } from 'zustand';

const useSimulationStore = create((set) => ({
  // Control mode
  mode: 'traditional', // 'traditional' | 'ai'
  setMode: (mode) => set({ mode }),

  // Simulation speed
  simulationSpeed: 1,
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  // Traffic light states: each direction has 'through', 'left', and 'right' signals
  trafficLightStates: {
    north: { through: 'red', left: 'red', right: 'red' },
    south: { through: 'red', left: 'red', right: 'red' },
    east: { through: 'green', left: 'green', right: 'green' },
    west: { through: 'green', left: 'green', right: 'green' },
  },
  setTrafficLightStates: (states) => set({ trafficLightStates: states }),

  // Pedestrian signals: 'walk' | 'flashing' | 'stop'
  pedestrianSignals: {
    north: 'stop',
    south: 'stop',
    east: 'walk',
    west: 'walk',
  },
  pedestrianCountdowns: {
    north: 0,
    south: 0,
    east: 18,
    west: 18,
  },
  setPedestrianSignals: (signals, countdowns = {}) =>
    set((state) => ({
      pedestrianSignals: signals,
      pedestrianCountdowns: { ...state.pedestrianCountdowns, ...countdowns },
    })),

  // Current phase info
  currentPhase: 'ew-through', // 'ns-left' | 'ns-through' | 'ew-left' | 'ew-through' | 'clearance'
  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  // Vehicles
  vehicles: [],
  setVehicles: (vehicles) => set({ vehicles }),

  // Pedestrians
  pedestrians: [],
  setPedestrians: (pedestrians) => set({ pedestrians }),

  // Stats
  stats: {
    vehiclesWaiting: { north: 0, south: 0, east: 0, west: 0 },
    pedestriansWaiting: { north: 0, south: 0, east: 0, west: 0 },
    activePedestriansCrossing: 0,
    aiScores: { ns: 0, ew: 0 },
    currentWaitTime: { ns: 0, ew: 0 },
  },
  setStats: (stats) => set({ stats }),
  updateStats: (partial) => set((state) => ({ stats: { ...state.stats, ...partial } })),

  // Pedestrians currently crossing (for AI safety)
  crossingPedestrians: [],
  setCrossingPedestrians: (list) => set({ crossingPedestrians: list }),

  // Simulation clock
  elapsedTime: 0,
  setElapsedTime: (t) => set({ elapsedTime: t }),

  // Paused
  paused: false,
  setPaused: (p) => set({ paused: p }),

  // Simulation Presets & Intensities
  simulationMode: 'custom', // 'custom' | 'low_power' | 'pedestrian_rush' | 'asymmetric_rush' | 'emergency'
  setSimulationMode: (mode) => {
    let vInt = 'mid';
    let pInt = 'mid';
    if (mode === 'low_power') {
      vInt = 'low';
      pInt = 'low';
    } else if (mode === 'pedestrian_rush') {
      vInt = 'mid';
      pInt = 'extreme';
    } else if (mode === 'asymmetric_rush') {
      vInt = 'extreme';
      pInt = 'mid';
    } else if (mode === 'emergency') {
      vInt = 'mid';
      pInt = 'mid';
    }
    set((state) => {
      let vehicles = state.vehicles;
      if (mode === 'low_power' && vehicles.length > 2) {
        // Preserve active vehicles inside the intersection + nearest 1 approaching vehicle for instant demo
        const inside = vehicles.filter((v) => v.enteredIntersection && !v.passedIntersection);
        const nearest = vehicles
          .filter((v) => !v.enteredIntersection && !v.passedIntersection)
          .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))
          .slice(0, 1);
        vehicles = [...inside, ...nearest];
      }

      return {
        simulationMode: mode,
        vehicleIntensity: vInt,
        pedestrianIntensity: pInt,
        vehicles,
        dispatchAmbulanceTrigger: mode === 'emergency' ? state.dispatchAmbulanceTrigger + 1 : state.dispatchAmbulanceTrigger,
      };
    });
  },

  vehicleIntensity: 'mid', // 'low' | 'mid' | 'high' | 'extreme'
  setVehicleIntensity: (intensity) => set({ vehicleIntensity: intensity }),

  pedestrianIntensity: 'mid', // 'low' | 'mid' | 'high' | 'extreme'
  setPedestrianIntensity: (intensity) => set({ pedestrianIntensity: intensity }),

  // Dispatch emergency ambulance on-demand
  dispatchAmbulanceTrigger: 0,
  dispatchAmbulance: () =>
    set((state) => ({ dispatchAmbulanceTrigger: state.dispatchAmbulanceTrigger + 1 })),

  // Selected vehicle for inspector & zoom tracking
  selectedVehicleId: null,
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  // Anti-Gridlock Collision Prevention (Fully Autonomous AI)
  antiGridlockActive: false,
  setAntiGridlockActive: (active) => set({ antiGridlockActive: active }),

  // Real-time rendering performance metrics (FPS, draw calls, triangles)
  perfStats: { fps: 60, drawCalls: 0, triangles: 0 },
  setPerfStats: (perfStats) => set({ perfStats }),
}));

export default useSimulationStore;
