/**
 * Mathematical utilities for voice themes
 * 
 * Common mathematical functions and helpers used across different voice themes
 */

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

/**
 * Smooth step interpolation (ease in/out)
 */
export const smoothStep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Map a value from one range to another
 */
export const map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
};

/**
 * Generate random number between min and max
 */
export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generate random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Distance between two 2D points
 */
export const distance2D = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Distance between two 3D points
 */
export const distance3D = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * Normalize angle to 0-2π range
 */
export const normalizeAngle = (angle: number): number => {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
};

/**
 * Convert degrees to radians
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const radToDeg = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Sine wave with customizable amplitude, frequency, and phase
 */
export const sineWave = (time: number, amplitude: number = 1, frequency: number = 1, phase: number = 0): number => {
  return amplitude * Math.sin(frequency * time + phase);
};

/**
 * Cosine wave with customizable amplitude, frequency, and phase
 */
export const cosineWave = (time: number, amplitude: number = 1, frequency: number = 1, phase: number = 0): number => {
  return amplitude * Math.cos(frequency * time + phase);
};

/**
 * 3D rotation around X axis
 */
export const rotateX = (x: number, y: number, z: number, angle: number): [number, number, number] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x,
    y * cos - z * sin,
    y * sin + z * cos
  ];
};

/**
 * 3D rotation around Y axis
 */
export const rotateY = (x: number, y: number, z: number, angle: number): [number, number, number] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x * cos + z * sin,
    y,
    -x * sin + z * cos
  ];
};

/**
 * 3D rotation around Z axis
 */
export const rotateZ = (x: number, y: number, z: number, angle: number): [number, number, number] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x * cos - y * sin,
    x * sin + y * cos,
    z
  ];
};

/**
 * 3D to 2D projection
 */
export const project3D = (x: number, y: number, z: number, focalLength: number, centerX: number, centerY: number): [number, number] => {
  const scale = focalLength / (focalLength - z);
  return [
    x * scale + centerX,
    y * scale + centerY
  ];
};

/**
 * Cubic bezier curve interpolation
 */
export const cubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number): number => {
  const oneMinusT = 1 - t;
  return oneMinusT * oneMinusT * oneMinusT * p0 +
         3 * oneMinusT * oneMinusT * t * p1 +
         3 * oneMinusT * t * t * p2 +
         t * t * t * p3;
};

/**
 * Noise function (simplified Perlin-like noise)
 */
export const noise = (x: number, y: number = 0): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};

/**
 * HSL to RGB conversion
 */
export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  if (s === 0) {
    return [l * 255, l * 255, l * 255];
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1/3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1/3) * 255)
    ];
  }
};

/**
 * Easing functions - these are aliases for common easing patterns
 */
export const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};

export const easeOutBounce = (t: number): number => {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  } else if (t < 2.5 / 2.75) {
    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  } else {
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
};

export const easeInOutSine = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2;
};

export const easeInOutExpo = (t: number): number => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

/**
 * 2D Perlin-like noise function
 */
export const noise2D = (x: number, y: number): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};

/**
 * Alias for smoothStep to maintain compatibility
 */
export const smoothstep = smoothStep;