/**
 * Visual effects utilities for voice themes
 * 
 * Common visual effects and rendering helpers used across different voice themes
 */

import { lerp, clamp, hslToRgb } from './math';

/**
 * Color utility class
 */
export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = clamp(r, 0, 255);
    this.g = clamp(g, 0, 255);
    this.b = clamp(b, 0, 255);
    this.a = clamp(a, 0, 1);
  }

  static fromHex(hex: string): Color {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? new Color(
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        )
      : new Color(0, 0, 0);
  }

  static fromHSL(h: number, s: number, l: number, a: number = 1): Color {
    const [r, g, b] = hslToRgb(h, s, l);
    return new Color(r, g, b, a);
  }

  static lerp(from: Color, to: Color, factor: number): Color {
    return from.lerp(to, factor);
  }

  lerp(target: Color, factor: number): Color {
    return new Color(
      lerp(this.r, target.r, factor),
      lerp(this.g, target.g, factor),
      lerp(this.b, target.b, factor),
      lerp(this.a, target.a, factor)
    );
  }

  toString(): string {
    return `rgba(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)}, ${this.a})`;
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }

  lighten(factor: number): Color {
    return new Color(
      Math.min(255, this.r + (255 - this.r) * factor),
      Math.min(255, this.g + (255 - this.g) * factor),
      Math.min(255, this.b + (255 - this.b) * factor),
      this.a
    );
  }

  darken(factor: number): Color {
    return new Color(
      this.r * (1 - factor),
      this.g * (1 - factor),
      this.b * (1 - factor),
      this.a
    );
  }
}

/**
 * Gradient builder for complex color effects
 */
export class GradientBuilder {
  private stops: Array<{ position: number; color: Color }> = [];

  addStop(position: number, color: Color): GradientBuilder {
    this.stops.push({ position: clamp(position, 0, 1), color });
    this.stops.sort((a, b) => a.position - b.position);
    return this;
  }

  getColorAt(position: number): Color {
    position = clamp(position, 0, 1);

    if (this.stops.length === 0) return new Color(0, 0, 0);
    if (this.stops.length === 1) return this.stops[0].color.clone();

    // Find surrounding stops
    let leftStop = this.stops[0];
    let rightStop = this.stops[this.stops.length - 1];

    for (let i = 0; i < this.stops.length - 1; i++) {
      if (position >= this.stops[i].position && position <= this.stops[i + 1].position) {
        leftStop = this.stops[i];
        rightStop = this.stops[i + 1];
        break;
      }
    }

    // Interpolate between stops
    const range = rightStop.position - leftStop.position;
    if (range === 0) return leftStop.color.clone();

    const factor = (position - leftStop.position) / range;
    return leftStop.color.lerp(rightStop.color, factor);
  }

  createCanvasGradient(
    context: CanvasRenderingContext2D,
    type: 'linear' | 'radial',
    x0: number,
    y0: number,
    x1?: number,
    y1?: number,
    r0?: number,
    r1?: number
  ): CanvasGradient {
    let gradient: CanvasGradient;

    if (type === 'linear') {
      gradient = context.createLinearGradient(x0, y0, x1 || 0, y1 || 0);
    } else {
      gradient = context.createRadialGradient(x0, y0, r0 || 0, x1 || x0, y1 || y0, r1 || 100);
    }

    this.stops.forEach(stop => {
      gradient.addColorStop(stop.position, stop.color.toString());
    });

    return gradient;
  }
}

/**
 * Particle system base class
 */
export class Particle {
  x: number = 0;
  y: number = 0;
  z: number = 0;
  vx: number = 0;
  vy: number = 0;
  vz: number = 0;
  age: number = 0;
  maxAge: number = 100;
  size: number = 1;
  color: Color = new Color(255, 255, 255);
  alpha: number = 1;
  rotation: number = 0;
  rotationSpeed: number = 0;
  dead: boolean = false;

  update(deltaTime: number = 1): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.z += this.vz * deltaTime;
    this.rotation += this.rotationSpeed * deltaTime;
    this.age += deltaTime;

    if (this.age >= this.maxAge) {
      this.dead = true;
    }
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    context.globalAlpha = this.alpha;
    context.fillStyle = this.color.toString();
    context.translate(this.x, this.y);
    context.rotate(this.rotation);
    
    context.beginPath();
    context.arc(0, 0, this.size, 0, Math.PI * 2);
    context.fill();
    
    context.restore();
  }
}

/**
 * Glow effect renderer
 */
