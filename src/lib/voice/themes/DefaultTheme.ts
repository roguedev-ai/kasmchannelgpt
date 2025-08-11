/**
 * Default Theme - Classic Particle Sphere
 * 
 * The original particle sphere theme, refactored to use the new theme system.
 * Features a 3D rotating sphere of particles with smooth color transitions.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { lerp } from '../utils/math';
import { ObjectPool } from '../utils/performance';

interface Particle {
  x: number;
  y: number;
  z: number;
  velX: number;
  velY: number;
  velZ: number;
  age: number;
  dead: boolean;
  right: boolean;
  projX: number;
  projY: number;
  alpha: number;
  attack: number;
  hold: number;
  decay: number;
  initValue: number;
  holdValue: number;
  lastValue: number;
  stuckTime: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  next?: Particle;
  prev?: Particle;
}

interface ColorPalette {
  r: number;
  g: number;
  b: number;
  gradient: number[];
}

interface ColorScheme {
  idle: ColorPalette;
  userSpeaking: ColorPalette;
  processing: ColorPalette;
  aiSpeaking: ColorPalette;
  hover: ColorPalette;
}

export class DefaultTheme extends BaseTheme {
  readonly id = 'default';
  readonly name = 'Classic Sphere';
  readonly description = 'The original 3D particle sphere with smooth color transitions';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'medium' as const;

  // Sphere configuration
  private sphereRadius = 280;
  private radiusScale = 1;
  private framesPerRotation = 5000;
  private focalLength = 320;
  private zeroAlphaDepth = -750;
  private sphereCenterY = 0;
  private sphereCenterZ = -3 - this.sphereRadius;

  // Particle system
  private particlePool: ObjectPool<Particle>;
  private particleList: { first?: Particle } = {};
  private recycleBin: { first?: Particle } = {};
  private currentParticleCount = 0;
  private maxParticles = 200;

  // Color system
  private currentR = 52;
  private currentG = 235;
  private currentB = 222;
  private targetR = 52;
  private targetG = 235;
  private targetB = 222;
  private colorTransitionSpeed = 0.05;
  private currentColorScheme = 'gemini';

  // Animation parameters
  private turnAngle = 1;
  private wait = 2;
  private count = 0;
  private numToAddEachFrame = 3;
  private particleAlpha = 1;
  private particleRad = 2.5;
  private gravity = 0;
  private randAccelX = 0.1;
  private randAccelY = 0.1;
  private randAccelZ = 0.1;

  // Color schemes
  private colorSchemes: Record<string, ColorScheme> = {
    gemini: {
      idle: { r: 66, g: 133, b: 244, gradient: [66, 133, 244, 52, 168, 83] },
      userSpeaking: { r: 234, g: 67, b: 53, gradient: [234, 67, 53, 251, 188, 5] },
      processing: { r: 155, g: 64, b: 224, gradient: [155, 64, 224, 66, 133, 244] },
      aiSpeaking: { r: 52, g: 168, b: 83, gradient: [52, 168, 83, 66, 133, 244] },
      hover: { r: 251, g: 188, b: 5, gradient: [251, 188, 5, 234, 67, 53] }
    },
    instagram: {
      idle: { r: 228, g: 64, b: 95, gradient: [228, 64, 95, 247, 119, 55] },
      userSpeaking: { r: 247, g: 119, b: 55, gradient: [247, 119, 55, 252, 175, 69] },
      processing: { r: 193, g: 53, b: 132, gradient: [193, 53, 132, 228, 64, 95] },
      aiSpeaking: { r: 252, g: 175, b: 69, gradient: [252, 175, 69, 247, 119, 55] },
      hover: { r: 131, g: 58, b: 180, gradient: [131, 58, 180, 193, 53, 132] }
    },
    ocean: {
      idle: { r: 0, g: 119, b: 190, gradient: [0, 119, 190, 0, 168, 232] },
      userSpeaking: { r: 0, g: 168, b: 232, gradient: [0, 168, 232, 0, 201, 255] },
      processing: { r: 0, g: 201, b: 255, gradient: [0, 201, 255, 100, 255, 218] },
      aiSpeaking: { r: 100, g: 255, b: 218, gradient: [100, 255, 218, 0, 168, 232] },
      hover: { r: 0, g: 150, b: 199, gradient: [0, 150, 199, 0, 201, 255] }
    },
    sunset: {
      idle: { r: 255, g: 107, b: 107, gradient: [255, 107, 107, 255, 193, 7] },
      userSpeaking: { r: 255, g: 193, b: 7, gradient: [255, 193, 7, 255, 142, 83] },
      processing: { r: 255, g: 142, b: 83, gradient: [255, 142, 83, 255, 107, 107] },
      aiSpeaking: { r: 255, g: 230, b: 109, gradient: [255, 230, 109, 255, 193, 7] },
      hover: { r: 255, g: 171, b: 64, gradient: [255, 171, 64, 255, 107, 107] }
    },
    aurora: {
      idle: { r: 0, g: 201, b: 255, gradient: [0, 201, 255, 146, 254, 157] },
      userSpeaking: { r: 146, g: 254, b: 157, gradient: [146, 254, 157, 0, 255, 193] },
      processing: { r: 0, g: 255, b: 193, gradient: [0, 255, 193, 186, 85, 255] },
      aiSpeaking: { r: 186, g: 85, b: 255, gradient: [186, 85, 255, 0, 201, 255] },
      hover: { r: 120, g: 255, b: 214, gradient: [120, 255, 214, 186, 85, 255] }
    }
  };

  constructor() {
    super();
    
    // Initialize particle pool
    this.particlePool = new ObjectPool<Particle>(
      () => ({
        x: 0, y: 0, z: 0, velX: 0, velY: 0, velZ: 0,
        age: 0, dead: false, right: false, projX: 0, projY: 0, alpha: 0,
        attack: 0, hold: 0, decay: 0, initValue: 0, holdValue: 0, lastValue: 0,
        stuckTime: 0, accelX: 0, accelY: 0, accelZ: 0
      }),
      (particle) => {
        particle.age = 0;
        particle.dead = false;
        particle.alpha = 0;
        particle.next = undefined;
        particle.prev = undefined;
      },
      50,
      this.maxParticles
    );

    this.setColor(this.getColorPalette().idle);
  }

  protected onInit(): void {
    this.maxParticles = this.getMaxParticles();
  }

  protected onDraw(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    deltaTime: number
  ): void {
    this.updateColors();
    this.updateParticles(context, width, height, centerX, centerY);
    this.renderParticles(context, width, height, centerX, centerY);
  }

  protected onStateChange(newState: VoiceState): void {
    const palette = this.getColorPalette();
    
    switch (newState) {
      case VoiceState.USER_SPEAKING:
        this.framesPerRotation = 2000;
        this.colorTransitionSpeed = 0.15;
        this.setColor(palette.userSpeaking);
        this.numToAddEachFrame = 5;
        this.particleAlpha = 1.2;
        this.particleRad = 3.5;
        this.gravity = 0.1;
        break;
        
      case VoiceState.PROCESSING:
        this.framesPerRotation = 500;
        this.colorTransitionSpeed = 0.2;
        this.setColor(palette.processing);
        this.numToAddEachFrame = 8;
        this.particleAlpha = 1.5;
        this.particleRad = 4;
        this.gravity = 0;
        break;
        
      case VoiceState.AI_SPEAKING:
        this.framesPerRotation = 2500;
        this.colorTransitionSpeed = 0.1;
        this.setColor(palette.aiSpeaking);
        this.numToAddEachFrame = 4;
        this.particleAlpha = 1.3;
        this.particleRad = 3;
        this.gravity = -0.05;
        break;
        
      case VoiceState.IDLE:
      default:
        this.framesPerRotation = 5000;
        this.colorTransitionSpeed = 0.05;
        this.setColor(palette.idle);
        this.numToAddEachFrame = 3;
        this.particleAlpha = 1;
        this.particleRad = 2.5;
        this.gravity = 0;
        break;
    }
  }

  protected getThemeSpecificMetrics() {
    return {
      particleCount: this.currentParticleCount,
      maxParticles: this.maxParticles,
      colorScheme: this.currentColorScheme
    };
  }

  /**
   * Set color scheme (public method for external use)
   */
  setColorScheme(scheme: string): void {
    if (this.colorSchemes[scheme]) {
      this.currentColorScheme = scheme;
      // Update current color based on current state
      const palette = this.getColorPalette();
      this.setColor(palette.idle); // Will be overridden by current state
    }
  }

  // Private methods - core particle system logic

  private getColorPalette(): ColorScheme {
    return this.colorSchemes[this.currentColorScheme] || this.colorSchemes.gemini;
  }

  private setColor(palette: ColorPalette): void {
    this.targetR = palette.r;
    this.targetG = palette.g;
    this.targetB = palette.b;
  }

  private updateColors(): void {
    this.currentR = lerp(this.currentR, this.targetR, this.colorTransitionSpeed);
    this.currentG = lerp(this.currentG, this.targetG, this.colorTransitionSpeed);
    this.currentB = lerp(this.currentB, this.targetB, this.colorTransitionSpeed);
  }

  private updateParticles(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ): void {
    // Create new particles
    this.count++;
    if (this.count >= this.wait && this.currentParticleCount < this.maxParticles) {
      this.count = 0;
      const dynamicNumParticles = Math.floor(this.numToAddEachFrame * (1 + this.mouseInfluence * 0.5));
      const particlesToCreate = Math.min(dynamicNumParticles, this.maxParticles - this.currentParticleCount);
      
      for (let i = 0; i < particlesToCreate; i++) {
        this.createParticle();
      }
    }

    // Update rotation
    const turnSpeed = 2 * Math.PI / this.framesPerRotation;
    const dynamicTurnSpeed = turnSpeed * (1 + this.mouseInfluence * 0.3);
    this.turnAngle = (this.turnAngle + dynamicTurnSpeed) % (2 * Math.PI);
  }

  private createParticle(): void {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);
    
    // Add mouse influence to particle positioning
    const mouseDistortion = this.mouseInfluence * 0.3;
    const mouseBias = {
      x: this.normalizedMouseX * mouseDistortion * this.sphereRadius * 0.5,
      y: this.normalizedMouseY * mouseDistortion * this.sphereRadius * 0.5,
      z: 0
    };
    
    const x0 = this.sphereRadius * Math.sin(phi) * Math.cos(theta) + mouseBias.x;
    const y0 = this.sphereRadius * Math.sin(phi) * Math.sin(theta) + mouseBias.y;
    const z0 = this.sphereRadius * Math.cos(phi) + mouseBias.z;

    const velocityMultiplier = 0.002 * (1 + this.mouseInfluence * 0.5);
    const particle = this.addParticle(
      x0,
      this.sphereCenterY + y0,
      this.sphereCenterZ + z0,
      velocityMultiplier * x0,
      velocityMultiplier * y0,
      velocityMultiplier * z0
    );

    // Set particle envelope parameters
    const alphaMultiplier = 1 + this.mouseInfluence * 0.3;
    particle.attack = Math.floor(30 / (1 + this.mouseInfluence * 0.5));
    particle.hold = Math.floor(30 * (1 + this.mouseInfluence * 0.5));
    particle.decay = 60;
    particle.initValue = 0;
    particle.holdValue = this.particleAlpha * alphaMultiplier;
    particle.lastValue = 0;
    particle.stuckTime = Math.floor((45 + Math.random() * 15) / (1 + this.mouseInfluence * 0.3));

    // Enhanced acceleration with mouse influence
    particle.accelX = this.normalizedMouseX * this.mouseInfluence * 0.001;
    particle.accelY = this.gravity + (this.normalizedMouseY * this.mouseInfluence * 0.001);
    particle.accelZ = 0;
  }

  private addParticle(x0: number, y0: number, z0: number, vx0: number, vy0: number, vz0: number): Particle {
    const newParticle = this.particlePool.acquire();
    this.currentParticleCount++;

    // Add to beginning of particle list
    if (this.particleList.first) {
      newParticle.next = this.particleList.first;
      this.particleList.first.prev = newParticle;
    }
    this.particleList.first = newParticle;
    newParticle.prev = undefined;

    // Initialize particle
    newParticle.x = x0;
    newParticle.y = y0;
    newParticle.z = z0;
    newParticle.velX = vx0;
    newParticle.velY = vy0;
    newParticle.velZ = vz0;
    newParticle.age = 0;
    newParticle.dead = false;
    newParticle.right = Math.random() < 0.5;

    return newParticle;
  }

  private renderParticles(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ): void {
    const sinAngle = Math.sin(this.turnAngle);
    const cosAngle = Math.cos(this.turnAngle);
    const zMax = this.focalLength - 2;

    let particle = this.particleList.first;
    
    while (particle) {
      const nextParticle = particle.next;

      // Update particle age
      particle.age++;

      // Move particle if not stuck
      if (particle.age > particle.stuckTime) {
        particle.velX += particle.accelX + this.randAccelX * (Math.random() * 2 - 1);
        particle.velY += particle.accelY + this.randAccelY * (Math.random() * 2 - 1);
        particle.velZ += particle.accelZ + this.randAccelZ * (Math.random() * 2 - 1);

        particle.x += particle.velX;
        particle.y += particle.velY;
        particle.z += particle.velZ;
      }

      // Calculate 3D rotation and projection
      const rotX = cosAngle * particle.x + sinAngle * (particle.z - this.sphereCenterZ);
      const rotZ = -sinAngle * particle.x + cosAngle * (particle.z - this.sphereCenterZ) + this.sphereCenterZ;
      const m = this.radiusScale * this.focalLength / (this.focalLength - rotZ);
      
      particle.projX = rotX * m + centerX;
      particle.projY = particle.y * m + centerY;

      // Update alpha based on envelope
      this.updateParticleAlpha(particle);

      // Check if particle should be rendered or recycled
      const outsideTest = (
        particle.projX > width || particle.projX < 0 ||
        particle.projY < 0 || particle.projY > height ||
        rotZ > zMax
      );

      if (outsideTest || particle.dead) {
        this.recycleParticle(particle);
      } else {
        this.renderParticle(context, particle, rotZ, m);
      }

      particle = nextParticle;
    }
  }

  private updateParticleAlpha(particle: Particle): void {
    if (particle.age < particle.attack + particle.hold + particle.decay) {
      if (particle.age < particle.attack) {
        particle.alpha = (particle.holdValue - particle.initValue) / particle.attack * particle.age + particle.initValue;
      } else if (particle.age < particle.attack + particle.hold) {
        particle.alpha = particle.holdValue;
      } else {
        particle.alpha = (particle.lastValue - particle.holdValue) / particle.decay * (particle.age - particle.attack - particle.hold) + particle.holdValue;
      }
    } else {
      particle.dead = true;
    }
  }

  private renderParticle(context: CanvasRenderingContext2D, particle: Particle, rotZ: number, scale: number): void {
    // Depth-dependent alpha
    const depthAlphaFactor = Math.max(0, Math.min(1, 1 - rotZ / this.zeroAlphaDepth));
    const finalAlpha = depthAlphaFactor * particle.alpha;
    const particleSize = scale * this.particleRad * (1 + this.mouseInfluence * 0.2);

    // Draw main particle
    context.fillStyle = `rgba(${Math.floor(this.currentR)}, ${Math.floor(this.currentG)}, ${Math.floor(this.currentB)}, ${finalAlpha})`;
    context.beginPath();
    context.arc(particle.projX, particle.projY, particleSize, 0, 2 * Math.PI);
    context.fill();

    // Draw glow effect if enabled and appropriate
    if (this.shouldEnableGlow() && this.mouseInfluence > 0.5 && finalAlpha > 0.3) {
      context.fillStyle = `rgba(${Math.floor(this.currentR)}, ${Math.floor(this.currentG)}, ${Math.floor(this.currentB)}, ${finalAlpha * 0.3})`;
      context.beginPath();
      context.arc(particle.projX, particle.projY, particleSize * 1.5, 0, 2 * Math.PI);
      context.fill();
    }
  }

  private recycleParticle(particle: Particle): void {
    this.currentParticleCount = Math.max(0, this.currentParticleCount - 1);

    // Remove from particle list
    if (this.particleList.first === particle) {
      this.particleList.first = particle.next;
      if (particle.next) {
        particle.next.prev = undefined;
      }
    } else {
      if (particle.prev) {
        particle.prev.next = particle.next;
      }
      if (particle.next) {
        particle.next.prev = particle.prev;
      }
    }

    // Return to pool
    this.particlePool.release(particle);
  }

  protected onDispose(): void {
    // Clean up all particles
    this.particleList.first = undefined;
    this.currentParticleCount = 0;
    this.particlePool.clear();
  }
}