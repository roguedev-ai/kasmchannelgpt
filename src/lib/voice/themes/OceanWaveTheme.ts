/**
 * Ocean Wave Theme (Simplified)
 * 
 * A subtle ocean-inspired theme with circular bubble particles.
 * Optimized for performance with smooth wave-like animations.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { lerp, smoothstep } from '../utils/math';
import { Color } from '../utils/effects';

export class OceanWaveTheme extends BaseTheme {
  readonly id = 'ocean';
  readonly name = 'Ocean Waves';
  readonly description = 'Subtle underwater visualization with bubble particles';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'light' as const;

  // Bubble particles in circular arrangement
  private particles: Array<{
    angle: number;
    radius: number;
    targetRadius: number;
    color: Color;
    alpha: number;
    speed: number;
    size: number;
    wobblePhase: number;
    floatSpeed: number;
  }> = [];
  
  // Animation state
  private globalPhase = 0;
  private wavePhase = 0;
  private bubblePhase = 0;
  
  // Ocean color palette
  private oceanColors = [
    new Color(0, 119, 190, 0.7),    // Deep blue
    new Color(0, 150, 199, 0.6),    // Ocean blue
    new Color(72, 202, 228, 0.5),   // Light blue
    new Color(144, 224, 239, 0.4),  // Pale blue
  ];

  protected onInit(): void {
    this.createBubbleCircle();
  }

  private createBubbleCircle(): void {
    // Create circular arrangement of bubble particles
    const particleCount = 48;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const baseRadius = 70 + Math.random() * 40;
      const colorIndex = Math.floor(Math.random() * this.oceanColors.length);
      const bubbleSize = 3 + Math.random() * 5;
      
      this.particles.push({
        angle,
        radius: baseRadius,
        targetRadius: baseRadius,
        color: this.oceanColors[colorIndex].clone(),
        alpha: 0.3 + Math.random() * 0.4,
        speed: 0.2 + Math.random() * 0.3,
        size: bubbleSize,
        wobblePhase: Math.random() * Math.PI * 2,
        floatSpeed: 0.5 + Math.random() * 0.5
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
    this.wavePhase += dt * 0.8;
    this.bubblePhase += dt * 1.2;
    
    // Clear with ocean gradient
    this.drawOceanBackground(context, width, height);
    
    // Draw circular bubble arrangement
    this.drawBubbleCircle(context, centerX, centerY, dt);
    
    // Draw center bubble cluster
    this.drawCenterBubbles(context, centerX, centerY);
  }

  private drawOceanBackground(context: CanvasRenderingContext2D, width: number, height: number): void {
    // Create ocean gradient
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 119, 190, 0.15)');
    gradient.addColorStop(0.5, 'rgba(0, 77, 124, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 52, 89, 0.25)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  private drawBubbleCircle(context: CanvasRenderingContext2D, centerX: number, centerY: number, dt: number): void {
    context.save();
    
    for (const particle of this.particles) {
      // Update rotation and floating motion
      particle.angle += particle.speed * dt * this.getStateSpeedMultiplier();
      particle.wobblePhase += particle.floatSpeed * dt;
      
      // Wave-like radius changes
      const waveOffset = Math.sin(particle.angle * 2 + this.wavePhase) * 15;
      const wobbleOffset = Math.sin(particle.wobblePhase) * 5;
      const stateMultiplier = this.getStateRadiusMultiplier();
      
      particle.targetRadius = (70 + waveOffset + wobbleOffset) * stateMultiplier;
      particle.radius = lerp(particle.radius, particle.targetRadius, 0.05);
      
      // Calculate position
      const x = centerX + Math.cos(particle.angle) * particle.radius;
      const y = centerY + Math.sin(particle.angle) * particle.radius;
      
      // Draw bubble with transparency
      const intensity = this.getStateIntensity();
      const alpha = particle.alpha * intensity;
      
      // Bubble gradient
      const bubbleGradient = context.createRadialGradient(
        x - particle.size * 0.3, y - particle.size * 0.3, 0,
        x, y, particle.size
      );
      
      bubbleGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
      bubbleGradient.addColorStop(0.5, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.5})`);
      bubbleGradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.2})`);
      
      context.fillStyle = bubbleGradient;
      context.beginPath();
      context.arc(x, y, particle.size, 0, Math.PI * 2);
      context.fill();
      
      // Bubble highlight
      context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
      context.beginPath();
      context.arc(x - particle.size * 0.3, y - particle.size * 0.3, particle.size * 0.3, 0, Math.PI * 2);
      context.fill();
    }
    
    context.restore();
  }

  private drawCenterBubbles(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const intensity = this.getStateIntensity();
    
    // Draw a cluster of center bubbles
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.bubblePhase;
      const radius = 20 + Math.sin(this.bubblePhase + i) * 10;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const size = 8 + Math.sin(this.globalPhase + i * 0.5) * 3;
      
      // Main bubble
      const gradient = context.createRadialGradient(
        x - size * 0.3, y - size * 0.3, 0,
        x, y, size
      );
      
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.6 * intensity})`);
      gradient.addColorStop(0.5, `rgba(150, 223, 255, ${0.4 * intensity})`);
      gradient.addColorStop(1, `rgba(0, 119, 190, ${0.2 * intensity})`);
      
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
  }

  private getStateRadiusMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.3;
      case VoiceState.PROCESSING:
        return 0.9 + Math.sin(this.globalPhase * 4) * 0.1;
      case VoiceState.AI_SPEAKING:
        return 1.15;
      default:
        return 1.0;
    }
  }

  private getStateSpeedMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.8;
      case VoiceState.PROCESSING:
        return 2.5;
      case VoiceState.AI_SPEAKING:
        return 1.3;
      default:
        return 1.0;
    }
  }

  private getStateIntensity(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.0;
      case VoiceState.PROCESSING:
        return 0.6 + Math.sin(this.globalPhase * 5) * 0.4;
      case VoiceState.AI_SPEAKING:
        return 0.85;
      default:
        return 0.7;
    }
  }

  protected onStateChange(newState: VoiceState): void {
    // Update particle speeds based on state
    const speedMultiplier = this.getStateSpeedMultiplier();
    this.particles.forEach(particle => {
      particle.speed = (0.2 + Math.random() * 0.3) * speedMultiplier;
      particle.floatSpeed = (0.5 + Math.random() * 0.5) * speedMultiplier;
    });
  }

  protected onReset(): void {
    this.particles = [];
    this.globalPhase = 0;
    this.wavePhase = 0;
    this.bubblePhase = 0;
    this.createBubbleCircle();
  }

  protected onDispose(): void {
    this.particles = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      particleCount: this.particles.length,
      wavePhase: this.wavePhase
    };
  }
}