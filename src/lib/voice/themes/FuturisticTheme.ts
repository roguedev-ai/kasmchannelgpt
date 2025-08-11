/**
 * Futuristic Theme (Simplified)
 * 
 * A subtle cyberpunk-inspired theme with neon effects.
 * Optimized for performance with circular animations.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { Color } from '../utils/effects';
import { lerp, smoothstep } from '../utils/math';

export class FuturisticTheme extends BaseTheme {
  readonly id = 'futuristic';
  readonly name = 'Futuristic';
  readonly description = 'Subtle cyberpunk visualization with neon rings';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'light' as const;

  // Neon ring particles
  private particles: Array<{
    angle: number;
    radius: number;
    targetRadius: number;
    alpha: number;
    speed: number;
    ringIndex: number;
    glowPhase: number;
  }> = [];
  
  // Grid dots for background
  private gridDots: Array<{
    x: number;
    y: number;
    alpha: number;
    pulsePhase: number;
  }> = [];
  
  // Animation state
  private globalPhase = 0;
  private dataFlowPhase = 0;
  private pulsePhase = 0;
  
  // Cyberpunk color scheme
  private neonCyan = new Color(0, 255, 255, 0.8);
  private neonPink = new Color(255, 0, 255, 0.8);
  private neonYellow = new Color(255, 255, 0, 0.8);
  private gridBlue = new Color(0, 100, 200, 0.3);

  protected onInit(): void {
    this.createNeonRings();
    this.createGridBackground();
  }

  private createNeonRings(): void {
    // Create 3 concentric neon rings
    const rings = [
      { radius: 60, particles: 20 },
      { radius: 85, particles: 30 },
      { radius: 110, particles: 40 }
    ];
    
    rings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.particles; i++) {
        const angle = (i / ring.particles) * Math.PI * 2;
        
        this.particles.push({
          angle,
          radius: ring.radius,
          targetRadius: ring.radius,
          alpha: 0.7 - ringIndex * 0.15,
          speed: (0.3 + ringIndex * 0.2) * (ringIndex % 2 === 0 ? 1 : -1),
          ringIndex,
          glowPhase: Math.random() * Math.PI * 2
        });
      }
    });
  }

  private createGridBackground(): void {
    const gridSize = 80;
    const cols = Math.ceil(this.canvasWidth / gridSize);
    const rows = Math.ceil(this.canvasHeight / gridSize);
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (Math.random() > 0.7) { // Only 30% of grid points
          this.gridDots.push({
            x: x * gridSize + gridSize / 2,
            y: y * gridSize + gridSize / 2,
            alpha: 0.1 + Math.random() * 0.2,
            pulsePhase: Math.random() * Math.PI * 2
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
    const dt = deltaTime * 0.001;
    
    // Update animations
    this.globalPhase += dt * 0.5;
    this.dataFlowPhase += dt * 2;
    this.pulsePhase += dt * 1.5;
    
    // Clear with dark background
    context.fillStyle = 'rgba(0, 0, 5, 0.15)';
    context.fillRect(0, 0, width, height);
    
    // Draw grid background
    if (this.shouldEnableEffects()) {
      this.drawGrid(context);
    }
    
    // Draw neon rings
    this.drawNeonRings(context, centerX, centerY, dt);
    
    // Draw center core
    this.drawCenterCore(context, centerX, centerY);
  }

  private drawGrid(context: CanvasRenderingContext2D): void {
    context.save();
    
    for (const dot of this.gridDots) {
      const pulse = Math.sin(this.pulsePhase + dot.pulsePhase) * 0.5 + 0.5;
      const alpha = dot.alpha * pulse * 0.5;
      
      context.fillStyle = `rgba(${this.gridBlue.r}, ${this.gridBlue.g}, ${this.gridBlue.b}, ${alpha})`;
      context.beginPath();
      context.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
      context.fill();
    }
    
    context.restore();
  }

  private drawNeonRings(context: CanvasRenderingContext2D, centerX: number, centerY: number, dt: number): void {
    context.save();
    
    // Draw particles grouped by ring
    for (let ring = 0; ring < 3; ring++) {
      const ringParticles = this.particles.filter(p => p.ringIndex === ring);
      const ringColor = ring === 0 ? this.neonCyan : ring === 1 ? this.neonPink : this.neonYellow;
      
      for (const particle of ringParticles) {
        // Update rotation
        particle.angle += particle.speed * dt * this.getStateSpeedMultiplier();
        
        // Update radius with data flow effect
        const dataFlow = Math.sin(particle.angle * 4 + this.dataFlowPhase) * 5;
        const stateMultiplier = this.getStateRadiusMultiplier();
        particle.targetRadius = (60 + ring * 25 + dataFlow) * stateMultiplier;
        particle.radius = lerp(particle.radius, particle.targetRadius, 0.1);
        
        // Calculate position
        const x = centerX + Math.cos(particle.angle) * particle.radius;
        const y = centerY + Math.sin(particle.angle) * particle.radius;
        
        // Glow intensity
        const glow = Math.sin(this.globalPhase * 2 + particle.glowPhase) * 0.3 + 0.7;
        const alpha = particle.alpha * glow * this.getStateIntensity();
        
        // Draw neon particle with glow
        const size = 3;
        
        // Glow effect
        if (this.shouldEnableGlow()) {
          const glowGradient = context.createRadialGradient(x, y, 0, x, y, size * 4);
          glowGradient.addColorStop(0, `rgba(${ringColor.r}, ${ringColor.g}, ${ringColor.b}, ${alpha * 0.8})`);
          glowGradient.addColorStop(0.5, `rgba(${ringColor.r}, ${ringColor.g}, ${ringColor.b}, ${alpha * 0.4})`);
          glowGradient.addColorStop(1, 'transparent');
          
          context.fillStyle = glowGradient;
          context.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
        }
        
        // Core dot
        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }
    }
    
    context.restore();
  }

  private drawCenterCore(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const intensity = this.getStateIntensity();
    const coreSize = 20 + Math.sin(this.pulsePhase) * 4;
    
    // Multi-layer glow effect
    const colors = [this.neonCyan, this.neonPink, this.neonYellow];
    const currentColor = colors[Math.floor(this.globalPhase * 0.3) % colors.length];
    
    // Outer glow layers
    for (let i = 3; i > 0; i--) {
      const layerSize = coreSize * (1 + i * 0.5);
      const layerAlpha = 0.1 * intensity / i;
      
      const glowGradient = context.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, layerSize
      );
      
      glowGradient.addColorStop(0, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${layerAlpha})`);
      glowGradient.addColorStop(1, 'transparent');
      
      context.fillStyle = glowGradient;
      context.fillRect(
        centerX - layerSize,
        centerY - layerSize,
        layerSize * 2,
        layerSize * 2
      );
    }
    
    // Inner core
    const coreGradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, coreSize
    );
    
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
    coreGradient.addColorStop(0.5, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${0.7 * intensity})`);
    coreGradient.addColorStop(1, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${0.4 * intensity})`);
    
    context.fillStyle = coreGradient;
    context.beginPath();
    context.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
    context.fill();
  }

  private getStateRadiusMultiplier(): number {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return 1.2;
      case VoiceState.PROCESSING:
        return 0.85 + Math.sin(this.globalPhase * 4) * 0.15;
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
        return 0.7 + Math.sin(this.globalPhase * 5) * 0.3;
      case VoiceState.AI_SPEAKING:
        return 0.9;
      default:
        return 0.6;
    }
  }

  protected onStateChange(newState: VoiceState): void {
    // Speed boost on state change
    const speedBoost = newState === VoiceState.PROCESSING ? 2.0 : 1.0;
    this.particles.forEach(particle => {
      particle.speed *= speedBoost;
    });
  }

  protected onReset(): void {
    this.particles = [];
    this.gridDots = [];
    this.globalPhase = 0;
    this.dataFlowPhase = 0;
    this.pulsePhase = 0;
    this.createNeonRings();
    this.createGridBackground();
  }

  protected onDispose(): void {
    this.particles = [];
    this.gridDots = [];
  }

  protected getThemeSpecificMetrics(): Record<string, any> {
    return {
      particleCount: this.particles.length,
      gridDotCount: this.gridDots.length
    };
  }
}