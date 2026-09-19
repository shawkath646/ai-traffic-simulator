// Exponential random for Poisson-like spawn intervals
export function exponentialRandom(mean) {
  return -mean * Math.log(1 - Math.random());
}

// Random float in range
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// Random integer in range (inclusive)
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick random item from array
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Weighted random choice based on probability field
export function weightedRandomChoice(items) {
  const r = Math.random();
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.probability;
    if (r <= cumulative) return item;
  }
  return items[items.length - 1];
}

// Decide turn direction based on probabilities
export function decideTurn() {
  const r = Math.random();
  if (r < 0.7) return 'straight';
  if (r < 0.85) return 'left';
  return 'right';
}

// Get the opposite direction
export function getOppositeDirection(dir) {
  const opposites = { north: 'south', south: 'north', east: 'west', west: 'east' };
  return opposites[dir];
}

// Get perpendicular directions
export function getPerpendicularDirections(dir) {
  if (dir === 'north' || dir === 'south') return ['east', 'west'];
  return ['north', 'south'];
}

// Check if direction is NS axis
export function isNSAxis(dir) {
  return dir === 'north' || dir === 'south';
}

// Generate a unique ID
let idCounter = 0;
export function generateId() {
  return `entity_${++idCounter}_${Date.now()}`;
}

// Lerp
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Clamp
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Distance between two 2D points
export function distance2D(x1, z1, x2, z2) {
  return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
}
