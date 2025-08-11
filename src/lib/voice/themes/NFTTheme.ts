/**
 * NFT Theme (Simplified)
 * 
 * A subtle digital art-inspired theme with vibrant gradients.
 * Optimized for performance with circular animations.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { lerp, smoothstep } from '../utils/math';

export class NFTTheme extends BaseTheme {
  readonly id = 'nft';
  readonly name = 'NFT Art';
  readonly description = 'Subtle digital art visualization with gradients';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'light' as const;

  // Gradient particles
  private particles: Array<{
    angle: number;
    radius: number;
    targetRadius: number;
    color: Color;
    targetColor: Color;
    alpha: number;
    speed: number;
    size: number;
    pulsePhase: number;
  }> = [];
  
  // Animation state
  private globalPhase = 0;
  private colorShift = 0;
  private morphPhase = 0;
  
  // NFT color palette - vibrant gradients
  private nftColors = [
    new Color(255, 0, 255, 0.7),    // Magenta
    new Color(0, 255, 255, 0.7),    // Cyan
    new Color(255, 255, 0, 0.7),    // Yellow
    new Color(255, 0, 128, 0.7),    // Pink
    new Color(0, 255, 128, 0.7),    // Spring green
    new Color(128, 0, 255, 0.7),    // Purple
  ];

  protected onInit(): void {
    this.createGradientParticles();
  }

  private createGradientParticles(): void {
    const particleCount = 36; // Reduced for performance
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const baseRadius = 70 + Math.random() * 40;
      const colorIndex = Math.floor(Math.random() * this.nftColors.length);
      
      this.particles.push({
        angle,
        radius: baseRadius,
        targetRadius: baseRadius,
        color: this.nftColors[colorIndex].clone(),
        targetColor: this.nftColors[(colorIndex + 1) % this.nftColors.length].clone(),
        alpha: 0.5 + Math.random() * 0.3,
        speed: 0.2 + Math.random() * 0.3,
        size: 6 + Math.random() * 4,
        pulsePhase: Math.random() * Math.PI * 2
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
    this.globalPhase += dt * 0.4;
    this.colorShift += dt * 0.1;
    this.morphPhase += dt * 0.3;
    
    // Clear with dark background
    context.fillStyle = 'rgba(0, 0, 10, 0.1)';
    context.fillRect(0, 0, width, height);
    
    // Draw gradient circles
    this.drawGradientCircle(context, centerX, centerY, dt);
    
    // Draw center gradient orb
    this.drawCenterOrb(context, centerX, centerY);
  }

  private drawGradientCircle(context: CanvasRenderingContext2D, centerX: number, centerY: number, dt: number): void {
    context.save();
    
    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Update rotation
      particle.angle += particle.speed * dt * this.getStateSpeedMultiplier();
      
      // Update radius with morphing effect
      const morph = Math.sin(particle.angle * 3 + this.morphPhase) * 15;
      const stateMultiplier = this.getStateRadiusMultiplier();
      particle.targetRadius = (70 + morph) * stateMultiplier;
      particle.radius = lerp(particle.radius, particle.targetRadius, 0.08);
      
      // Update color cycling
      if (Math.sin(this.colorShift + i * 0.2) > 0.9) {
        const currentIndex = this.nftColors.indexOf(particle.targetColor);
        particle.targetColor = this.nftColors[(currentIndex + 1) % this.nftColors.length].clone();
      }
      particle.color = particle.color.lerp(particle.targetColor, 0.02);
      
      // Calculate position
      const x = centerX + Math.cos(particle.angle) * particle.radius;
      const y = centerY + Math.sin(particle.angle) * particle.radius;
      
      // Pulse effect
      const pulse = Math.sin(this.globalPhase * 2 + particle.pulsePhase);
      const size = particle.size * (1 + pulse * 0.3);
      const alpha = particle.alpha * (0.8 + pulse * 0.2);
      
      // Draw gradient particle
      const gradient = context.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      
      context.fillStyle = gradient;
      context.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
      
      // Core dot
      context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      context.beginPath();
      context.arc(x, y, size * 0.3, 0, Math.PI * 2);
      context.fill();
    }
    
    context.restore();
  }

  private drawCenterOrb(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const intensity = this.getStateIntensity();
    const orbSize = 30 + Math.sin(this.globalPhase) * 5;
    
    // Create animated gradient
    const colorIndex = Math.floor(this.colorShift) % this.nftColors.length;
    const color1 = this.nftColors[colorIndex];
    const color2 = this.nftColors[(colorIndex + 1) % this.nftColors.length];
    const blend = (this.colorShift % 1);
    const currentColor = color1.lerp(color2, blend);
    
    // Outer glow
    const glowGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbSize * 2.5
    );
    
    glowGradient.addColorStop(0, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${0.4 * intensity})`);
    glowGradient.addColorStop(0.5, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${0.2 * intensity})`);
    glowGradient.addColorStop(1, 'transparent');
    
    context.fillStyle = glowGradient;
    context.fillRect(
      centerX - orbSize * 2.5,
      centerY - orbSize * 2.5,
      orbSize * 5,
      orbSize * 5
    );
    
    // Inner orb with gradient
    const orbGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, orbSize
    );
    
    orbGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
    orbGradient.addColorStop(0.3, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${0.8 * intensity})`);
    orbGradient.addColorStop(0.7, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${0.6 * intensity})`);
    orbGradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${0.3 * intensity})`);
    
    context.fillStyle = orbGradient;
    context.beginPath();
    context.arc(centerX, centerY, orbSize, 0, Math.PI * 2);
    context.fill();
  }

  private getStateRadiusMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.3;
      case VoiceState.PROCESSING:
        return 0.9 + Math.sin(this.globalPhase * 3) * 0.1;
      case VoiceState.AI_SPEAKING:
        return 1.15;
      default:
        return 1.0;
    }
  }

  private getStateSpeedMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.5;
      case VoiceState.PROCESSING:
        return 2.0;
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
    // Trigger color shift on state change
    if (newState === VoiceState.USER_SPEAKING || newState === VoiceState.AI_SPEAKING) {
      this.particles.forEach((particle, i) => {
        const newColorIndex = (Math.floor(this.colorShift + i) + 2) % this.nftColors.length;
        particle.targetColor = this.nftColors[newColorIndex].clone();
      });
    }
  }

  protected onReset(): void {
    this.particles = [];
    this.globalPhase = 0;
    this.colorShift = 0;
    this.morphPhase = 0;
    this.createGradientParticles();
  }

  protected onDispose(): void {
    this.particles = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      particleCount: this.particles.length,
      colorShift: this.colorShift
    };
  }
}