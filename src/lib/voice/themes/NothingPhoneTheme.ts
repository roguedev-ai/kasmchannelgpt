/**
 * Nothing Phone Theme
 * 
 * A minimalist theme inspired by Nothing Phone's Glyph interface.
 * Features clean dots, typography effects, and subtle glowing animations
 * with a focus on simplicity and clarity.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { ObjectPool } from '../utils/performance';
import { lerp, clamp, smoothstep, easeInOutCubic } from '../utils/math';

interface GlyphDot {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  targetSize: number;
  alpha: number;
  targetAlpha: number;
  glowIntensity: number;
  pulsePhase: number;
  pulseSpeed: number;
  groupId: number;
  isActive: boolean;
  connectionStrength: number;
}

interface GlyphLine {
  startDot: GlyphDot;
  endDot: GlyphDot;
  progress: number;
  alpha: number;
  pulseOffset: number;
}

interface Typography {
  text: string;
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  lifetime: number;
  maxLifetime: number;
  style: 'normal' | 'bold' | 'light';
  animation: 'fade' | 'typewriter' | 'glitch';
  progress: number;
}

interface MinimalParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  velocity: { x: number; y: number };
}

export class NothingPhoneTheme extends BaseTheme {
  readonly id = 'nothing';
  readonly name = 'Nothing Phone';
  readonly description = 'Minimalist design inspired by Nothing Phone with clean dots and typography';
  readonly category = 'artistic' as const;
  readonly performanceProfile = 'light' as const;

  // Object pools
  private dotPool: ObjectPool<GlyphDot>;
  private particlePool: ObjectPool<MinimalParticle>;
  private typographyPool: ObjectPool<Typography>;

  // Active elements
  private dots: GlyphDot[] = [];
  private lines: GlyphLine[] = [];
  private particles: MinimalParticle[] = [];
  private typographyElements: Typography[] = [];

  // Grid configuration
  private gridColumns = 11;
  private gridRows = 7;
  private dotSpacing = 50;
  private baseGridX = 0;
  private baseGridY = 0;

  // Theme state
  private glyphPatternIndex = 0;
  private patternTransition = 0;
  private globalPulse = 0;
  private connectionPhase = 0;
  private typographyPhase = 0;

  // Nothing Phone signature colors
  private readonly colors = {
    white: new Color(255, 255, 255),
    offWhite: new Color(245, 245, 245),
    lightGray: new Color(200, 200, 200),
    gray: new Color(128, 128, 128),
    darkGray: new Color(64, 64, 64),
    black: new Color(0, 0, 0),
    accent: new Color(255, 255, 255) // Pure white for glow
  };

  // Glyph patterns for different states
  private glyphPatterns = {
    idle: [
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    ],
    speaking: [
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0]
    ],
    processing: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
  };

  // Typography messages
  private messages = {
    idle: ['nothing', 'minimal', 'clarity'],
    userSpeaking: ['listening...', 'processing voice', 'analyzing'],
    processing: ['thinking...', 'computing', 'processing'],
    aiSpeaking: ['responding', 'speaking', 'communicating']
  };

  constructor() {
    super();

    // Initialize object pools
    this.dotPool = new ObjectPool<GlyphDot>(
      () => ({
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        size: 4,
        targetSize: 4,
        alpha: 0,
        targetAlpha: 0,
        glowIntensity: 0,
        pulsePhase: 0,
        pulseSpeed: 1,
        groupId: 0,
        isActive: false,
        connectionStrength: 0
      }),
      dot => {
        dot.alpha = 0;
        dot.targetAlpha = 0;
        dot.isActive = false;
        dot.glowIntensity = 0;
      },
      100
    );

    this.particlePool = new ObjectPool<MinimalParticle>(
      () => ({
        x: 0,
        y: 0,
        size: 2,
        alpha: 0,
        lifetime: 0,
        maxLifetime: 1,
        velocity: { x: 0, y: 0 }
      }),
      particle => {
        particle.alpha = 0;
        particle.lifetime = 0;
      },
      50
    );

    this.typographyPool = new ObjectPool<Typography>(
      () => ({
        text: '',
        x: 0,
        y: 0,
        size: 24,
        alpha: 0,
        targetAlpha: 0,
        lifetime: 0,
        maxLifetime: 3,
        style: 'normal',
        animation: 'fade',
        progress: 0
      }),
      typo => {
        typo.alpha = 0;
        typo.targetAlpha = 0;
        typo.lifetime = 0;
        typo.progress = 0;
      },
      10
    );
  }

  protected onInit(): void {
    this.calculateGridPosition();
    this.createDotGrid();
    this.applyGlyphPattern(this.glyphPatterns.idle);
  }

  private calculateGridPosition(): void {
    const totalWidth = (this.gridColumns - 1) * this.dotSpacing;
    const totalHeight = (this.gridRows - 1) * this.dotSpacing;
    this.baseGridX = this.centerX - totalWidth / 2;
    this.baseGridY = this.centerY - totalHeight / 2;
  }

  private createDotGrid(): void {
    let dotIndex = 0;
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridColumns; col++) {
        const dot = this.dotPool.acquire();
        
        dot.x = dot.targetX = this.baseGridX + col * this.dotSpacing;
        dot.y = dot.targetY = this.baseGridY + row * this.dotSpacing;
        dot.size = dot.targetSize = 4;
        dot.alpha = 0.1;
        dot.targetAlpha = 0.1;
        dot.glowIntensity = 0;
        dot.pulsePhase = (col + row) * 0.2;
        dot.pulseSpeed = 1 + Math.random() * 0.5;
        dot.groupId = dotIndex++;
        dot.isActive = false;
        dot.connectionStrength = 0;
        
        this.dots.push(dot);
      }
    }
  }

  private applyGlyphPattern(pattern: number[][]): void {
    for (let row = 0; row < this.gridRows && row < pattern.length; row++) {
      for (let col = 0; col < this.gridColumns && col < pattern[row].length; col++) {
        const dotIndex = row * this.gridColumns + col;
        if (dotIndex < this.dots.length) {
          const dot = this.dots[dotIndex];
          const isActive = pattern[row][col] === 1;
          
          dot.isActive = isActive;
          dot.targetAlpha = isActive ? 0.9 : 0.1;
          dot.targetSize = isActive ? 8 : 4;
          dot.glowIntensity = isActive ? 1 : 0;
        }
      }
    }

    // Update connections
    this.updateConnections();
  }

  private updateConnections(): void {
    this.lines = [];

    // Find active dots and create connections
    const activeDots = this.dots.filter(d => d.isActive);
    
    for (let i = 0; i < activeDots.length; i++) {
      const dot1 = activeDots[i];
      
      // Connect to nearby active dots
      for (let j = i + 1; j < activeDots.length; j++) {
        const dot2 = activeDots[j];
        const dx = dot2.x - dot1.x;
        const dy = dot2.y - dot1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Connect if close enough (adjacent in grid)
        if (distance <= this.dotSpacing * 1.5) {
          this.lines.push({
            startDot: dot1,
            endDot: dot2,
            progress: 0,
            alpha: 0.3,
            pulseOffset: Math.random() * Math.PI * 2
          });
        }
      }
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

    // Draw background gradient
    this.drawBackground(context, width, height);

    // Draw elements
    this.drawConnections(context);
    this.drawDots(context);
    this.drawParticles(context);
    this.drawTypography(context);

    // Render batched elements
    this.renderBatches(context);
  }

  private updateAnimations(deltaTime: number): void {
    const dt = deltaTime * 0.001;

    // Update global animations
    this.globalPulse += dt * 2;
    this.connectionPhase += dt * 3;
    this.typographyPhase += dt * 0.5;

    // Update pattern transition
    if (this.patternTransition < 1) {
      this.patternTransition = Math.min(1, this.patternTransition + dt * 2);
    }

    // Update dots
    this.updateDots(dt);

    // Update particles
    this.updateParticles(dt);

    // Update typography
    this.updateTypography(dt);

    // Spawn elements based on state
    this.spawnElements();
  }

  private updateDots(dt: number): void {
    for (const dot of this.dots) {
      // Smooth transitions
      dot.x = lerp(dot.x, dot.targetX, 0.1);
      dot.y = lerp(dot.y, dot.targetY, 0.1);
      dot.size = lerp(dot.size, dot.targetSize, 0.1);
      dot.alpha = lerp(dot.alpha, dot.targetAlpha, 0.1);

      // Update pulse
      dot.pulsePhase += dot.pulseSpeed * dt;

      // Mouse influence
      if (this.isHovering) {
        const dx = this.mouseX - dot.x;
        const dy = this.mouseY - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const influence = 1 - distance / 100;
          dot.targetSize = dot.isActive ? 8 + influence * 4 : 4 + influence * 2;
          dot.glowIntensity = Math.max(dot.glowIntensity, influence);
        }
      }

      // Connection strength based on activity
      if (dot.isActive) {
        dot.connectionStrength = 0.5 + Math.sin(dot.pulsePhase) * 0.5;
      } else {
        dot.connectionStrength = 0;
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

      // Fade out
      const lifeRatio = particle.lifetime / particle.maxLifetime;
      particle.alpha = (1 - lifeRatio) * 0.5;
    }
  }

  private updateTypography(dt: number): void {
    for (let i = this.typographyElements.length - 1; i >= 0; i--) {
      const typo = this.typographyElements[i];

      // Update lifetime
      typo.lifetime += dt;
      if (typo.lifetime >= typo.maxLifetime) {
        this.typographyPool.release(typo);
        this.typographyElements.splice(i, 1);
        continue;
      }

      // Update alpha
      typo.alpha = lerp(typo.alpha, typo.targetAlpha, 0.1);

      // Update animation progress
      if (typo.animation === 'typewriter') {
        typo.progress = Math.min(1, typo.progress + dt * 10);
      } else if (typo.animation === 'glitch') {
        typo.progress = (typo.progress + dt * 20) % 1;
      } else {
        typo.progress = 1;
      }

      // Fade in/out based on lifetime
      const fadeInDuration = 0.3;
      const fadeOutDuration = 0.5;
      
      if (typo.lifetime < fadeInDuration) {
        typo.targetAlpha = typo.lifetime / fadeInDuration;
      } else if (typo.lifetime > typo.maxLifetime - fadeOutDuration) {
        typo.targetAlpha = (typo.maxLifetime - typo.lifetime) / fadeOutDuration;
      } else {
        typo.targetAlpha = 1;
      }
    }
  }

  private spawnElements(): void {
    // Spawn particles from active dots
    if (this.currentState !== VoiceState.IDLE && Math.random() < 0.02) {
      const activeDots = this.dots.filter(d => d.isActive);
      if (activeDots.length > 0) {
        const dot = activeDots[Math.floor(Math.random() * activeDots.length)];
        this.spawnParticleFromDot(dot);
      }
    }

    // Spawn typography periodically
    if (this.typographyElements.length === 0 && Math.random() < 0.01) {
      this.spawnTypography();
    }
  }

  private spawnParticleFromDot(dot: GlyphDot): void {
    const particle = this.particlePool.acquire();
    
    particle.x = dot.x;
    particle.y = dot.y;
    particle.size = 1 + Math.random() * 2;
    particle.alpha = 0.5;
    particle.lifetime = 0;
    particle.maxLifetime = 1 + Math.random() * 2;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1;
    particle.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    
    this.particles.push(particle);
  }

  private spawnTypography(): void {
    const messages = this.messages[
      this.currentState === VoiceState.USER_SPEAKING ? 'userSpeaking' :
      this.currentState === VoiceState.PROCESSING ? 'processing' :
      this.currentState === VoiceState.AI_SPEAKING ? 'aiSpeaking' : 'idle'
    ];
    
    const text = messages[Math.floor(Math.random() * messages.length)];
    const typo = this.typographyPool.acquire();
    
    typo.text = text;
    typo.x = this.centerX;
    typo.y = this.canvasHeight - 100;
    typo.size = 16 + Math.random() * 8;
    typo.alpha = 0;
    typo.targetAlpha = 1;
    typo.lifetime = 0;
    typo.maxLifetime = 2 + Math.random() * 2;
    typo.style = Math.random() < 0.5 ? 'light' : 'normal';
    typo.animation = 
      this.currentState === VoiceState.PROCESSING ? 'glitch' :
      this.currentState === VoiceState.USER_SPEAKING ? 'typewriter' : 'fade';
    typo.progress = 0;
    
    this.typographyElements.push(typo);
  }

  private drawBackground(context: CanvasRenderingContext2D, width: number, height: number): void {
    // Subtle gradient background
    const gradient = context.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, Math.max(width, height) * 0.7
    );
    
    gradient.addColorStop(0, 'rgba(15, 15, 15, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  private drawConnections(context: CanvasRenderingContext2D): void {
    if (!this.shouldEnableEffects()) return;

    context.save();

    for (const line of this.lines) {
      const alpha = line.alpha * line.startDot.connectionStrength * line.endDot.connectionStrength;
      if (alpha <= 0) continue;

      // Animated pulse along the line
      const pulsePos = (Math.sin(this.connectionPhase + line.pulseOffset) + 1) / 2;
      
      // Draw line
      const gradient = context.createLinearGradient(
        line.startDot.x, line.startDot.y,
        line.endDot.x, line.endDot.y
      );
      
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`);
      gradient.addColorStop(pulsePos, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.5})`);
      
      context.strokeStyle = gradient;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(line.startDot.x, line.startDot.y);
      context.lineTo(line.endDot.x, line.endDot.y);
      context.stroke();
    }

    context.restore();
  }

  private drawDots(context: CanvasRenderingContext2D): void {
    for (const dot of this.dots) {
      if (dot.alpha <= 0) continue;

      // Calculate pulse effect
      const pulse = 1 + Math.sin(dot.pulsePhase + this.globalPulse) * 0.1;
      const size = dot.size * pulse;

      // Draw glow if active
      if (this.shouldEnableGlow() && dot.glowIntensity > 0) {
        const glowGradient = context.createRadialGradient(
          dot.x, dot.y, 0,
          dot.x, dot.y, size * 4
        );
        
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${dot.alpha * dot.glowIntensity * 0.5})`);
        glowGradient.addColorStop(0.5, `rgba(255, 255, 255, ${dot.alpha * dot.glowIntensity * 0.2})`);
        glowGradient.addColorStop(1, 'transparent');
        
        context.fillStyle = glowGradient;
        context.fillRect(
          dot.x - size * 4,
          dot.y - size * 4,
          size * 8,
          size * 8
        );
      }

      // Draw dot
      context.fillStyle = `rgba(255, 255, 255, ${dot.alpha})`;
      context.beginPath();
      context.arc(dot.x, dot.y, size, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawParticles(context: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      if (particle.alpha <= 0) continue;

      this.addToBatch(
        `rgba(255, 255, 255, ${particle.alpha})`,
        particle.x,
        particle.y,
        particle.size,
        particle.alpha,
        false,
        false
      );
    }
  }

  private drawTypography(context: CanvasRenderingContext2D): void {
    context.save();
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    for (const typo of this.typographyElements) {
      if (typo.alpha <= 0) continue;

      // Set font style
      const weight = typo.style === 'bold' ? '700' :
                    typo.style === 'light' ? '300' : '400';
      context.font = `${weight} ${typo.size}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Apply animation
      let displayText = typo.text;
      let xOffset = 0;
      let yOffset = 0;

      if (typo.animation === 'typewriter') {
        const charCount = Math.floor(typo.text.length * typo.progress);
        displayText = typo.text.substring(0, charCount);
      } else if (typo.animation === 'glitch') {
        // Glitch effect
        if (Math.random() < 0.1) {
          xOffset = (Math.random() - 0.5) * 4;
          yOffset = (Math.random() - 0.5) * 2;
        }
      }

      // Draw text with subtle shadow
      context.fillStyle = `rgba(0, 0, 0, ${typo.alpha * 0.5})`;
      context.fillText(displayText, typo.x + 1 + xOffset, typo.y + 1 + yOffset);
      
      context.fillStyle = `rgba(255, 255, 255, ${typo.alpha})`;
      context.fillText(displayText, typo.x + xOffset, typo.y + yOffset);
    }

    context.restore();
  }

  protected onStateChange(newState: VoiceState): void {
    this.patternTransition = 0;

    switch (newState) {
      case VoiceState.USER_SPEAKING:
        this.applyGlyphPattern(this.glyphPatterns.speaking);
        break;
      
      case VoiceState.PROCESSING:
        this.applyGlyphPattern(this.glyphPatterns.processing);
        break;
      
      case VoiceState.AI_SPEAKING:
        this.applyGlyphPattern(this.glyphPatterns.speaking);
        break;
      
      case VoiceState.IDLE:
        this.applyGlyphPattern(this.glyphPatterns.idle);
        break;
    }
  }

  protected onReset(): void {
    // Clear all elements
    this.dots.forEach(dot => this.dotPool.release(dot));
    this.particles.forEach(particle => this.particlePool.release(particle));
    this.typographyElements.forEach(typo => this.typographyPool.release(typo));

    this.dots = [];
    this.lines = [];
    this.particles = [];
    this.typographyElements = [];

    // Reset state
    this.glyphPatternIndex = 0;
    this.patternTransition = 1;
    this.globalPulse = 0;
    this.connectionPhase = 0;
    this.typographyPhase = 0;

    // Recreate grid
    this.calculateGridPosition();
    this.createDotGrid();
    this.applyGlyphPattern(this.glyphPatterns.idle);
  }

  protected updateDimensions(width: number, height: number): void {
    super.updateDimensions(width, height);
    
    // Recalculate grid position when dimensions change
    this.calculateGridPosition();
    
    // Update dot positions
    let dotIndex = 0;
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridColumns; col++) {
        if (dotIndex < this.dots.length) {
          const dot = this.dots[dotIndex];
          dot.targetX = this.baseGridX + col * this.dotSpacing;
          dot.targetY = this.baseGridY + row * this.dotSpacing;
          dotIndex++;
        }
      }
    }
  }

  protected onDispose(): void {
    this.dots = [];
    this.lines = [];
    this.particles = [];
    this.typographyElements = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      dotCount: this.dots.length,
      activeDots: this.dots.filter(d => d.isActive).length,
      connectionCount: this.lines.length,
      particleCount: this.particles.length,
      typographyCount: this.typographyElements.length,
      currentPattern: this.currentState
    };
  }
}