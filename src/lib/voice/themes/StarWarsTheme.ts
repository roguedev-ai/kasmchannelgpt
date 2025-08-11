/**
 * Star Wars Theme (Simplified)
 * 
 * A subtle Star Wars-inspired theme with holographic effects.
 * Optimized for performance with circular particle animations.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { lerp, smoothstep } from '../utils/math';

export class StarWarsTheme extends BaseTheme {
  readonly id = 'starwars';
  readonly name = 'Star Wars';
  readonly description = 'Subtle holographic visualization inspired by Star Wars';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'light' as const;

  // Simplified particle system
  private particles: Array<{
    angle: number;
    radius: number;
    targetRadius: number;
    alpha: number;
    flickerPhase: number;
    speed: number;
    glowIntensity: number;
  }> = [];
  
  // Hologram effect state
  private scanlinePosition = 0;
  private flickerIntensity = 1;
  private globalPhase = 0;
  
  // Color scheme
  private hologramBlue = new Color(0, 162, 255, 0.8);
  private lightsaberRed = new Color(255, 0, 0, 0.6);
  private lightsaberGreen = new Color(0, 255, 0, 0.6);
  private coreWhite = new Color(255, 255, 255, 0.9);

  protected onInit(): void {
    this.createHologramParticles();
  }

  private createHologramParticles(): void {
    const particleCount = 48; // Reduced for performance
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const baseRadius = 70 + Math.random() * 30;
      
      this.particles.push({
        angle,
        radius: baseRadius,
        targetRadius: baseRadius,
        alpha: 0.3 + Math.random() * 0.4,
        flickerPhase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
        glowIntensity: 0.5 + Math.random() * 0.5
      });
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
    const dt = deltaTime * 0.001;
    
    // Update animations
    this.globalPhase += dt * 0.5;
    this.scanlinePosition = (this.scanlinePosition + dt * 100) % height;
    this.flickerIntensity = 0.8 + Math.sin(this.globalPhase * 20) * 0.2;
    
    // Clear with dark space background
    context.fillStyle = 'rgba(0, 0, 10, 0.2)';
    context.fillRect(0, 0, width, height);
    
    // Draw holographic circle
    this.drawHologramCircle(context, centerX, centerY, dt);
    
    // Draw center core
    this.drawCenterCore(context, centerX, centerY);
    
    // Draw scanlines for hologram effect
    if (this.shouldEnableEffects()) {
      this.drawScanlines(context, width, height);
    }
  }

  private drawHologramCircle(context: CanvasRenderingContext2D, centerX: number, centerY: number, dt: number): void {
    context.save();
    
    // Update and draw particles
    for (const particle of this.particles) {
      // Update rotation
      particle.angle += particle.speed * dt;
      
      // Update radius based on state
      const stateMultiplier = this.getStateRadiusMultiplier();
      const waveOffset = Math.sin(particle.angle * 3 + this.globalPhase) * 10;
      particle.targetRadius = (70 + waveOffset) * stateMultiplier;
      particle.radius = lerp(particle.radius, particle.targetRadius, 0.08);
      
      // Calculate position
      const x = centerX + Math.cos(particle.angle) * particle.radius;
      const y = centerY + Math.sin(particle.angle) * particle.radius;
      
      // Hologram flicker effect
      const flicker = Math.sin(particle.flickerPhase + this.globalPhase * 10) * 0.3 + 0.7;
      const alpha = particle.alpha * this.flickerIntensity * flicker;
      
      // Draw holographic particle
      const size = 3 + Math.sin(this.globalPhase + particle.flickerPhase) * 1;
      
      // Glow effect
      const gradient = context.createRadialGradient(x, y, 0, x, y, size * 4);
      gradient.addColorStop(0, `rgba(${this.hologramBlue.r}, ${this.hologramBlue.g}, ${this.hologramBlue.b}, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(${this.hologramBlue.r}, ${this.hologramBlue.g}, ${this.hologramBlue.b}, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      
      context.fillStyle = gradient;
      context.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
      
      // Core particle
      context.fillStyle = `rgba(${this.coreWhite.r}, ${this.coreWhite.g}, ${this.coreWhite.b}, ${alpha})`;
      context.beginPath();
      context.arc(x, y, size * 0.5, 0, Math.PI * 2);
      context.fill();
    }
    
    context.restore();
  }

  private drawCenterCore(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const intensity = this.getStateIntensity();
    const coreSize = 15 + Math.sin(this.globalPhase * 2) * 3;
    
    // Determine color based on state
    const coreColor = this.currentState === VoiceState.USER_SPEAKING ? this.lightsaberGreen :
                      this.currentState === VoiceState.AI_SPEAKING ? this.lightsaberRed :
                      this.hologramBlue;
    
    // Outer glow
    const glowGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, coreSize * 4
    );
    
    glowGradient.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${0.4 * intensity})`);
    glowGradient.addColorStop(0.5, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${0.2 * intensity})`);
    glowGradient.addColorStop(1, 'transparent');
    
    context.fillStyle = glowGradient;
    context.fillRect(
      centerX - coreSize * 4,
      centerY - coreSize * 4,
      coreSize * 8,
      coreSize * 8
    );
    
    // Inner core
    const coreGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, coreSize
    );
    
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
    coreGradient.addColorStop(0.7, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${0.7 * intensity})`);
    coreGradient.addColorStop(1, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${0.4 * intensity})`);
    
    context.fillStyle = coreGradient;
    context.beginPath();
    context.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
    context.fill();
  }

  private drawScanlines(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.save();
    context.globalAlpha = 0.1;
    
    // Horizontal scanlines
    for (let y = 0; y < height; y += 4) {
      const alpha = Math.abs(Math.sin((y + this.scanlinePosition) * 0.01)) * 0.5;
      context.strokeStyle = `rgba(0, 162, 255, ${alpha})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    
    context.restore();
  }

  private getStateRadiusMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.3;
      case VoiceState.PROCESSING:
        return 0.8 + Math.sin(this.globalPhase * 4) * 0.2;
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
        return 0.6 + Math.sin(this.globalPhase * 6) * 0.4;
      case VoiceState.AI_SPEAKING:
        return 0.9;
      default:
        return 0.7;
    }
  }

  protected onStateChange(newState: VoiceState): void {
    // Update particle speeds based on state
    const speedMultiplier = 
      newState === VoiceState.USER_SPEAKING ? 1.2 :
      newState === VoiceState.PROCESSING ? 2.5 :
      newState === VoiceState.AI_SPEAKING ? 1.0 : 0.7;
    
    this.particles.forEach(particle => {
      particle.speed = (0.3 + Math.random() * 0.4) * speedMultiplier;
    });
  }

  protected onReset(): void {
    this.particles = [];
    this.scanlinePosition = 0;
    this.flickerIntensity = 1;
    this.globalPhase = 0;
    this.createHologramParticles();
  }

  protected onDispose(): void {
    this.particles = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      particleCount: this.particles.length,
      flickerIntensity: this.flickerIntensity
    };
  }
}