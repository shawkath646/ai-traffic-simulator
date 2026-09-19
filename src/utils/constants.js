// Road & 3-lane intersection dimensions
export const NUM_LANES_PER_DIR = 3;
export const LANE_WIDTH = 3.8;
export const MEDIAN_WIDTH = 1.6;
export const HALF_ROAD = NUM_LANES_PER_DIR * LANE_WIDTH + MEDIAN_WIDTH / 2; // 12.2m
export const ROAD_WIDTH = HALF_ROAD * 2; // 24.4m
export const ROAD_LENGTH = 90;
export const INTERSECTION_SIZE = ROAD_WIDTH;
export const SIDEWALK_WIDTH = 4.5;
export const SIDEWALK_HEIGHT = 0.3;
export const CROSSWALK_WIDTH = 4.5;
export const CROSSWALK_DISTANCE = HALF_ROAD + 2.25; // 14.45m from center
export const VEHICLE_STOP_DISTANCE = HALF_ROAD + 5.0; // 17.2m from center (safely before crosswalk)

// Lane lateral offsets from center median for incoming traffic:
// Lane 0: Left Turn Only (closest to median)
// Lane 1: Through/Straight (middle)
// Lane 2: Through & Right Turn (curbside)
export const LANE_OFFSETS = [
  MEDIAN_WIDTH / 2 + LANE_WIDTH * 0.5, // 2.7m
  MEDIAN_WIDTH / 2 + LANE_WIDTH * 1.5, // 6.5m
  MEDIAN_WIDTH / 2 + LANE_WIDTH * 2.5, // 10.3m
];

// Traffic light timing (traditional mode)
export const LEFT_GREEN_DURATION = 14;
export const THROUGH_GREEN_DURATION = 28;
export const YELLOW_DURATION = 4;
export const ALL_RED_DURATION = 2;
export const PEDESTRIAN_WALK_DURATION = 18;
export const PEDESTRIAN_CLEARANCE_DURATION = 8; // flashing hand countdown

// AI controller parameters
export const AI_DECISION_INTERVAL = 1.5; // check optimization every 1.5 seconds
export const AI_MIN_GREEN_TIME = 8;
export const AI_MAX_GREEN_TIME = 45;
export const AI_VEHICLE_WEIGHT = 3.5;
export const AI_WAIT_TIME_WEIGHT = 2.0;
export const AI_MAX_WAIT_WEIGHT = 2.5;
export const AI_PEDESTRIAN_WEIGHT = 2.5;

// Vehicle parameters - using pre-created GLB models
export const VEHICLE_TYPES = [
  { name: 'car', model: '/models/car.glb', scale: 1.0, width: 1.8, height: 1.2, length: 4.2, probability: 0.22 },
  { name: 'taxi', model: '/models/taxi.glb', scale: 1.0, width: 1.8, height: 1.3, length: 4.2, probability: 0.15 },
  { name: 'truck', model: '/models/truck.glb', scale: 8.2, width: 2.4, height: 2.0, length: 4.4, probability: 0.10 },
  { name: 'suv', model: '/models/suv.glb', scale: 1.0, width: 2.1, height: 1.5, length: 4.2, probability: 0.18 },
  { name: 'pickup', model: '/models/pickup.glb', scale: 1.0, width: 2.3, height: 1.8, length: 5.2, probability: 0.12 },
  { name: 'police_car', model: '/models/police_car.glb', scale: 1.0, width: 1.8, height: 1.2, length: 3.8, probability: 0.08 },
  { name: 'bus', model: '/models/bus.glb', scale: 0.055, width: 2.7, height: 2.7, length: 8.6, probability: 0.10 },
  { name: 'ambulance', model: '/models/ambulance.glb', scale: 0.27, width: 2.5, height: 2.6, length: 5.8, isEmergency: true, probability: 0.05 },
];
export const VEHICLE_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#ecf0f1', '#34495e', '#f1c40f',
  '#c0392b', '#2980b9', '#27ae60', '#d35400', '#8e44ad',
];
export const VEHICLE_SPEED_BASE = 8; // units per second
export const VEHICLE_SPEED_VARIATION = 3;
export const VEHICLE_GAP = 5.5; // min gap between queued vehicles
export const SPAWN_RATE_MIN = 1.5; // min seconds between spawns
export const SPAWN_RATE_MAX = 4.0; // max seconds between spawns

// Pedestrian parameters - using pre-created animated Quaternius characters
export const PEDESTRIAN_MODELS = [
  { id: 'woman', model: '/models/character_woman.glb', scale: 1.0, walkAnim: 'CharacterArmature|Walk', idleAnim: 'CharacterArmature|Idle' },
  { id: 'businessman', model: '/models/character_businessman.glb', scale: 1.0, walkAnim: 'CharacterArmature|Walk', idleAnim: 'CharacterArmature|Idle' },
  { id: 'hoodie', model: '/models/character_hoodie.glb', scale: 1.0, walkAnim: 'CharacterArmature|Walk', idleAnim: 'CharacterArmature|Idle' },
  { id: 'man', model: '/models/character_man.glb', scale: 0.38, walkAnim: 'HumanArmature|Man_Walk', idleAnim: 'HumanArmature|Man_Idle' },
  { id: 'punk', model: '/models/character_punk.glb', scale: 1.0, walkAnim: 'CharacterArmature|Walk', idleAnim: 'CharacterArmature|Idle' },
];
export const PEDESTRIAN_SPEED_MIN = 2;
export const PEDESTRIAN_SPEED_MAX = 3.5;
export const PEDESTRIAN_SPAWN_RATE_MIN = 3;
export const PEDESTRIAN_SPAWN_RATE_MAX = 8;
export const PEDESTRIAN_BODY_HEIGHT = 1.8;

// Turn probabilities
export const TURN_STRAIGHT = 0.7;
export const TURN_LEFT = 0.15;
export const TURN_RIGHT = 0.15;

// Directions
export const DIRECTIONS = ['north', 'south', 'east', 'west'];

// Colors
export const COLORS = {
  road: '#333333',
  sidewalk: '#b0b0b0',
  grass: '#4a7c3f',
  laneMarking: '#ffffff',
  centerLine: '#f4d03f',
  crosswalk: '#ffffff',
  trafficLightPole: '#444444',
  redLight: '#ff0000',
  yellowLight: '#ffff00',
  greenLight: '#00ff00',
  redLightDim: '#330000',
  yellowLightDim: '#333300',
  greenLightDim: '#003300',
};
