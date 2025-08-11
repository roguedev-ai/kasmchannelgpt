/**
 * Minecraft Theme (Simplified)
 * 
 * A subtle Minecraft-inspired theme with pixelated circular particles.
 * Optimized for performance with smooth circular animations.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { lerp, smoothstep } from '../utils/math';

export class MinecraftTheme extends BaseTheme {
  readonly id = 'minecraft';
  readonly name = 'Minecraft';
  readonly description = 'Subtle pixelated visualization with blocky particles';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'light' as const;

  // Pixelated particles in circular arrangement
  private particles: Array<{
    angle: number;
    radius: number;
    targetRadius: number;
    color: Color;
    alpha: number;
    speed: number;
    size: number;
    layer: number;
    pixelOffset: number;
  }> = [];
  
  // Animation state
  private globalPhase = 0;
  private pixelPhase = 0;
  private colorShift = 0;
  
  // Minecraft color palette
  private blockColors = [
    new Color(124, 189, 82, 0.8),   // Grass green
    new Color(136, 136, 136, 0.8),  // Stone gray
    new Color(162, 130, 78, 0.8),   // Wood brown
    new Color(99, 237, 229, 0.9),   // Diamond cyan
    new Color(254, 223, 63, 0.9),   // Gold yellow
    new Color(255, 0, 0, 0.9),      // Redstone red
  ];

  protected onInit(): void {
    this.createPixelatedCircle();
  }

  private createPixelatedCircle(): void {
    // Create 3 concentric rings of pixelated particles
    const rings = [
      { radius: 60, particles: 16, layer: 0 },
      { radius: 80, particles: 24, layer: 1 },
      { radius: 100, particles: 32, layer: 2 }
    ];
    
    rings.forEach(ring => {
      for (let i = 0; i < ring.particles; i++) {
        const angle = (i / ring.particles) * Math.PI * 2;
        const colorIndex = Math.floor(Math.random() * this.blockColors.length);
        
        this.particles.push({
          angle,
          radius: ring.radius,
          targetRadius: ring.radius,
          color: this.blockColors[colorIndex].clone(),
          alpha: 0.8 - ring.layer * 0.2,
          speed: 0.3 + Math.random() * 0.3,
          size: 8 - ring.layer * 2, // Smaller pixels for outer rings
          layer: ring.layer,
          pixelOffset: Math.random() * 10
        });
      }
    });
  }

  protected onDraw(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    deltaTime: number
  ): void {
    const dt = deltaTime * 0.001;
    
    // Update animations
    this.globalPhase += dt * 0.5;
    this.pixelPhase += dt * 2;
    this.colorShift += dt * 0.1;
    
    // Clear with dark background
    context.fillStyle = 'rgba(10, 10, 20, 0.15)';
    context.fillRect(0, 0, width, height);
    
    // Draw pixelated background pattern
    if (this.shouldEnableEffects()) {
      this.drawPixelatedBackground(context, width, height);
    }
    
    // Draw circular pixel arrangement
    this.drawPixelCircle(context, centerX, centerY, dt);
    
    // Draw center block
    this.drawCenterBlock(context, centerX, centerY);
  }

  private drawPixelatedBackground(context: CanvasRenderingContext2D, width: number, height: number): void {
    // Draw subtle pixelated grid dots
    const pixelSize = 20;
    const dotSize = 2;
    
    context.fillStyle = 'rgba(100, 100, 100, 0.1)';
    
    for (let x = 0; x < width; x += pixelSize) {
      for (let y = 0; y < height; y += pixelSize) {
        if ((x / pixelSize + y / pixelSize) % 2 === 0) {
          context.fillRect(x, y, dotSize, dotSize);
        }
      }
    }
  }

  private drawPixelCircle(context: CanvasRenderingContext2D, centerX: number, centerY: number, dt: number): void {
    context.save();
    
    // Group particles by layer for proper rendering
    for (let layer = 2; layer >= 0; layer--) {
      const layerParticles = this.particles.filter(p => p.layer === layer);
      
      for (const particle of layerParticles) {
        // Update rotation
        particle.angle += particle.speed * dt * this.getStateSpeedMultiplier();
        
        // Update radius with pixelated movement
        const pixelWave = Math.floor(Math.sin(particle.angle * 4 + this.pixelPhase + particle.pixelOffset) * 3) * 5;
        const stateMultiplier = this.getStateRadiusMultiplier();
        particle.targetRadius = (60 + layer * 20 + pixelWave) * stateMultiplier;
        particle.radius = lerp(particle.radius, particle.targetRadius, 0.1);
        
        // Calculate position
        const x = centerX + Math.cos(particle.angle) * particle.radius;
        const y = centerY + Math.sin(particle.angle) * particle.radius;
        
        // Color shifting
        if (Math.random() < 0.01) {
          const newColorIndex = Math.floor(Math.random() * this.blockColors.length);
          particle.color = this.blockColors[newColorIndex].clone();
        }
        
        // Draw pixelated block
        const intensity = this.getStateIntensity();
        const alpha = particle.alpha * intensity;
        
        // Shadow for depth
        context.fillStyle = `rgba(0, 0, 0, ${alpha * 0.3})`;
        context.fillRect(
          Math.floor(x - particle.size / 2) + 2,
          Math.floor(y - particle.size / 2) + 2,
          particle.size,
          particle.size
        );
        
        // Main block
        context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
        context.fillRect(
          Math.floor(x - particle.size / 2),
          Math.floor(y - particle.size / 2),
          particle.size,
          particle.size
        );
        
        // Highlight for 3D effect
        context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
        context.fillRect(
          Math.floor(x - particle.size / 2),
          Math.floor(y - particle.size / 2),
          particle.size - 2,
          2
        );
      }
    }
    
    context.restore();
  }

  private drawCenterBlock(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const intensity = this.getStateIntensity();
    const blockSize = 20 + Math.floor(Math.sin(this.pixelPhase) * 2) * 2; // Pixelated pulsing
    
    // Determine center block type based on state
    const centerColor = this.currentState === VoiceState.USER_SPEAKING ? this.blockColors[0] : // Grass
                       this.currentState === VoiceState.PROCESSING ? this.blockColors[3] : // Diamond
                       this.currentState === VoiceState.AI_SPEAKING ? this.blockColors[4] : // Gold
                       this.blockColors[1]; // Stone
    
    // Shadow
    context.fillStyle = `rgba(0, 0, 0, 0.4)`;
    context.fillRect(
      centerX - blockSize / 2 + 3,
      centerY - blockSize / 2 + 3,
      blockSize,
      blockSize
    );
    
    // Main block
    context.fillStyle = `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, ${0.9 * intensity})`;
    context.fillRect(
      centerX - blockSize / 2,
      centerY - blockSize / 2,
      blockSize,
      blockSize
    );
    
    // Top face (lighter)
    context.fillStyle = `rgba(${Math.min(255, centerColor.r + 30)}, ${Math.min(255, centerColor.g + 30)}, ${Math.min(255, centerColor.b + 30)}, ${0.9 * intensity})`;
    context.fillRect(
      centerX - blockSize / 2,
      centerY - blockSize / 2,
      blockSize,
      blockSize / 3
    );
    
    // Highlight
    context.fillStyle = `rgba(255, 255, 255, ${0.3 * intensity})`;
    context.fillRect(
      centerX - blockSize / 2,
      centerY - blockSize / 2,
      blockSize - 2,
      2
    );
  }

  private getStateRadiusMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.2;
      case VoiceState.PROCESSING:
        return 0.9 + Math.sin(this.globalPhase * 3) * 0.1;
      case VoiceState.AI_SPEAKING:
        return 1.1;
      default:
        return 1.0;
    }
  }

  private getStateSpeedMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.5;
      case VoiceState.PROCESSING:
        return 2.5;
      case VoiceState.AI_SPEAKING:
        return 1.2;
      default:
        return 1.0;
    }
  }

  private getStateIntensity(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.0;
      case VoiceState.PROCESSING:
        return 0.7 + Math.sin(this.globalPhase * 4) * 0.3;
      case VoiceState.AI_SPEAKING:
        return 0.9;
      default:
        return 0.7;
    }
  }

  protected onStateChange(newState: VoiceState): void {
    // Update particle speeds based on state
    const speedMultiplier = 
      newState === VoiceState.USER_SPEAKING ? 1.5 :
      newState === VoiceState.PROCESSING ? 2.5 :
      newState === VoiceState.AI_SPEAKING ? 1.2 : 1.0;
    
    this.particles.forEach(particle => {
      particle.speed = (0.3 + Math.random() * 0.3) * speedMultiplier;
    });
  }

  protected onMouseMove(x: number, y: number, normalizedX: number, normalizedY: number): void {
    // Simple mouse tracking for particles
    const mouseInfluence = 0.2;
    this.particles.forEach(particle => {
      const dx = x - this.centerX;
      const dy = y - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 200 && distance > 0) {
        const influence = (1 - distance / 200) * mouseInfluence;
        particle.targetRadius = particle.radius + (distance - 100) * influence;
      }
    });
  }

  protected onReset(): void {
    // Clear particles
    this.particles = [];
    
    // Reset animation state
    this.globalPhase = 0;
    this.pixelPhase = 0;
    this.colorShift = 0;
    
    // Recreate particles
    this.createPixelatedCircle();
  }

  protected onDispose(): void {
    this.particles = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      particleCount: this.particles.length,
      pixelPhase: this.pixelPhase
    };
  }
}