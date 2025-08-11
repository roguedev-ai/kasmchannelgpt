/**
 * Vintage Modern Theme
 * 
 * A nostalgic blend of retro aesthetics with modern animations.
 * Features film grain, vintage TV effects, retro colors, and
 * smooth modern transitions creating a unique temporal fusion.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { ObjectPool } from '../utils/performance';
import { lerp, clamp, smoothstep, easeInOutSine } from '../utils/math';

interface RetroShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  type: 'circle' | 'triangle' | 'square' | 'hexagon' | 'star';
  color: Color;
  strokeColor: Color;
  alpha: number;
  targetAlpha: number;
  pulsePhase: number;
  distortion: number;
  chromaShift: number;
  lifetime: number;
}

interface FilmGrain {
  x: number;
  y: number;
  size: number;
  brightness: number;
  lifetime: number;
  flickerSpeed: number;
}

interface TVScanline {
  y: number;
  thickness: number;
  brightness: number;
  speed: number;
  interference: number;
}

interface VintageParticle {
  x: number;
  y: number;
  size: number;
  color: Color;
  alpha: number;
  velocity: { x: number; y: number };
  lifetime: number;
  maxLifetime: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
  glowIntensity: number;
}

interface NeonText {
  text: string;
  x: number;
  y: number;
  size: number;
  font: 'retro' | 'neon' | 'pixel';
  color: Color;
  glowColor: Color;
  alpha: number;
  flickerPhase: number;
  flickerIntensity: number;
  lifetime: number;
}

export class VintageModernTheme extends BaseTheme {
  readonly id = 'vintage-modern';
  readonly name = 'Vintage Modern';
  readonly description = 'Retro aesthetics meets modern design with film grain and neon glow';
  readonly category = 'artistic' as const;
  readonly performanceProfile = 'medium' as const;

  // Object pools
  private shapePool: ObjectPool<RetroShape>;
  private grainPool: ObjectPool<FilmGrain>;
  private particlePool: ObjectPool<VintageParticle>;
  private textPool: ObjectPool<NeonText>;

  // Active elements
  private shapes: RetroShape[] = [];
  private grains: FilmGrain[] = [];
  private particles: VintageParticle[] = [];
  private texts: NeonText[] = [];
  private scanlines: TVScanline[] = [];

  // Animation state
  private globalPhase = 0;
  private tvStaticIntensity = 0.02;
  private chromaAberration = 0;
  private vhsDistortion = 0;
  private neonFlicker = 0;
  private filmFlicker = 0;

  // Retro color palettes
  private palettes = {
    miami: [
      new Color(255, 111, 145),  // Hot pink
      new Color(255, 154, 0),    // Orange
      new Color(237, 117, 255),  // Purple
      new Color(95, 225, 250),   // Cyan
      new Color(255, 241, 118)   // Yellow
    ],
    synthwave: [
      new Color(255, 0, 255),    // Magenta
      new Color(0, 255, 255),    // Cyan
      new Color(255, 0, 128),    // Pink
      new Color(128, 0, 255),    // Purple
      new Color(0, 128, 255)     // Blue
    ],
    retro: [
      new Color(255, 195, 113),  // Peach
      new Color(255, 154, 138),  // Coral
      new Color(255, 206, 84),   // Gold
      new Color(237, 229, 116),  // Pale yellow
      new Color(119, 211, 209)   // Turquoise
    ]
  };

  private currentPalette = this.palettes.miami;

  // Vintage messages
  private vintageMessages = [
    'PLAY', 'REC', 'PAUSE', 'REWIND', 'TRACKING',
    'SIGNAL', 'BROADCAST', 'CHANNEL', 'STEREO', 'HI-FI'
  ];

  constructor() {
    super();

    // Initialize object pools
    this.shapePool = new ObjectPool<RetroShape>(
      () => ({
        x: 0,
        y: 0,
        size: 40,
        rotation: 0,
        type: 'circle',
        color: new Color(255, 255, 255),
        strokeColor: new Color(255, 255, 255),
        alpha: 1,
        targetAlpha: 1,
        pulsePhase: 0,
        distortion: 0,
        chromaShift: 0,
        lifetime: 0
      }),
      shape => {
        shape.alpha = 1;
        shape.targetAlpha = 1;
        shape.distortion = 0;
        shape.lifetime = 0;
      },
      50
    );

    this.grainPool = new ObjectPool<FilmGrain>(
      () => ({
        x: 0,
        y: 0,
        size: 1,
        brightness: 0.5,
        lifetime: 0,
        flickerSpeed: 1
      }),
      grain => {
        grain.lifetime = 0;
        grain.brightness = 0.5;
      },
      1000
    );

    this.particlePool = new ObjectPool<VintageParticle>(
      () => ({
        x: 0,
        y: 0,
        size: 4,
        color: new Color(255, 255, 255),
        alpha: 1,
        velocity: { x: 0, y: 0 },
        lifetime: 0,
        maxLifetime: 1,
        trail: [],
        glowIntensity: 0
      }),
      particle => {
        particle.alpha = 1;
        particle.lifetime = 0;
        particle.trail = [];
      },
      200
    );

    this.textPool = new ObjectPool<NeonText>(
      () => ({
        text: '',
        x: 0,
        y: 0,
        size: 24,
        font: 'retro',
        color: new Color(255, 255, 255),
        glowColor: new Color(255, 255, 255),
        alpha: 1,
        flickerPhase: 0,
        flickerIntensity: 0,
        lifetime: 0
      }),
      text => {
        text.alpha = 1;
        text.lifetime = 0;
        text.flickerPhase = 0;
      },
      10
    );
  }

  protected onInit(): void {
    this.createScanlines();
    this.createInitialShapes();
    this.createFilmGrain();
  }

  private createScanlines(): void {
    const scanlineCount = 20;
    
    for (let i = 0; i < scanlineCount; i++) {
      this.scanlines.push({
        y: (i / scanlineCount) * this.canvasHeight,
        thickness: 1 + Math.random() * 2,
        brightness: 0.05 + Math.random() * 0.1,
        speed: 0.5 + Math.random() * 1.5,
        interference: Math.random() * Math.PI * 2
      });
    }
  }

  private createInitialShapes(): void {
    const shapeTypes: RetroShape['type'][] = ['circle', 'triangle', 'square', 'hexagon', 'star'];
    const shapeCount = 5;
    
    for (let i = 0; i < shapeCount; i++) {
      const shape = this.shapePool.acquire();
      const angle = (i / shapeCount) * Math.PI * 2;
      const radius = 100 + Math.random() * 50;
      
      shape.x = this.centerX + Math.cos(angle) * radius;
      shape.y = this.centerY + Math.sin(angle) * radius;
      shape.size = 30 + Math.random() * 40;
      shape.type = shapeTypes[i % shapeTypes.length];
      shape.color = this.getRandomPaletteColor().clone();
      shape.strokeColor = this.getRandomPaletteColor().clone();
      shape.pulsePhase = Math.random() * Math.PI * 2;
      shape.rotation = Math.random() * Math.PI * 2;
      
      this.shapes.push(shape);
    }
  }

  private createFilmGrain(): void {
    const grainCount = 200;
    
    for (let i = 0; i < grainCount; i++) {
      const grain = this.grainPool.acquire();
      
      grain.x = Math.random() * this.canvasWidth;
      grain.y = Math.random() * this.canvasHeight;
      grain.size = 0.5 + Math.random() * 1.5;
      grain.brightness = Math.random();
      grain.flickerSpeed = 10 + Math.random() * 20;
      
      this.grains.push(grain);
    }
  }

  protected onDraw(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    deltaTime: number
  ): void {
    // Update animations
    this.updateAnimations(deltaTime);

    // Apply CRT TV effect to entire canvas
    this.applyCRTEffect(context, width, height);

    // Draw vintage gradient background
    this.drawVintageBackground(context, width, height);

    // Draw elements
    this.drawShapes(context);
    this.drawParticles(context);
    this.drawNeonTexts(context);

    // Apply post-processing effects
    this.drawScanlines(context, width, height);
    this.drawFilmGrain(context, width, height);
    this.drawVHSDistortion(context, width, height);

    // Render batched elements
    this.renderBatches(context);
  }

  private updateAnimations(deltaTime: number): void {
    const dt = deltaTime * 0.001;

    // Update global animations
    this.globalPhase += dt;
    this.neonFlicker = Math.sin(this.globalPhase * 10) * 0.5 + 0.5;
    this.filmFlicker = 0.8 + Math.sin(this.globalPhase * 30) * 0.2;
    
    // Update TV effects
    this.vhsDistortion = Math.sin(this.globalPhase * 2) * 0.02;
    this.chromaAberration = 2 + Math.sin(this.globalPhase * 3) * 1;

    // Update shapes
    this.updateShapes(dt);

    // Update particles
    this.updateParticles(dt);

    // Update texts
    this.updateTexts(dt);

    // Update scanlines
    this.updateScanlines(dt);

    // Update film grain
    this.updateFilmGrain(dt);

    // Spawn elements based on state
    this.spawnElements();
  }

  private updateShapes(dt: number): void {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];

      // Update lifetime
      shape.lifetime += dt;

      // Update rotation
      shape.rotation += dt * 0.5;

      // Update pulse
      shape.pulsePhase += dt * 2;

      // Update alpha
      shape.alpha = lerp(shape.alpha, shape.targetAlpha, 0.1);

      // Orbit around center
      const orbitRadius = Math.sqrt(
        Math.pow(shape.x - this.centerX, 2) + 
        Math.pow(shape.y - this.centerY, 2)
      );
      const orbitAngle = Math.atan2(shape.y - this.centerY, shape.x - this.centerX) + dt * 0.2;
      
      shape.x = this.centerX + Math.cos(orbitAngle) * orbitRadius;
      shape.y = this.centerY + Math.sin(orbitAngle) * orbitRadius;

      // Apply distortion based on state
      if (this.currentState === VoiceState.PROCESSING) {
        shape.distortion = Math.sin(shape.lifetime * 5) * 0.1;
        shape.chromaShift = 5 + Math.sin(shape.lifetime * 3) * 3;
      } else {
        shape.distortion *= 0.9;
        shape.chromaShift *= 0.9;
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Update lifetime
      particle.lifetime += dt;
      if (particle.lifetime >= particle.maxLifetime) {
        this.particlePool.release(particle);
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      particle.x += particle.velocity.x * dt * 60;
      particle.y += particle.velocity.y * dt * 60;

      // Add to trail
      particle.trail.unshift({
        x: particle.x,
        y: particle.y,
        alpha: particle.alpha
      });

      // Limit trail length
      while (particle.trail.length > 10) {
        particle.trail.pop();
      }

      // Fade trail
      for (let j = 0; j < particle.trail.length; j++) {
        particle.trail[j].alpha *= 0.9;
      }

      // Update alpha
      const lifeRatio = particle.lifetime / particle.maxLifetime;
      particle.alpha = 1 - lifeRatio;
    }
  }

  private updateTexts(dt: number): void {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const text = this.texts[i];

      // Update lifetime
      text.lifetime += dt;
      if (text.lifetime > 3) {
        this.textPool.release(text);
        this.texts.splice(i, 1);
        continue;
      }

      // Update flicker
      text.flickerPhase += dt * 10;
      text.flickerIntensity = Math.random() < 0.05 ? Math.random() : text.flickerIntensity * 0.9;

      // Fade in/out
      if (text.lifetime < 0.3) {
        text.alpha = text.lifetime / 0.3;
      } else if (text.lifetime > 2.5) {
        text.alpha = (3 - text.lifetime) / 0.5;
      } else {
        text.alpha = 1 - text.flickerIntensity * 0.5;
      }
    }
  }

  private updateScanlines(dt: number): void {
    for (const scanline of this.scanlines) {
      scanline.y = (scanline.y + scanline.speed) % this.canvasHeight;
      scanline.interference += dt * 2;
    }
  }

  private updateFilmGrain(dt: number): void {
    // Randomly update grain positions
    for (const grain of this.grains) {
      if (Math.random() < 0.1) {
        grain.x = Math.random() * this.canvasWidth;
        grain.y = Math.random() * this.canvasHeight;
        grain.brightness = Math.random();
      }
    }
  }

  private spawnElements(): void {
    // Spawn particles
    if (this.currentState !== VoiceState.IDLE && Math.random() < 0.05) {
      this.spawnVintageParticle();
    }

    // Spawn text messages
    if (this.texts.length === 0 && Math.random() < 0.02) {
      this.spawnNeonText();
    }

    // Add new shapes if needed
    if (this.shapes.length < 8 && this.currentState === VoiceState.USER_SPEAKING) {
      if (Math.random() < 0.02) {
        this.createNewShape();
      }
    }
  }

  private spawnVintageParticle(): void {
    const particle = this.particlePool.acquire();
    
    // Spawn from random shape
    if (this.shapes.length > 0) {
      const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
      
      particle.x = shape.x;
      particle.y = shape.y;
      particle.size = 2 + Math.random() * 4;
      particle.color = shape.color.clone();
      particle.alpha = 1;
      particle.lifetime = 0;
      particle.maxLifetime = 1 + Math.random() * 2;
      particle.trail = [];
      particle.glowIntensity = 0.5 + Math.random() * 0.5;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particle.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      
      this.particles.push(particle);
    }
  }

  private spawnNeonText(): void {
    const text = this.textPool.acquire();
    
    text.text = this.vintageMessages[Math.floor(Math.random() * this.vintageMessages.length)];
    text.x = this.centerX + (Math.random() - 0.5) * 200;
    text.y = this.centerY + (Math.random() - 0.5) * 200;
    text.size = 20 + Math.random() * 20;
    text.font = ['retro', 'neon', 'pixel'][Math.floor(Math.random() * 3)] as NeonText['font'];
    text.color = this.getRandomPaletteColor().clone();
    text.glowColor = text.color.clone();
    text.alpha = 0;
    text.flickerPhase = 0;
    text.flickerIntensity = 0;
    text.lifetime = 0;
    
    this.texts.push(text);
  }

  private createNewShape(): void {
    const shape = this.shapePool.acquire();
    const angle = Math.random() * Math.PI * 2;
    const radius = 80 + Math.random() * 100;
    
    shape.x = this.centerX + Math.cos(angle) * radius;
    shape.y = this.centerY + Math.sin(angle) * radius;
    shape.size = 20 + Math.random() * 30;
    shape.type = ['circle', 'triangle', 'square', 'hexagon', 'star'][
      Math.floor(Math.random() * 5)
    ] as RetroShape['type'];
    shape.color = this.getRandomPaletteColor().clone();
    shape.strokeColor = this.getRandomPaletteColor().clone();
    shape.pulsePhase = Math.random() * Math.PI * 2;
    shape.rotation = Math.random() * Math.PI * 2;
    shape.targetAlpha = 0.8;
    shape.alpha = 0;
    
    this.shapes.push(shape);
  }

  private applyCRTEffect(context: CanvasRenderingContext2D, width: number, height: number): void {
    // Create subtle vignette effect
    const gradient = context.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, Math.max(width, height) * 0.7
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  private drawVintageBackground(context: CanvasRenderingContext2D, width: number, height: number): void {
    // Create retro gradient
    const gradient = context.createLinearGradient(0, 0, width, height);
    
    const color1 = this.currentPalette[0];
    const color2 = this.currentPalette[2];
    
    gradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.1)`);
    gradient.addColorStop(0.5, 'rgba(20, 20, 30, 0.9)');
    gradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.1)`);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  private drawShapes(context: CanvasRenderingContext2D): void {
    for (const shape of this.shapes) {
      if (shape.alpha <= 0) continue;

      context.save();
      context.translate(shape.x, shape.y);
      context.rotate(shape.rotation);
      
      // Apply distortion
      if (shape.distortion > 0) {
        context.transform(
          1 + shape.distortion,
          shape.distortion * 0.2,
          shape.distortion * 0.1,
          1 - shape.distortion * 0.5,
          0, 0
        );
      }

      const pulseScale = 1 + Math.sin(shape.pulsePhase) * 0.1;
      context.scale(pulseScale, pulseScale);

      // Draw shape with chromatic aberration
      if (shape.chromaShift > 0) {
        // Red channel
        context.globalCompositeOperation = 'screen';
        context.fillStyle = `rgba(255, 0, 0, ${shape.alpha * 0.5})`;
        context.translate(-shape.chromaShift, 0);
        this.drawShapeGeometry(context, shape);
        
        // Blue channel
        context.fillStyle = `rgba(0, 0, 255, ${shape.alpha * 0.5})`;
        context.translate(shape.chromaShift * 2, 0);
        this.drawShapeGeometry(context, shape);
        
        // Reset
        context.translate(-shape.chromaShift, 0);
        context.globalCompositeOperation = 'source-over';
      }

      // Main shape
      context.fillStyle = `rgba(${shape.color.r}, ${shape.color.g}, ${shape.color.b}, ${shape.alpha * 0.8})`;
      this.drawShapeGeometry(context, shape);

      // Stroke with glow
      if (this.shouldEnableGlow()) {
        context.shadowBlur = 20;
        context.shadowColor = `rgba(${shape.strokeColor.r}, ${shape.strokeColor.g}, ${shape.strokeColor.b}, ${shape.alpha})`;
      }
      
      context.strokeStyle = `rgba(${shape.strokeColor.r}, ${shape.strokeColor.g}, ${shape.strokeColor.b}, ${shape.alpha})`;
      context.lineWidth = 3;
      this.drawShapeGeometry(context, shape, true);
      
      context.shadowBlur = 0;
      context.restore();
    }
  }

  private drawShapeGeometry(context: CanvasRenderingContext2D, shape: RetroShape, strokeOnly = false): void {
    const size = shape.size;
    
    context.beginPath();
    
    switch (shape.type) {
      case 'circle':
        context.arc(0, 0, size, 0, Math.PI * 2);
        break;
      
      case 'triangle':
        context.moveTo(0, -size);
        context.lineTo(-size * 0.866, size * 0.5);
        context.lineTo(size * 0.866, size * 0.5);
        context.closePath();
        break;
      
      case 'square':
        context.rect(-size, -size, size * 2, size * 2);
        break;
      
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.closePath();
        break;
      
      case 'star':
        const spikes = 5;
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const radius = i % 2 === 0 ? size : size * 0.5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.closePath();
        break;
    }
    
    if (strokeOnly) {
      context.stroke();
    } else {
      context.fill();
    }
  }

  private drawParticles(context: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      if (particle.alpha <= 0) continue;

      // Draw trail
      if (particle.trail.length > 1) {
        context.beginPath();
        for (let i = 1; i < particle.trail.length; i++) {
          const p1 = particle.trail[i - 1];
          const p2 = particle.trail[i];
          
          if (i === 1) {
            context.moveTo(p1.x, p1.y);
          }
          context.lineTo(p2.x, p2.y);
        }
        
        const trailGradient = context.createLinearGradient(
          particle.trail[0].x, particle.trail[0].y,
          particle.trail[particle.trail.length - 1].x,
          particle.trail[particle.trail.length - 1].y
        );
        
        trailGradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha * 0.5})`);
        trailGradient.addColorStop(1, 'transparent');
        
        context.strokeStyle = trailGradient;
        context.lineWidth = particle.size * 0.5;
        context.stroke();
      }

      // Draw particle
      if (this.shouldEnableGlow() && particle.glowIntensity > 0) {
        const glowGradient = context.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        
        glowGradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha * particle.glowIntensity})`);
        glowGradient.addColorStop(1, 'transparent');
        
        context.fillStyle = glowGradient;
        context.fillRect(
          particle.x - particle.size * 3,
          particle.y - particle.size * 3,
          particle.size * 6,
          particle.size * 6
        );
      }

      context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawNeonTexts(context: CanvasRenderingContext2D): void {
    for (const text of this.texts) {
      if (text.alpha <= 0) continue;

      context.save();
      
      // Set font based on type
      switch (text.font) {
        case 'retro':
          context.font = `bold ${text.size}px "Courier New", monospace`;
          break;
        case 'neon':
          context.font = `${text.size}px "Arial", sans-serif`;
          break;
        case 'pixel':
          context.font = `${text.size}px monospace`;
          break;
      }
      
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Draw glow effect
      if (this.shouldEnableGlow()) {
        context.shadowBlur = 20 * (1 - text.flickerIntensity);
        context.shadowColor = `rgba(${text.glowColor.r}, ${text.glowColor.g}, ${text.glowColor.b}, ${text.alpha})`;
        
        // Multiple passes for stronger glow
        for (let i = 0; i < 3; i++) {
          context.fillStyle = `rgba(${text.color.r}, ${text.color.g}, ${text.color.b}, ${text.alpha * 0.3})`;
          context.fillText(text.text, text.x, text.y);
        }
      }
      
      // Draw main text
      context.shadowBlur = 0;
      context.fillStyle = `rgba(${text.color.r}, ${text.color.g}, ${text.color.b}, ${text.alpha})`;
      context.fillText(text.text, text.x, text.y);
      
      context.restore();
    }
  }

  private drawScanlines(context: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.shouldEnableEffects()) return;

    context.save();
    
    for (const scanline of this.scanlines) {
      const y = Math.floor(scanline.y);
      const brightness = scanline.brightness * (1 + Math.sin(scanline.interference) * 0.3);
      
      context.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      context.fillRect(0, y, width, scanline.thickness);
    }
    
    // Add horizontal scan pattern
    context.globalAlpha = 0.02;
    for (let y = 0; y < height; y += 2) {
      context.fillRect(0, y, width, 1);
    }
    
    context.restore();
  }

  private drawFilmGrain(context: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.shouldEnableEffects()) return;

    context.save();
    
    // Apply film flicker
    context.globalAlpha = this.filmFlicker * this.tvStaticIntensity;
    
    for (const grain of this.grains) {
      const alpha = grain.brightness * (1 + Math.sin(this.globalPhase * grain.flickerSpeed) * 0.5);
      context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      context.fillRect(grain.x, grain.y, grain.size, grain.size);
    }
    
    context.restore();
  }

  private drawVHSDistortion(context: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.shouldEnableEffects() || this.vhsDistortion === 0) return;

    // Create horizontal distortion bands
    const bandHeight = 20;
    const bands = Math.floor(height / bandHeight);
    
    for (let i = 0; i < bands; i++) {
      if (Math.random() < 0.05) {
        const y = i * bandHeight;
        const offset = Math.sin(this.globalPhase * 10 + i) * this.vhsDistortion * 50;
        
        // Copy and shift band
        context.drawImage(
          context.canvas,
          0, y, width, bandHeight,
          offset, y, width, bandHeight
        );
      }
    }
  }

  private getRandomPaletteColor(): Color {
    return this.currentPalette[Math.floor(Math.random() * this.currentPalette.length)].clone();
  }

  protected onStateChange(newState: VoiceState): void {
    switch (newState) {
      case VoiceState.USER_SPEAKING:
        // Switch to synthwave palette
        this.currentPalette = this.palettes.synthwave;
        this.tvStaticIntensity = 0.05;
        
        // Activate all shapes
        this.shapes.forEach(shape => {
          shape.targetAlpha = 1;
        });
        break;
      
      case VoiceState.PROCESSING:
        // Increase distortion
        this.tvStaticIntensity = 0.1;
        this.currentPalette = this.palettes.miami;
        break;
      
      case VoiceState.AI_SPEAKING:
        // Calm retro palette
        this.currentPalette = this.palettes.retro;
        this.tvStaticIntensity = 0.02;
        break;
      
      case VoiceState.IDLE:
        // Minimal static
        this.tvStaticIntensity = 0.02;
        this.shapes.forEach(shape => {
          shape.targetAlpha = 0.6;
        });
        break;
    }
  }

  protected onReset(): void {
    // Clear all elements
    this.shapes.forEach(shape => this.shapePool.release(shape));
    this.grains.forEach(grain => this.grainPool.release(grain));
    this.particles.forEach(particle => this.particlePool.release(particle));
    this.texts.forEach(text => this.textPool.release(text));

    this.shapes = [];
    this.grains = [];
    this.particles = [];
    this.texts = [];
    this.scanlines = [];

    // Reset state
    this.globalPhase = 0;
    this.tvStaticIntensity = 0.02;
    this.chromaAberration = 0;
    this.vhsDistortion = 0;
    this.neonFlicker = 0;
    this.filmFlicker = 0;

    // Recreate initial elements
    this.createScanlines();
    this.createInitialShapes();
    this.createFilmGrain();
  }

  protected onDispose(): void {
    this.shapes = [];
    this.grains = [];
    this.particles = [];
    this.texts = [];
    this.scanlines = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      shapeCount: this.shapes.length,
      particleCount: this.particles.length,
      textCount: this.texts.length,
      grainCount: this.grains.length,
      scanlineCount: this.scanlines.length,
      staticIntensity: this.tvStaticIntensity,
      distortionLevel: this.vhsDistortion
    };
  }
}