/**
 * J.A.R.V.I.S. Theme (Simplified)
 * 
 * A subtle Iron Man-inspired AI interface theme.
 * Optimized for performance with circular HUD elements.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { lerp, smoothstep } from '../utils/math';

export class JarvisTheme extends BaseTheme {
  readonly id = 'jarvis';
  readonly name = 'J.A.R.V.I.S.';
  readonly description = 'Subtle arc reactor and HUD visualization';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'light' as const;

  // Arc reactor particles
  private particles: Array<{
    angle: number;
    radius: number;
    targetRadius: number;
    alpha: number;
    speed: number;
    arcLength: number;
    layer: number;
  }> = [];
  
  // Animation state
  private globalPhase = 0;
  private pulsePhase = 0;
  private rotationPhase = 0;
  
  // Color scheme
  private arcReactorBlue = new Color(0, 162, 232, 0.8);
  private arcReactorLight = new Color(100, 200, 255, 0.9);
  private energyOrange = new Color(255, 101, 0, 0.7);
  private coreWhite = new Color(255, 255, 255, 1);

  protected onInit(): void {
    this.createArcReactor();
  }

  private createArcReactor(): void {
    // Create concentric rings
    const rings = [
      { radius: 60, particles: 24, speed: 1.0 },
      { radius: 80, particles: 32, speed: -0.8 },
      { radius: 100, particles: 40, speed: 0.6 }
    ];
    
    rings.forEach((ring, layer) => {
      for (let i = 0; i < ring.particles; i++) {
        const angle = (i / ring.particles) * Math.PI * 2;
        const arcLength = Math.PI * 2 / ring.particles * 0.8; // Gaps between segments
        
        this.particles.push({
          angle,
          radius: ring.radius,
          targetRadius: ring.radius,
          alpha: 0.6 - layer * 0.1,
          speed: ring.speed,
          arcLength,
          layer
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
    this.pulsePhase += dt * 2;
    this.rotationPhase += dt * 0.3;
    
    // Clear with dark background
    context.fillStyle = 'rgba(0, 0, 5, 0.15)';
    context.fillRect(0, 0, width, height);
    
    // Draw arc reactor rings
    this.drawArcReactor(context, centerX, centerY, dt);
    
    // Draw center core
    this.drawCenterCore(context, centerX, centerY);
    
    // Draw subtle HUD elements
    if (this.shouldEnableEffects()) {
      this.drawHUDElements(context, centerX, centerY);
    }
  }

  private drawArcReactor(context: CanvasRenderingContext2D, centerX: number, centerY: number, dt: number): void {
    context.save();
    
    // Group particles by layer for proper rendering order
    for (let layer = 2; layer >= 0; layer--) {
      const layerParticles = this.particles.filter(p => p.layer === layer);
      
      for (const particle of layerParticles) {
        // Update rotation
        particle.angle += particle.speed * dt * this.getStateSpeedMultiplier();
        
        // Update radius with pulse effect
        const pulse = Math.sin(this.pulsePhase + particle.angle) * 5;
        const stateMultiplier = this.getStateRadiusMultiplier();
        particle.targetRadius = (60 + layer * 20 + pulse) * stateMultiplier;
        particle.radius = lerp(particle.radius, particle.targetRadius, 0.1);
        
        // Calculate arc position
        const startAngle = particle.angle;
        const endAngle = particle.angle + particle.arcLength;
        
        // Draw arc segment
        context.strokeStyle = this.getParticleColor(particle, layer);
        context.lineWidth = 3 - layer * 0.5;
        context.lineCap = 'round';
        
        context.beginPath();
        context.arc(centerX, centerY, particle.radius, startAngle, endAngle);
        context.stroke();
        
        // Add glow effect for inner ring
        if (layer === 0 && this.shouldEnableGlow()) {
          context.shadowBlur = 10;
          context.shadowColor = this.arcReactorLight.toString();
          context.stroke();
          context.shadowBlur = 0;
        }
      }
    }
    
    context.restore();
  }

  private drawCenterCore(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const intensity = this.getStateIntensity();
    const coreSize = 25 + Math.sin(this.pulsePhase) * 3;
    
    // Outer glow
    const glowGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, coreSize * 2
    );
    
    glowGradient.addColorStop(0, `rgba(${this.arcReactorLight.r}, ${this.arcReactorLight.g}, ${this.arcReactorLight.b}, ${0.4 * intensity})`);
    glowGradient.addColorStop(0.5, `rgba(${this.arcReactorBlue.r}, ${this.arcReactorBlue.g}, ${this.arcReactorBlue.b}, ${0.2 * intensity})`);
    glowGradient.addColorStop(1, 'transparent');
    
    context.fillStyle = glowGradient;
    context.fillRect(
      centerX - coreSize * 2,
      centerY - coreSize * 2,
      coreSize * 4,
      coreSize * 4
    );
    
    // Inner core - triangular arc reactor shape
    context.save();
    context.translate(centerX, centerY);
    context.rotate(this.rotationPhase);
    
    // Draw triangle
    context.fillStyle = `rgba(${this.coreWhite.r}, ${this.coreWhite.g}, ${this.coreWhite.b}, ${0.9 * intensity})`;
    context.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * coreSize * 0.6;
      const y = Math.sin(angle) * coreSize * 0.6;
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
    context.fill();
    
    context.restore();
  }

  private drawHUDElements(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const intensity = this.getStateIntensity() * 0.5;
    
    // Draw corner brackets
    const bracketSize = 20;
    const bracketOffset = 150;
    
    context.strokeStyle = `rgba(${this.arcReactorBlue.r}, ${this.arcReactorBlue.g}, ${this.arcReactorBlue.b}, ${intensity})`;
    context.lineWidth = 2;
    
    // Top-left bracket
    context.beginPath();
    context.moveTo(centerX - bracketOffset, centerY - bracketOffset + bracketSize);
    context.lineTo(centerX - bracketOffset, centerY - bracketOffset);
    context.lineTo(centerX - bracketOffset + bracketSize, centerY - bracketOffset);
    context.stroke();
    
    // Top-right bracket
    context.beginPath();
    context.moveTo(centerX + bracketOffset - bracketSize, centerY - bracketOffset);
    context.lineTo(centerX + bracketOffset, centerY - bracketOffset);
    context.lineTo(centerX + bracketOffset, centerY - bracketOffset + bracketSize);
    context.stroke();
    
    // Bottom-left bracket
    context.beginPath();
    context.moveTo(centerX - bracketOffset, centerY + bracketOffset - bracketSize);
    context.lineTo(centerX - bracketOffset, centerY + bracketOffset);
    context.lineTo(centerX - bracketOffset + bracketSize, centerY + bracketOffset);
    context.stroke();
    
    // Bottom-right bracket
    context.beginPath();
    context.moveTo(centerX + bracketOffset - bracketSize, centerY + bracketOffset);
    context.lineTo(centerX + bracketOffset, centerY + bracketOffset);
    context.lineTo(centerX + bracketOffset, centerY + bracketOffset - bracketSize);
    context.stroke();
  }

  private getParticleColor(particle: any, layer: number): string {
    const intensity = this.getStateIntensity();
    const alpha = particle.alpha * intensity;
    
    if (this.currentState === VoiceState.PROCESSING) {
      return `rgba(${this.energyOrange.r}, ${this.energyOrange.g}, ${this.energyOrange.b}, ${alpha})`;
    }
    
    const color = layer === 0 ? this.arcReactorLight : this.arcReactorBlue;
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  private getStateRadiusMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.1;
      case VoiceState.PROCESSING:
        return 0.95 + Math.sin(this.globalPhase * 4) * 0.05;
      case VoiceState.AI_SPEAKING:
        return 1.05;
      default:
        return 1.0;
    }
  }

  private getStateSpeedMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.5;
      case VoiceState.PROCESSING:
        return 3.0;
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
        return 0.8 + Math.sin(this.globalPhase * 5) * 0.2;
      case VoiceState.AI_SPEAKING:
        return 0.9;
      default:
        return 0.7;
    }
  }

  protected onStateChange(newState: VoiceState): void {
    // State changes are handled through multipliers
  }

  protected onReset(): void {
    this.particles = [];
    this.globalPhase = 0;
    this.pulsePhase = 0;
    this.rotationPhase = 0;
    this.createArcReactor();
  }

  protected onDispose(): void {
    this.particles = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      particleCount: this.particles.length,
      rotationPhase: this.rotationPhase
    };
  }
}