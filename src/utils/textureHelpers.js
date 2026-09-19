import * as THREE from 'three';

// Helper to create pavement arrow textures
function createPavementArrowTexture(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 128, 256);
  ctx.fillStyle = '#ffffff';

  if (type === 'straight') {
    ctx.fillRect(56, 90, 16, 120);
    ctx.beginPath();
    ctx.moveTo(64, 40);
    ctx.lineTo(34, 100);
    ctx.lineTo(54, 100);
    ctx.lineTo(54, 90);
    ctx.lineTo(74, 90);
    ctx.lineTo(74, 100);
    ctx.lineTo(94, 100);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'left') {
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(70, 210);
    ctx.quadraticCurveTo(70, 110, 35, 110);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, 110);
    ctx.lineTo(50, 80);
    ctx.lineTo(50, 140);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'straight_right') {
    ctx.fillRect(45, 90, 14, 120);
    ctx.beginPath();
    ctx.moveTo(52, 45);
    ctx.lineTo(30, 95);
    ctx.lineTo(74, 95);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(52, 160);
    ctx.quadraticCurveTo(80, 160, 95, 120);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(110, 110);
    ctx.lineTo(82, 90);
    ctx.lineTo(82, 135);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

const pavementArrowCache = new Map();
export function getCachedPavementArrowTexture(type) {
  if (!pavementArrowCache.has(type)) {
    pavementArrowCache.set(type, createPavementArrowTexture(type));
  }
  return pavementArrowCache.get(type);
}

// Generate realistic repeating architectural paving tile textures
function createTileTexture(style = 'downtown_granite', repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Palette configurations per style
  const configs = {
    downtown_granite: {
      grid: 4, // 4x4 tiles in base pattern
      baseColors: ['#56606e', '#5a6473', '#515b69', '#4d5764'],
      groutColor: '#2b3442',
      bevelLight: 'rgba(255, 255, 255, 0.18)',
      bevelDark: 'rgba(0, 0, 0, 0.28)',
      speckle: true,
    },
    civic_concrete: {
      grid: 4,
      baseColors: ['#69717d', '#6f7783', '#646c77', '#606873'],
      groutColor: '#3d4450',
      bevelLight: 'rgba(255, 255, 255, 0.14)',
      bevelDark: 'rgba(0, 0, 0, 0.22)',
      speckle: true,
    },
    plaza_limestone: {
      grid: 4,
      baseColors: ['#888f9b', '#8d94a0', '#838a95', '#7e8590'],
      groutColor: '#4b525f',
      bevelLight: 'rgba(255, 255, 255, 0.22)',
      bevelDark: 'rgba(0, 0, 0, 0.25)',
      speckle: true,
    },
    sidewalk_paving: {
      grid: 2, // Large 2x2 flagstone slabs
      baseColors: ['#a2a8b3', '#a8aeb9', '#9da3ae'],
      groutColor: '#5c6370',
      bevelLight: 'rgba(255, 255, 255, 0.25)',
      bevelDark: 'rgba(0, 0, 0, 0.22)',
      speckle: true,
    },
  };

  const cfg = configs[style] || configs.downtown_granite;

  // Architectural Tile Grid
  const tileSize = 512 / cfg.grid;
  const groutWidth = 3;

  // Base background grout color
  ctx.fillStyle = cfg.groutColor;
  ctx.fillRect(0, 0, 512, 512);

  for (let gx = 0; gx < cfg.grid; gx++) {
    for (let gy = 0; gy < cfg.grid; gy++) {
      const x = gx * tileSize + groutWidth / 2;
      const y = gy * tileSize + groutWidth / 2;
      const w = tileSize - groutWidth;
      const h = tileSize - groutWidth;

      // Individual tile base tone
      const colIdx = (gx * 3 + gy * 7) % cfg.baseColors.length;
      ctx.fillStyle = cfg.baseColors[colIdx];
      ctx.fillRect(x, y, w, h);

      // Top and Left edge highlights (sun reflection on bevel)
      ctx.fillStyle = cfg.bevelLight;
      ctx.fillRect(x, y, w, 2.5); // top bevel
      ctx.fillRect(x, y, 2.5, h); // left bevel

      // Bottom and Right edge shadows (depth bevel)
      ctx.fillStyle = cfg.bevelDark;
      ctx.fillRect(x, y + h - 2.5, w, 2.5); // bottom bevel
      ctx.fillRect(x + w - 2.5, y, 2.5, h); // right bevel

      // Fine stone speckle grain
      if (cfg.speckle) {
        for (let s = 0; s < 40; s++) {
          const sx = x + 3 + Math.random() * (w - 6);
          const sy = y + 3 + Math.random() * (h - 6);
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

// Dedicated 1024x1024 photorealistic seamless grass texture generator
// Dedicated 1024x1024 photorealistic seamless grass texture generator
// Features: periodic toroidal wrapping (0 seams), continuous cosine value noise, 35,000 fine blade fibers
function createSeamlessGrassCanvas() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 1. Multi-octave continuous periodic smooth value noise for organic meadow tone drift
  const gridDim = 16;
  const grid = [];
  let seed = 89412;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let y = 0; y < gridDim; y++) {
    grid[y] = [];
    for (let x = 0; x < gridDim; x++) {
      grid[y][x] = rnd();
    }
  }

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Natural sunlit color palette: vibrant fresh spring turf with gentle tone drift (never dark or black)
  for (let py = 0; py < size; py++) {
    const gy = (py / size) * gridDim;
    const y0 = Math.floor(gy);
    const y1 = (y0 + 1) % gridDim;
    const ty = gy - y0;
    const sy = (1 - Math.cos(ty * Math.PI)) * 0.5;

    for (let px = 0; px < size; px++) {
      const gx = (px / size) * gridDim;
      const x0 = Math.floor(gx);
      const x1 = (x0 + 1) % gridDim;
      const tx = gx - x0;
      const sx = (1 - Math.cos(tx * Math.PI)) * 0.5;

      const v00 = grid[y0][x0];
      const v10 = grid[y0][x1];
      const v01 = grid[y1][x0];
      const v11 = grid[y1][x1];

      const vTop = v00 + (v10 - v00) * sx;
      const vBottom = v01 + (v11 - v01) * sx;
      const val = vTop + (vBottom - vTop) * sy;

      // Rich sunlit grass base: R: 92-128, G: 136-176, B: 58-86
      const r = Math.round(92 + val * 36);
      const g = Math.round(136 + val * 40);
      const b = Math.round(58 + val * 28);

      const idx = (py * size + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Mid-frequency organic lawn tone patches with periodic toroidal wrapping
  const clumpColors = [
    'rgba(110, 155, 72, 0.35)',
    'rgba(95, 138, 62, 0.40)',
    'rgba(125, 168, 80, 0.30)',
    'rgba(88, 128, 56, 0.40)',
    'rgba(138, 180, 88, 0.28)',
  ];
  for (let i = 0; i < 300; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const cr = Math.random() * 34 + 16;
    const color = clumpColors[Math.floor(Math.random() * clumpColors.length)];

    [-size, 0, size].forEach((ox) => {
      [-size, 0, size].forEach((oy) => {
        const x = cx + ox;
        const y = cy + oy;
        if (x + cr > 0 && x - cr < size && y + cr > 0 && y - cr < size) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, cr, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
  }

  // 3. Dense individual grass blade fibers (35,000 fine organic strokes with toroidal wrapping)
  const bladeColors = [
    '#749c48', '#83ad52', '#658d3e', '#92be5e',
    '#6b9444', '#5a8236', '#9fc766', '#7fa850',
    '#8aba58', '#6e9846'
  ];

  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';

  for (let i = 0; i < 35000; i++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    const len = Math.random() * 6.5 + 3.0;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    const color = bladeColors[Math.floor(Math.random() * bladeColors.length)];

    [-size, 0, size].forEach((ox) => {
      [-size, 0, size].forEach((oy) => {
        const x = bx + ox;
        const y = by + oy;
        if (x > -10 && x < size + 10 && y > -10 && y < size + 10) {
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + dx, y + dy);
          ctx.stroke();
        }
      });
    });
  }

  // 4. Subtle sunlit blade tip highlights (7,500 fine tips)
  ctx.lineWidth = 1.2;
  const tipColors = ['#b8de76', '#c8ee88', '#a8ce6a', '#d4f498'];
  for (let i = 0; i < 7500; i++) {
    const tx = Math.random() * size;
    const ty = Math.random() * size;
    const len = Math.random() * 2.8 + 1.2;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    const color = tipColors[Math.floor(Math.random() * tipColors.length)];

    [-size, 0, size].forEach((ox) => {
      [-size, 0, size].forEach((oy) => {
        const x = tx + ox;
        const y = ty + oy;
        if (x > -5 && x < size + 5 && y > -5 && y < size + 5) {
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + dx, y + dy);
          ctx.stroke();
        }
      });
    });
  }

  // 5. Natural soil/loam micro-speckles (3,500 specks)
  const soilColors = ['#4a3c26', '#54442d', '#3e321e'];
  for (let i = 0; i < 3500; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const color = soilColors[Math.floor(Math.random() * soilColors.length)];
    [-size, 0, size].forEach((ox) => {
      [-size, 0, size].forEach((oy) => {
        const x = sx + ox;
        const y = sy + oy;
        if (x > -3 && x < size + 3 && y > -3 && y < size + 3) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      });
    });
  }

  return canvas;
}

// Cached master grass canvas to prevent redundant heavy 1024x1024 canvas generation
let masterGrassCanvas = null;
function getMasterGrassCanvas() {
  if (!masterGrassCanvas) {
    masterGrassCanvas = createSeamlessGrassCanvas();
  }
  return masterGrassCanvas;
}

const tileTextureCache = new Map();
export function getCachedTileTexture(style = 'downtown_granite', repeatX = 1, repeatY = 1) {
  const key = `${style}_${repeatX}_${repeatY}`;
  if (!tileTextureCache.has(key)) {
    if (style === 'residential_grass' || style === 'natural_turf') {
      const canvas = getMasterGrassCanvas();
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      tileTextureCache.set(key, tex);
    } else {
      tileTextureCache.set(key, createTileTexture(style, repeatX, repeatY));
    }
  }
  return tileTextureCache.get(key);
}

// Generate realistic overhead highway/major avenue destination and navigation boards
function createNavigationBoardTexture(type = 'downtown_north') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');

  // Highway green background
  ctx.fillStyle = '#005835';
  ctx.fillRect(0, 0, 1024, 340);

  // Outer white border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 1004, 320);

  // Inner thin border
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 988, 304);

  // Sign configurations
  const configs = {
    downtown_north: {
      route: 'STATE 101',
      destLeft: 'DOWNTOWN FINANCIAL',
      subLeft: 'NEXT 2 EXITS',
      arrowLeft: 'straight',
      destRight: 'CIVIC / HOSPITAL',
      subRight: 'EXIT 4B  1/2 MILE',
      arrowRight: 'right',
    },
    downtown_south: {
      route: 'METRO 1',
      destLeft: 'CENTRAL PARK / ARTS',
      subLeft: 'KEEP LEFT',
      arrowLeft: 'straight',
      destRight: 'GARDEN SUBURB',
      subRight: 'EXIT 2A  1/4 MILE',
      arrowRight: 'right',
    },
    avenue_east: {
      route: 'AVENUE A',
      destLeft: 'ENTERTAINMENT & CINEMA',
      subLeft: 'THROUGH TRAFFIC',
      arrowLeft: 'straight',
      destRight: 'EAST RESIDENTIAL',
      subRight: 'RIGHT LANE MUST TURN',
      arrowRight: 'right',
    },
    avenue_west: {
      route: 'AVENUE B',
      destLeft: 'REGIONAL MEDICAL CENTER',
      subLeft: 'EMERGENCY ROUTE',
      arrowLeft: 'left',
      destRight: 'WEST COMMERCIAL PARK',
      subRight: 'THROUGH ONLY',
      arrowRight: 'straight',
    },
    lane_guidance: {
      route: 'CITY CENTER',
      destLeft: 'LEFT LANE',
      subLeft: 'TURNING ONLY',
      arrowLeft: 'left',
      destCenter: 'CENTER LANE',
      subCenter: 'THROUGH TRAFFIC',
      arrowCenter: 'straight',
      destRight: 'RIGHT LANE',
      subRight: 'THROUGH & RIGHT',
      arrowRight: 'right',
    },
  };

  const cfg = configs[type] || configs.downtown_north;

  // Helper to draw crisp vector arrow
  const drawArrow = (x, y, dir, size = 32) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (dir === 'straight') {
      ctx.beginPath();
      ctx.moveTo(0, size);
      ctx.lineTo(0, -size * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.8, -size * 0.1);
      ctx.lineTo(size * 0.8, -size * 0.1);
      ctx.closePath();
      ctx.fill();
    } else if (dir === 'right') {
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, size * 0.7);
      ctx.lineTo(size * 0.5, -size * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * 0.9, -size * 0.9);
      ctx.lineTo(size * 0.1, -size * 0.8);
      ctx.lineTo(size * 0.8, -size * 0.1);
      ctx.closePath();
      ctx.fill();
    } else if (dir === 'left') {
      ctx.beginPath();
      ctx.moveTo(size * 0.7, size * 0.7);
      ctx.lineTo(-size * 0.5, -size * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-size * 0.9, -size * 0.9);
      ctx.lineTo(-size * 0.1, -size * 0.8);
      ctx.lineTo(-size * 0.8, -size * 0.1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  // Draw Top Banner Route Shield
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(40, 28, 170, 48, 8);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.route, 125, 52);

  // Vertical divider line between left and right destinations
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(512, 35);
  ctx.lineTo(512, 305);
  ctx.stroke();

  // LEFT DESTINATION PANEL
  drawArrow(80, 200, cfg.arrowLeft, 34);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.fillText(cfg.destLeft, 140, 185);
  ctx.fillStyle = '#fef08a'; // yellow highlight for advisory text
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.fillText(cfg.subLeft, 140, 228);

  // RIGHT DESTINATION PANEL
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.fillText(cfg.destRight, 545, 185);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.fillText(cfg.subRight, 545, 228);
  drawArrow(940, 200, cfg.arrowRight, 34);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

const navigationBoardCache = new Map();
export function getCachedNavigationBoardTexture(type = 'downtown_north') {
  if (!navigationBoardCache.has(type)) {
    navigationBoardCache.set(type, createNavigationBoardTexture(type));
  }
  return navigationBoardCache.get(type);
}