export class GlowRenderer {
  static drawGlow(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: Color,
    intensity: number = 1
  ): void {
    const glowSize = size * (1 + intensity);
    const glowAlpha = color.a * intensity * 0.3;

    // Create radial gradient for glow
    const gradient = context.createRadialGradient(x, y, 0, x, y, glowSize);
    gradient.addColorStop(0, new Color(color.r, color.g, color.b, glowAlpha).toString());
    gradient.addColorStop(0.5, new Color(color.r, color.g, color.b, glowAlpha * 0.5).toString());
    gradient.addColorStop(1, new Color(color.r, color.g, color.b, 0).toString());

    context.save();
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, glowSize, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  static drawMultiLayerGlow(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: Color,
    layers: number = 3,
    intensity: number = 1
  ): void {
    for (let i = layers; i > 0; i--) {
      const layerSize = size * (1 + (intensity * i * 0.5));
      const layerIntensity = intensity * (1 / i);
      this.drawGlow(context, x, y, layerSize, color, layerIntensity);
    }
  }
}

/**
 * Trail effect for moving objects
 */
export class TrailRenderer {
  private points: Array<{ x: number; y: number; age: number; maxAge: number }> = [];
  private maxPoints: number;
  private fadeTime: number;

  constructor(maxPoints: number = 20, fadeTime: number = 60) {
    this.maxPoints = maxPoints;
    this.fadeTime = fadeTime;
  }

  addPoint(x: number, y: number): void {
    this.points.push({ x, y, age: 0, maxAge: this.fadeTime });

    // Remove excess points
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }
  }

  update(): void {
    // Update ages and remove dead points
    this.points = this.points.filter(point => {
      point.age++;
      return point.age < point.maxAge;
    });
  }

  render(context: CanvasRenderingContext2D, color: Color, width: number = 2): void {
    if (this.points.length < 2) return;

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Draw trail segments with fading alpha
    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      const prevPoint = this.points[i - 1];
      const alpha = 1 - (point.age / point.maxAge);
      
      context.strokeStyle = new Color(color.r, color.g, color.b, alpha * color.a).toString();
      context.lineWidth = width * alpha;
      
      context.beginPath();
      context.moveTo(prevPoint.x, prevPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }

    context.restore();
  }

  clear(): void {
    this.points = [];
  }
}

/**
 * Ripple effect renderer
 */
export class RippleEffect {
  x: number;
  y: number;
  radius: number = 0;
  maxRadius: number;
  age: number = 0;
  maxAge: number;
  color: Color;
  width: number;

  constructor(
    x: number,
    y: number,
    maxRadius: number,
    color: Color,
    duration: number = 60,
    width: number = 2
  ) {
    this.x = x;
    this.y = y;
    this.maxRadius = maxRadius;
    this.color = color;
    this.maxAge = duration;
    this.width = width;
  }

  update(): void {
    this.age++;
    this.radius = (this.age / this.maxAge) * this.maxRadius;
  }

  render(context: CanvasRenderingContext2D): void {
    if (this.age >= this.maxAge) return;

    const alpha = 1 - (this.age / this.maxAge);
    
    context.save();
    context.strokeStyle = new Color(this.color.r, this.color.g, this.color.b, alpha * this.color.a).toString();
    context.lineWidth = this.width * alpha;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  isDead(): boolean {
    return this.age >= this.maxAge;
  }
}

/**
 * Screen shake effect
 */
export class ScreenShake {
  private intensity: number = 0;
  private duration: number = 0;
  private maxDuration: number = 0;
  
  start(intensity: number, duration: number): void {
    this.intensity = intensity;
    this.duration = duration;
    this.maxDuration = duration;
  }

  update(): void {
    if (this.duration > 0) {
      this.duration--;
    }
  }

  getOffset(): { x: number; y: number } {
    if (this.duration <= 0) return { x: 0, y: 0 };

    const factor = this.duration / this.maxDuration;
    const shakeX = (Math.random() - 0.5) * this.intensity * factor;
    const shakeY = (Math.random() - 0.5) * this.intensity * factor;
    
    return { x: shakeX, y: shakeY };
  }

  isActive(): boolean {
    return this.duration > 0;
  }
}

/**
 * Text rendering utilities
 */
export class TextRenderer {
  static drawOutlineText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    font: string,
    fillColor: Color,
    outlineColor: Color,
    outlineWidth: number = 2
  ): void {
    context.save();
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw outline
    context.strokeStyle = outlineColor.toString();
    context.lineWidth = outlineWidth;
    context.strokeText(text, x, y);

    // Draw fill
    context.fillStyle = fillColor.toString();
    context.fillText(text, x, y);

    context.restore();
  }

  static drawGlowText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    font: string,
    color: Color,
    glowIntensity: number = 1
  ): void {
    context.save();
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw glow
    context.shadowColor = color.toString();
    context.shadowBlur = 10 * glowIntensity;
    context.fillStyle = color.toString();
    context.fillText(text, x, y);

    // Draw main text
    context.shadowBlur = 0;
    context.fillText(text, x, y);

    context.restore();
  }
}

/**
 * Animation easing functions
 */
export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  backOut: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};