/**
 * Starfield Theme - Cosmic Space Experience
 * 
 * A stunning cosmic theme featuring twinkling stars, dynamic constellations,
 * and flowing nebula backgrounds. Creates an immersive space environment
 * that responds to voice interactions with celestial movements.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { lerp, random, sineWave, distance2D, normalizeAngle } from '../utils/math';
import { Color, GradientBuilder, Particle, Easing } from '../utils/effects';
import { ObjectPool } from '../utils/performance';

interface Star {
  x: number;
  y: number;
  z: number; // Depth for parallax
  brightness: number;
  maxBrightness: number;
  twinklePhase: number;
  twinkleSpeed: number;
  size: number;
  color: Color;
  trail: Array<{ x: number; y: number; alpha: number }>;
  shootingStar: boolean;
  velocity: { x: number; y: number };
  age: number;
  maxAge: number;
}

interface ConstellationNode {
  x: number;
  y: number;
  connected: number[]; // Indices of connected nodes
  alpha: number;
  targetAlpha: number;
  pulsePhase: number;
}

interface NebulaParticle {
  x: number;
  y: number;
  size: number;
  color: Color;
  alpha: number;
  driftSpeed: { x: number; y: number };
  layer: number; // 0-2 for layered depth effect
}

export class StarfieldTheme extends BaseTheme {
  readonly id = 'starfield';
  readonly name = 'Cosmic Starfield';
  readonly description = 'Twinkling stars, dynamic constellations, and flowing nebula clouds';
  readonly category = 'particle' as const;
  readonly performanceProfile = 'medium' as const;

  // Star system
  private stars: Star[] = [];
  private starPool: ObjectPool<Star>;
  private numStars = 150;
  private shootingStars: Star[] = [];
  private nextShootingStarTime = 0;
  
  // Constellation system
  private constellations: ConstellationNode[][] = [];
  private constellationAlpha = 0;
  private targetConstellationAlpha = 0;
  private constellationFormationProgress = 0;
  
  // Nebula system
  private nebulaParticles: NebulaParticle[] = [];
  private nebulaFlow = { x: 0, y: 0 };
  private nebulaIntensity = 0.3;
  private nebulaColors: Color[] = [];
  
  // Animation parameters
  private cosmicTime = 0;
  private parallaxOffset = { x: 0, y: 0 };
  private starSpeedMultiplier = 1;
  private constellationPulseSpeed = 1;
  
  // Color palettes for different states
  private colorPalettes = {
    idle: {
      stars: [
        new Color(255, 255, 255, 0.8),
        new Color(173, 216, 230, 0.9), // Light blue
        new Color(255, 215, 0, 0.7),   // Gold
        new Color(255, 192, 203, 0.6)  // Pink
      ],
      nebula: [
        new Color(75, 0, 130, 0.3),    // Deep purple
        new Color(138, 43, 226, 0.2),  // Blue violet
        new Color(0, 0, 139, 0.1)      // Dark blue
      ],
      constellation: new Color(255, 255, 255, 0.6)
    },
    userSpeaking: {
      stars: [
        new Color(255, 69, 0, 0.9),    // Red orange
        new Color(255, 140, 0, 0.8),   // Dark orange
        new Color(255, 215, 0, 0.7),   // Gold
        new Color(255, 255, 255, 0.9)
      ],
      nebula: [
        new Color(255, 0, 0, 0.4),     // Red
        new Color(255, 69, 0, 0.3),    // Red orange
        new Color(255, 140, 0, 0.2)    // Dark orange
      ],
      constellation: new Color(255, 215, 0, 0.8)
    },
    processing: {
      stars: [
        new Color(138, 43, 226, 0.9),  // Blue violet
        new Color(75, 0, 130, 0.8),    // Indigo
        new Color(255, 0, 255, 0.7),   // Magenta
        new Color(255, 255, 255, 0.9)
      ],
      nebula: [
        new Color(138, 43, 226, 0.4),  // Blue violet
        new Color(75, 0, 130, 0.3),    // Indigo
        new Color(25, 25, 112, 0.2)    // Midnight blue
      ],
      constellation: new Color(138, 43, 226, 0.9)
    },
    aiSpeaking: {
      stars: [
        new Color(0, 255, 127, 0.9),   // Spring green
        new Color(0, 255, 255, 0.8),   // Cyan
        new Color(173, 216, 230, 0.7), // Light blue
        new Color(255, 255, 255, 0.9)
      ],
      nebula: [
        new Color(0, 255, 127, 0.4),   // Spring green
        new Color(0, 191, 255, 0.3),   // Deep sky blue
        new Color(72, 209, 204, 0.2)   // Medium turquoise
      ],
      constellation: new Color(0, 255, 255, 0.8)
    }
  };

  constructor() {
    super();
    
    this.starPool = new ObjectPool<Star>(
      () => ({
        x: 0, y: 0, z: 0, brightness: 0, maxBrightness: 1,
        twinklePhase: 0, twinkleSpeed: 1, size: 1,
        color: new Color(255, 255, 255),
        trail: [], shootingStar: false,
        velocity: { x: 0, y: 0 }, age: 0, maxAge: 1000
      }),
      (star) => {
        star.trail = [];
        star.shootingStar = false;
        star.age = 0;
      },
      50,
      300
    );
    
    this.initializeNebulaColors();
  }

  protected onInit(): void {
    this.numStars = Math.min(this.getMaxParticles(), 200);
    this.initializeStarfield();
    this.initializeConstellations();
    this.initializeNebula();
    console.log(`StarfieldTheme initialized with ${this.numStars} stars`);
  }

  protected onDraw(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    deltaTime: number
  ): void {
    this.cosmicTime += deltaTime * 0.001;
    
    // Update systems
    this.updateParallax();
    this.updateNebula(deltaTime);
    this.updateStars(deltaTime);
    this.updateConstellations(deltaTime);
    this.updateShootingStars(deltaTime);
    
    // Render systems (back to front)
    this.renderNebula(context, width, height);
    this.renderStars(context, width, height);
    this.renderConstellations(context, width, height);
    this.renderShootingStars(context, width, height);
  }

  protected onStateChange(newState: VoiceState): void {
    switch (newState) {
      case VoiceState.USER_SPEAKING:
        console.log("🎤 [StarfieldTheme] User speaking - igniting stars");
        this.starSpeedMultiplier = 2;
        this.constellationPulseSpeed = 1.5;
        this.targetConstellationAlpha = 0.8;
        this.nebulaIntensity = 0.6;
        this.scheduleShootingStars(3);
        break;
        
      case VoiceState.PROCESSING:
        console.log("⚙️ [StarfieldTheme] Processing - cosmic energy surge");
        this.starSpeedMultiplier = 3;
        this.constellationPulseSpeed = 2;
        this.targetConstellationAlpha = 1;
        this.nebulaIntensity = 0.8;
        this.triggerConstellationFormation();
        break;
        
      case VoiceState.AI_SPEAKING:
        console.log("🤖 [StarfieldTheme] AI speaking - harmonic resonance");
        this.starSpeedMultiplier = 1.5;
        this.constellationPulseSpeed = 1.2;
        this.targetConstellationAlpha = 0.9;
        this.nebulaIntensity = 0.5;
        this.scheduleShootingStars(2);
        break;
        
      case VoiceState.IDLE:
      default:
        console.log("🔄 [StarfieldTheme] Idle - peaceful cosmos");
        this.starSpeedMultiplier = 1;
        this.constellationPulseSpeed = 1;
        this.targetConstellationAlpha = 0.3;
        this.nebulaIntensity = 0.3;
        break;
    }
  }

  protected getThemeSpecificMetrics() {
    return {
      stars: this.stars.length,
      shootingStars: this.shootingStars.length,
      constellations: this.constellations.length,
      nebulaParticles: this.nebulaParticles.length,
      cosmicTime: Math.round(this.cosmicTime)
    };
  }

  // Star system methods

  private initializeStarfield(): void {
    this.stars = [];
    
    for (let i = 0; i < this.numStars; i++) {
      const star = this.starPool.acquire();
      
      star.x = random(-this.canvasWidth * 0.1, this.canvasWidth * 1.1);
      star.y = random(-this.canvasHeight * 0.1, this.canvasHeight * 1.1);
      star.z = random(0.1, 1); // Parallax depth
      star.size = random(0.5, 2.5) * star.z; // Closer stars are bigger
      star.maxBrightness = random(0.3, 1) * star.z;
      star.brightness = star.maxBrightness;
      star.twinklePhase = random(0, Math.PI * 2);
      star.twinkleSpeed = random(0.8, 2);
      
      // Assign color based on star temperature (realistic astronomy)
      const temp = Math.random();
      if (temp < 0.3) {
        star.color = new Color(255, 204, 111); // Warm (K-type)
      } else if (temp < 0.6) {
        star.color = new Color(255, 255, 255); // Sun-like (G-type)
      } else if (temp < 0.8) {
        star.color = new Color(202, 215, 255); // Hot (A-type)
      } else {
        star.color = new Color(155, 176, 255); // Very hot (B-type)
      }
      
      this.stars.push(star);
    }
  }

  private updateStars(deltaTime: number): void {
    const currentPalette = this.getCurrentColorPalette();
    
    this.stars.forEach((star, index) => {
      // Update twinkling
      star.twinklePhase += star.twinkleSpeed * deltaTime * 0.001 * this.starSpeedMultiplier;
      star.brightness = star.maxBrightness * (0.7 + 0.3 * Math.sin(star.twinklePhase));
      
      // Mouse interaction - stars brighten near cursor
      const distanceToMouse = distance2D(
        star.x + this.parallaxOffset.x * star.z,
        star.y + this.parallaxOffset.y * star.z,
        this.mouseX,
        this.mouseY
      );
      
      if (distanceToMouse < 100) {
        const influence = 1 - (distanceToMouse / 100);
        star.brightness *= (1 + influence * this.mouseInfluence);
        star.size *= (1 + influence * this.mouseInfluence * 0.5);
      }
      
      // Color transition based on voice state
      if (Math.random() < 0.02) { // Occasionally update color
        const targetColor = currentPalette.stars[index % currentPalette.stars.length];
        star.color = star.color.lerp(targetColor, 0.1);
      }
    });
  }

  private renderStars(context: CanvasRenderingContext2D, width: number, height: number): void {
    this.stars.forEach(star => {
      const x = star.x + this.parallaxOffset.x * star.z;
      const y = star.y + this.parallaxOffset.y * star.z;
      
      // Skip stars outside visible area (with buffer)
      if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
      
      const finalSize = star.size * (0.8 + 0.4 * star.brightness);
      const alpha = star.brightness * star.color.a;
      
      // Draw star core
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = star.color.toString();
      context.beginPath();
      context.arc(x, y, finalSize, 0, Math.PI * 2);
      context.fill();
      
      // Draw star glow if enabled and star is bright enough
      if (this.shouldEnableGlow() && star.brightness > 0.7) {
        const glowSize = finalSize * 2.5;
        const glowAlpha = alpha * 0.3;
        
        const gradient = context.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${glowAlpha})`);
        gradient.addColorStop(0.5, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${glowAlpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0)`);
        
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, glowSize, 0, Math.PI * 2);
        context.fill();
      }
      
      // Draw cross pattern for brightest stars
      if (star.brightness > 0.9 && finalSize > 1.5) {
        context.strokeStyle = star.color.toString();
        context.lineWidth = 0.5;
        context.globalAlpha = alpha * 0.6;
        
        const crossSize = finalSize * 3;
        context.beginPath();
        context.moveTo(x - crossSize, y);
        context.lineTo(x + crossSize, y);
        context.moveTo(x, y - crossSize);
        context.lineTo(x, y + crossSize);
        context.stroke();
      }
      
      context.restore();
    });
  }

  // Shooting star system

  private scheduleShootingStars(count: number): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.createShootingStar(), i * 500 + random(0, 1000));
    }
  }

  private createShootingStar(): void {
    const shootingStar = this.starPool.acquire();
    
    // Start from edge of screen
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: // Top
        shootingStar.x = random(0, this.canvasWidth);
        shootingStar.y = -50;
        shootingStar.velocity = { x: random(-2, 2), y: random(3, 8) };
        break;
      case 1: // Right
        shootingStar.x = this.canvasWidth + 50;
        shootingStar.y = random(0, this.canvasHeight);
        shootingStar.velocity = { x: random(-8, -3), y: random(-2, 2) };
        break;
      case 2: // Bottom
        shootingStar.x = random(0, this.canvasWidth);
        shootingStar.y = this.canvasHeight + 50;
        shootingStar.velocity = { x: random(-2, 2), y: random(-8, -3) };
        break;
      case 3: // Left
        shootingStar.x = -50;
        shootingStar.y = random(0, this.canvasHeight);
        shootingStar.velocity = { x: random(3, 8), y: random(-2, 2) };
        break;
    }
    
    shootingStar.z = 0.8;
    shootingStar.size = random(1, 2);
    shootingStar.maxBrightness = 1;
    shootingStar.brightness = 1;
    shootingStar.color = new Color(255, 255, 255, 0.9);
    shootingStar.shootingStar = true;
    shootingStar.age = 0;
    shootingStar.maxAge = random(60, 120); // Frames
    shootingStar.trail = [];
    
    this.shootingStars.push(shootingStar);
  }

  private updateShootingStars(deltaTime: number): void {
    this.shootingStars = this.shootingStars.filter(star => {
      star.age += deltaTime;
      star.x += star.velocity.x * deltaTime * 0.1;
      star.y += star.velocity.y * deltaTime * 0.1;
      
      // Add to trail
      star.trail.push({
        x: star.x,
        y: star.y,
        alpha: star.brightness
      });
      
      // Limit trail length
      if (star.trail.length > 20) {
        star.trail.shift();
      }
      
      // Fade out over time
      star.brightness = lerp(1, 0, star.age / star.maxAge);
      
      // Remove if expired or out of bounds
      const outOfBounds = (
        star.x < -100 || star.x > this.canvasWidth + 100 ||
        star.y < -100 || star.y > this.canvasHeight + 100
      );
      
      if (star.age >= star.maxAge || outOfBounds) {
        this.starPool.release(star);
        return false;
      }
      
      return true;
    });
  }

  private renderShootingStars(context: CanvasRenderingContext2D, width: number, height: number): void {
    this.shootingStars.forEach(star => {
      // Draw trail
      if (star.trail.length > 1) {
        context.save();
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        for (let i = 1; i < star.trail.length; i++) {
          const current = star.trail[i];
          const previous = star.trail[i - 1];
          const progress = i / star.trail.length;
          const alpha = star.brightness * progress * 0.7;
          const width = star.size * progress * 2;
          
          context.globalAlpha = alpha;
          context.strokeStyle = star.color.toString();
          context.lineWidth = width;
          
          context.beginPath();
          context.moveTo(previous.x, previous.y);
          context.lineTo(current.x, current.y);
          context.stroke();
        }
        context.restore();
      }
      
      // Draw star head
      context.save();
      context.globalAlpha = star.brightness;
      context.fillStyle = star.color.toString();
      context.beginPath();
      context.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }

  // Constellation system

  private initializeConstellations(): void {
    this.constellations = [];
    
    // Create several constellation patterns
    const patterns = [
      this.createBigDipperConstellation(),
      this.createOrionConstellation(),
      this.createCassiopeiaConstellation(),
      this.createLeoConstellation()
    ];
    
    patterns.forEach(pattern => {
      if (pattern.length > 0) {
        this.constellations.push(pattern);
      }
    });
  }

  private createBigDipperConstellation(): ConstellationNode[] {
    const centerX = this.canvasWidth * 0.3;
    const centerY = this.canvasHeight * 0.4;
    const scale = Math.min(this.canvasWidth, this.canvasHeight) * 0.0008;
    
    return [
      { x: centerX, y: centerY, connected: [1], alpha: 0, targetAlpha: 0, pulsePhase: 0 },
      { x: centerX + 50 * scale, y: centerY - 20 * scale, connected: [0, 2], alpha: 0, targetAlpha: 0, pulsePhase: 0.5 },
      { x: centerX + 80 * scale, y: centerY - 10 * scale, connected: [1, 3], alpha: 0, targetAlpha: 0, pulsePhase: 1 },
      { x: centerX + 120 * scale, y: centerY + 10 * scale, connected: [2, 4], alpha: 0, targetAlpha: 0, pulsePhase: 1.5 },
      { x: centerX + 150 * scale, y: centerY + 30 * scale, connected: [3, 5], alpha: 0, targetAlpha: 0, pulsePhase: 2 },
      { x: centerX + 130 * scale, y: centerY + 60 * scale, connected: [4, 6], alpha: 0, targetAlpha: 0, pulsePhase: 2.5 },
      { x: centerX + 100 * scale, y: centerY + 80 * scale, connected: [5], alpha: 0, targetAlpha: 0, pulsePhase: 3 }
    ];
  }

  private createOrionConstellation(): ConstellationNode[] {
    const centerX = this.canvasWidth * 0.7;
    const centerY = this.canvasHeight * 0.6;
    const scale = Math.min(this.canvasWidth, this.canvasHeight) * 0.0006;
    
    return [
      // Orion's belt
      { x: centerX - 40 * scale, y: centerY, connected: [1], alpha: 0, targetAlpha: 0, pulsePhase: 0 },
      { x: centerX, y: centerY - 5 * scale, connected: [0, 2], alpha: 0, targetAlpha: 0, pulsePhase: 0.3 },
      { x: centerX + 40 * scale, y: centerY - 10 * scale, connected: [1, 3], alpha: 0, targetAlpha: 0, pulsePhase: 0.6 },
      // Shoulders
      { x: centerX - 60 * scale, y: centerY - 80 * scale, connected: [2, 4], alpha: 0, targetAlpha: 0, pulsePhase: 1 },
      { x: centerX + 60 * scale, y: centerY - 70 * scale, connected: [3, 5], alpha: 0, targetAlpha: 0, pulsePhase: 1.3 },
      // Legs
      { x: centerX - 30 * scale, y: centerY + 80 * scale, connected: [4], alpha: 0, targetAlpha: 0, pulsePhase: 1.6 },
      { x: centerX + 50 * scale, y: centerY + 90 * scale, connected: [], alpha: 0, targetAlpha: 0, pulsePhase: 2 }
    ];
  }

  private createCassiopeiaConstellation(): ConstellationNode[] {
    const centerX = this.canvasWidth * 0.2;
    const centerY = this.canvasHeight * 0.2;
    const scale = Math.min(this.canvasWidth, this.canvasHeight) * 0.0007;
    
    return [
      { x: centerX, y: centerY, connected: [1], alpha: 0, targetAlpha: 0, pulsePhase: 0 },
      { x: centerX + 60 * scale, y: centerY - 30 * scale, connected: [0, 2], alpha: 0, targetAlpha: 0, pulsePhase: 0.4 },
      { x: centerX + 120 * scale, y: centerY + 10 * scale, connected: [1, 3], alpha: 0, targetAlpha: 0, pulsePhase: 0.8 },
      { x: centerX + 180 * scale, y: centerY - 20 * scale, connected: [2, 4], alpha: 0, targetAlpha: 0, pulsePhase: 1.2 },
      { x: centerX + 240 * scale, y: centerY + 20 * scale, connected: [3], alpha: 0, targetAlpha: 0, pulsePhase: 1.6 }
    ];
  }

  private createLeoConstellation(): ConstellationNode[] {
    const centerX = this.canvasWidth * 0.6;
    const centerY = this.canvasHeight * 0.3;
    const scale = Math.min(this.canvasWidth, this.canvasHeight) * 0.0005;
    
    return [
      // Leo's main body
      { x: centerX, y: centerY, connected: [1, 6], alpha: 0, targetAlpha: 0, pulsePhase: 0 },
      { x: centerX + 40 * scale, y: centerY - 30 * scale, connected: [0, 2], alpha: 0, targetAlpha: 0, pulsePhase: 0.3 },
      { x: centerX + 80 * scale, y: centerY - 40 * scale, connected: [1, 3], alpha: 0, targetAlpha: 0, pulsePhase: 0.6 },
      { x: centerX + 120 * scale, y: centerY - 20 * scale, connected: [2, 4], alpha: 0, targetAlpha: 0, pulsePhase: 0.9 },
      { x: centerX + 140 * scale, y: centerY + 20 * scale, connected: [3, 5], alpha: 0, targetAlpha: 0, pulsePhase: 1.2 },
      { x: centerX + 100 * scale, y: centerY + 60 * scale, connected: [4, 6], alpha: 0, targetAlpha: 0, pulsePhase: 1.5 },
      { x: centerX + 40 * scale, y: centerY + 40 * scale, connected: [5, 0], alpha: 0, targetAlpha: 0, pulsePhase: 1.8 }
    ];
  }

  private updateConstellations(deltaTime: number): void {
    // Smooth constellation alpha transition
    this.constellationAlpha = lerp(this.constellationAlpha, this.targetConstellationAlpha, 0.02);
    
    // Update each constellation
    this.constellations.forEach(constellation => {
      constellation.forEach(node => {
        node.targetAlpha = this.constellationAlpha;
        node.alpha = lerp(node.alpha, node.targetAlpha, 0.05);
        
        // Pulsing effect
        node.pulsePhase += deltaTime * 0.001 * this.constellationPulseSpeed;
        const pulse = 0.7 + 0.3 * Math.sin(node.pulsePhase);
        node.alpha *= pulse;
        
        // Mouse interaction - nodes brighten when mouse is near
        const distanceToMouse = distance2D(node.x, node.y, this.mouseX, this.mouseY);
        if (distanceToMouse < 80) {
          const influence = 1 - (distanceToMouse / 80);
          node.alpha *= (1 + influence * this.mouseInfluence * 0.5);
        }
      });
    });
  }

  private renderConstellations(context: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.constellationAlpha < 0.01) return;
    
    const currentPalette = this.getCurrentColorPalette();
    
    this.constellations.forEach(constellation => {
      // Draw connections first
      constellation.forEach(node => {
        node.connected.forEach(connectedIndex => {
          if (connectedIndex < constellation.length) {
            const connectedNode = constellation[connectedIndex];
            const avgAlpha = (node.alpha + connectedNode.alpha) * 0.5;
            
            if (avgAlpha > 0.01) {
              context.save();
              context.strokeStyle = `rgba(${currentPalette.constellation.r}, ${currentPalette.constellation.g}, ${currentPalette.constellation.b}, ${avgAlpha})`;
              context.lineWidth = 1;
              context.beginPath();
              context.moveTo(node.x, node.y);
              context.lineTo(connectedNode.x, connectedNode.y);
              context.stroke();
              context.restore();
            }
          }
        });
      });
      
      // Draw nodes
      constellation.forEach(node => {
        if (node.alpha > 0.01) {
          context.save();
          context.globalAlpha = node.alpha;
          context.fillStyle = currentPalette.constellation.toString();
          context.beginPath();
          context.arc(node.x, node.y, 2, 0, Math.PI * 2);
          context.fill();
          
          // Glow effect for bright nodes
          if (this.shouldEnableGlow() && node.alpha > 0.7) {
            const gradient = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, 8);
            gradient.addColorStop(0, `rgba(${currentPalette.constellation.r}, ${currentPalette.constellation.g}, ${currentPalette.constellation.b}, ${node.alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(${currentPalette.constellation.r}, ${currentPalette.constellation.g}, ${currentPalette.constellation.b}, 0)`);
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(node.x, node.y, 8, 0, Math.PI * 2);
            context.fill();
          }
          
          context.restore();
        }
      });
    });
  }

  private triggerConstellationFormation(): void {
    // Animate constellation formation with staggered timing
    this.constellations.forEach((constellation, constellationIndex) => {
      constellation.forEach((node, nodeIndex) => {
        setTimeout(() => {
          node.targetAlpha = this.targetConstellationAlpha;
        }, (constellationIndex * 500) + (nodeIndex * 100));
      });
    });
  }

  // Nebula system

  private initializeNebulaColors(): void {
    this.nebulaColors = [
      new Color(75, 0, 130, 0.15),   // Indigo
      new Color(138, 43, 226, 0.1),  // Blue violet
      new Color(72, 61, 139, 0.12),  // Dark slate blue
      new Color(123, 104, 238, 0.08), // Medium slate blue
      new Color(106, 90, 205, 0.1)   // Slate blue
    ];
  }

  private initializeNebula(): void {
    this.nebulaParticles = [];
    const numParticles = Math.min(50, this.getMaxParticles() / 4);
    
    for (let i = 0; i < numParticles; i++) {
      this.nebulaParticles.push({
        x: random(-this.canvasWidth * 0.2, this.canvasWidth * 1.2),
        y: random(-this.canvasHeight * 0.2, this.canvasHeight * 1.2),
        size: random(30, 120),
        color: this.nebulaColors[Math.floor(Math.random() * this.nebulaColors.length)],
        alpha: random(0.05, 0.2),
        driftSpeed: {
          x: random(-0.3, 0.3),
          y: random(-0.2, 0.2)
        },
        layer: Math.floor(random(0, 3))
      });
    }
  }

  private updateNebula(deltaTime: number): void {
    const currentPalette = this.getCurrentColorPalette();
    this.nebulaFlow.x += Math.sin(this.cosmicTime * 0.5) * 0.1;
    this.nebulaFlow.y += Math.cos(this.cosmicTime * 0.3) * 0.1;
    
    this.nebulaParticles.forEach(particle => {
      // Drift movement
      particle.x += particle.driftSpeed.x * deltaTime * 0.1;
      particle.y += particle.driftSpeed.y * deltaTime * 0.1;
      
      // Add cosmic flow
      particle.x += this.nebulaFlow.x * particle.layer * 0.1;
      particle.y += this.nebulaFlow.y * particle.layer * 0.1;
      
      // Wrap around screen edges
      if (particle.x < -particle.size) {
        particle.x = this.canvasWidth + particle.size;
      } else if (particle.x > this.canvasWidth + particle.size) {
        particle.x = -particle.size;
      }
      
      if (particle.y < -particle.size) {
        particle.y = this.canvasHeight + particle.size;
      } else if (particle.y > this.canvasHeight + particle.size) {
        particle.y = -particle.size;
      }
      
      // Color transition
      if (Math.random() < 0.01) {
        const targetColor = currentPalette.nebula[Math.floor(Math.random() * currentPalette.nebula.length)];
        particle.color = particle.color.lerp(targetColor, 0.05);
      }
      
      // Alpha modulation
      particle.alpha = (particle.alpha + this.nebulaIntensity) * 0.5 * (0.8 + 0.2 * Math.sin(this.cosmicTime + particle.x * 0.01));
    });
  }

  private renderNebula(context: CanvasRenderingContext2D, width: number, height: number): void {
    // Render nebula in layers for depth
    for (let layer = 0; layer < 3; layer++) {
      this.nebulaParticles
        .filter(particle => particle.layer === layer)
        .forEach(particle => {
          context.save();
          context.globalAlpha = particle.alpha;
          context.filter = 'blur(15px)';
          
          const gradient = context.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
          );
          gradient.addColorStop(0, particle.color.toString());
          gradient.addColorStop(0.7, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha * 0.3})`);
          gradient.addColorStop(1, 'transparent');
          
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
          
          context.restore();
        });
    }
  }

  // Utility methods

  private updateParallax(): void {
    // Create subtle parallax effect based on mouse position and cosmic time
    this.parallaxOffset.x = lerp(
      this.parallaxOffset.x,
      (this.normalizedMouseX * 20) + Math.sin(this.cosmicTime * 0.2) * 5,
      0.02
    );
    this.parallaxOffset.y = lerp(
      this.parallaxOffset.y,
      (this.normalizedMouseY * 20) + Math.cos(this.cosmicTime * 0.15) * 5,
      0.02
    );
  }

  private getCurrentColorPalette() {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return this.colorPalettes.userSpeaking;
      case VoiceState.PROCESSING:
        return this.colorPalettes.processing;
      case VoiceState.AI_SPEAKING:
        return this.colorPalettes.aiSpeaking;
      default:
        return this.colorPalettes.idle;
    }
  }

  protected onDispose(): void {
    this.stars = [];
    this.shootingStars = [];
    this.starPool.clear();
    this.constellations = [];
    this.nebulaParticles = [];
  }
}