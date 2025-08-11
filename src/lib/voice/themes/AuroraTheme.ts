/**
 * Aurora Theme (Simplified)
 * 
 * A subtle aurora-inspired theme with gentle color transitions.
 * Optimized for performance with smooth circular animations.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { lerp, smoothstep } from '../utils/math';

export class AuroraTheme extends BaseTheme {
  readonly id = 'aurora';
  readonly name = 'Aurora Borealis';
  readonly description = 'Subtle aurora-inspired circular visualization';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'light' as const;

  // Simplified particle system
  private particles: Array<{
    angle: number;
    radius: number;
    targetRadius: number;
    color: Color;
    alpha: number;
    speed: number;
    phase: number;
  }> = [];
  
  // Animation state
  private globalPhase = 0;
  private colorPhase = 0;
  private pulsePhase = 0;

  // Aurora color palette
  private auroraColors = [
    new Color(0, 255, 0, 0.6),      // Green
    new Color(0, 200, 50, 0.5),     // Light green
    new Color(100, 200, 255, 0.4),  // Light blue
    new Color(147, 0, 211, 0.3),    // Purple
  ];

  protected onInit(): void {
    this.createParticles();
  }

  private createParticles(): void {
    const particleCount = 60; // Reduced count for performance
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const baseRadius = 80 + Math.random() * 40;
      
      this.particles.push({
        angle,
        radius: baseRadius,
        targetRadius: baseRadius,
        color: this.auroraColors[i % this.auroraColors.length].clone(),
        alpha: 0.3 + Math.random() * 0.3,
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
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
    this.globalPhase += dt * 0.3;
    this.colorPhase += dt * 0.2;
    this.pulsePhase += dt * 0.8;
    
    // Clear with dark background
    context.fillStyle = 'rgba(0, 8, 20, 0.15)';
    context.fillRect(0, 0, width, height);
    
    // Draw circular aurora effect
    this.drawAuroraCircle(context, centerX, centerY, dt);
    
    // Draw center orb
    this.drawCenterOrb(context, centerX, centerY);
  }

  private drawAuroraCircle(context: CanvasRenderingContext2D, centerX: number, centerY: number, dt: number): void {
    context.save();
    
    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Update position
      particle.angle += particle.speed * dt;
      
      // Smooth radius changes based on state
      const stateMultiplier = this.getStateRadiusMultiplier();
      const waveOffset = Math.sin(particle.angle * 2 + this.globalPhase + particle.phase) * 20;
      const targetRadius = (80 + waveOffset) * stateMultiplier;
      
      particle.radius = lerp(particle.radius, targetRadius, 0.05);
      
      // Calculate position
      const x = centerX + Math.cos(particle.angle) * particle.radius;
      const y = centerY + Math.sin(particle.angle) * particle.radius;
      
      // Update color phase
      const colorIndex = Math.floor((this.colorPhase + i * 0.1) % this.auroraColors.length);
      const targetColor = this.auroraColors[colorIndex];
      particle.color = particle.color.lerp(targetColor, 0.02);
      
      // Draw particle with soft glow
      const size = 4 + Math.sin(particle.phase + this.pulsePhase) * 2;
      const alpha = particle.alpha * (0.8 + Math.sin(this.pulsePhase + particle.phase) * 0.2);
      
      // Simple glow effect
      const gradient = context.createRadialGradient(x, y, 0, x, y, size * 3);
      gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      
      context.fillStyle = gradient;
      context.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);
      
      // Core particle
      context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 1.5})`;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    context.restore();
  }

  private drawCenterOrb(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const orbSize = 20 + Math.sin(this.pulsePhase) * 5;
    const intensity = this.getStateIntensity();
    
    // Outer glow
    const glowGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbSize * 3
    );
    
    glowGradient.addColorStop(0, `rgba(100, 255, 150, ${0.3 * intensity})`);
    glowGradient.addColorStop(0.5, `rgba(0, 200, 100, ${0.2 * intensity})`);
    glowGradient.addColorStop(1, 'transparent');
    
    context.fillStyle = glowGradient;
    context.fillRect(
      centerX - orbSize * 3,
      centerY - orbSize * 3,
      orbSize * 6,
      orbSize * 6
    );
    
    // Inner orb
    const orbGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbSize
    );
    
    orbGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * intensity})`);
    orbGradient.addColorStop(0.5, `rgba(150, 255, 200, ${0.6 * intensity})`);
    orbGradient.addColorStop(1, `rgba(0, 200, 100, ${0.4 * intensity})`);
    
    context.fillStyle = orbGradient;
    context.beginPath();
    context.arc(centerX, centerY, orbSize, 0, Math.PI * 2);
    context.fill();
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

  private getStateIntensity(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.0;
      case VoiceState.PROCESSING:
        return 0.7 + Math.sin(this.globalPhase * 5) * 0.3;
      case VoiceState.AI_SPEAKING:
        return 0.9;
      default:
        return 0.6;
    }
  }

  protected onStateChange(newState: VoiceState): void {
    // Update particle speeds based on state
    const speedMultiplier = 
      newState === VoiceState.USER_SPEAKING ? 1.5 :
      newState === VoiceState.PROCESSING ? 2.0 :
      newState === VoiceState.AI_SPEAKING ? 1.2 : 1.0;
    
    this.particles.forEach(particle => {
      particle.speed = (0.5 + Math.random() * 0.5) * speedMultiplier;
    });
  }

  protected onReset(): void {
    this.particles = [];
    this.globalPhase = 0;
    this.colorPhase = 0;
    this.pulsePhase = 0;
    this.createParticles();
  }

  protected onDispose(): void {
    this.particles = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      particleCount: this.particles.length,
      averageRadius: this.particles.reduce((sum, p) => sum + p.radius, 0) / this.particles.length
    };
  }
}