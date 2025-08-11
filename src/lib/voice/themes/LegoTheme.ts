/**
 * LEGO Theme - Building Block Experience
 * 
 * A playful and creative theme featuring 3D LEGO-style blocks that build,
 * stack, and break apart in response to voice interactions. Includes
 * realistic LEGO brick physics, bright colors, and satisfying construction animations.
 */

import { BaseTheme } from './BaseTheme';
import { VoiceState } from './IVoiceTheme';
import { lerp, random, sineWave, distance2D, clamp, project3D } from '../utils/math';
import { Color, GradientBuilder, Easing } from '../utils/effects';
import { ObjectPool } from '../utils/performance';

interface LegoBlock {
  x: number;
  y: number;
  z: number;
  width: number;  // In LEGO units (1 unit = standard brick width)
  height: number; // In LEGO units (1 unit = 1/3 standard brick height)
  depth: number;  // In LEGO units
  color: Color;
  alpha: number;
  targetAlpha: number;
  
  // 3D rotation
  rotX: number;
  rotY: number;
  rotZ: number;
  targetRotX: number;
  targetRotY: number;
  targetRotZ: number;
  
  // Animation state
  buildProgress: number; // 0-1, used for building animation
  targetBuildProgress: number;
  isBuilding: boolean;
  isDestroying: boolean;
  
  // Physics for destruction
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  age: number;
  maxAge: number;
  
  // Visual effects
  highlight: number; // 0-1, mouse interaction highlight
  clickEffect: number; // 0-1, placement click effect
  studGlow: number; // 0-1, stud glow intensity
}

interface ConstructionSite {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  blocks: LegoBlock[];
  buildingProgress: number; // 0-1, overall construction progress
  isActive: boolean;
  constructionType: 'tower' | 'wall' | 'pyramid' | 'house' | 'bridge';
}

interface StudDetail {
  x: number;
  y: number;
  radius: number;
  height: number;
  alpha: number;
}

// Type alias for construction types
type ConstructionType = 'tower' | 'wall' | 'pyramid' | 'house' | 'bridge';

export class LegoTheme extends BaseTheme {
  readonly id = 'lego';
  readonly name = 'LEGO Blocks';
  readonly description = '3D building blocks that construct and deconstruct with satisfying physics';
  readonly category = 'artistic' as const;
  readonly performanceProfile = 'medium' as const;

  // Block System
  private blocks: LegoBlock[] = [];
  private blockPool: ObjectPool<LegoBlock>;
  private constructionSites: ConstructionSite[] = [];
  private maxBlocks = 80;
  
  // Construction settings
  private baseBlockSize = 24; // Base size for 1x1 block in pixels
  private studSize = 3;
  private studHeight = 2;
  private blockHeight = 8; // Height of one LEGO unit
  
  // Animation state
  private constructionTime = 0;
  private currentConstruction: ConstructionSite | null = null;
  private buildingSpeed = 1;
  private destructionForce = 1;
  
  // Visual effects
  private clickParticles: Array<{
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    size: number; color: Color; alpha: number; age: number; maxAge: number;
  }> = [];
  
  // LEGO Color Palette (authentic LEGO colors)
  private legoColors = {
    idle: [
      new Color(196, 40, 28),   // Bright Red
      new Color(13, 105, 171),  // Bright Blue  
      new Color(18, 133, 43),   // Bright Green
      new Color(245, 205, 47),  // Bright Yellow
      new Color(255, 255, 255), // White
      new Color(99, 95, 97),    // Dark Stone Gray
      new Color(40, 127, 70),   // Dark Green
      new Color(215, 130, 26)   // Bright Orange
    ],
    userSpeaking: [
      new Color(196, 40, 28),   // Bright Red (primary)
      new Color(215, 130, 26),  // Bright Orange
      new Color(245, 205, 47),  // Bright Yellow
      new Color(255, 102, 204), // Bright Pink
    ],
    processing: [
      new Color(136, 62, 152),  // Medium Lilac
      new Color(13, 105, 171),  // Bright Blue
      new Color(107, 50, 124),  // Dark Purple
      new Color(198, 142, 226), // Light Purple
    ],
    aiSpeaking: [
      new Color(18, 133, 43),   // Bright Green (primary)
      new Color(40, 127, 70),   // Dark Green
      new Color(159, 161, 164), // Light Stone Gray
      new Color(245, 205, 47),  // Bright Yellow
    ]
  };

  // Construction patterns
  private constructionPatterns = {
    tower: { width: 2, depth: 2, height: 8 },
    wall: { width: 8, depth: 1, height: 4 },
    pyramid: { width: 6, depth: 6, height: 4 },
    house: { width: 6, depth: 4, height: 6 },
    bridge: { width: 10, depth: 2, height: 3 }
  };

  constructor() {
    super();
    
    this.blockPool = new ObjectPool<LegoBlock>(
      () => ({
        x: 0, y: 0, z: 0, width: 1, height: 1, depth: 1,
        color: new Color(196, 40, 28), alpha: 0, targetAlpha: 1,
        rotX: 0, rotY: 0, rotZ: 0,
        targetRotX: 0, targetRotY: 0, targetRotZ: 0,
        buildProgress: 0, targetBuildProgress: 1,
        isBuilding: false, isDestroying: false,
        velocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
        age: 0, maxAge: 1000,
        highlight: 0, clickEffect: 0, studGlow: 0
      }),
      (block) => {
        block.alpha = 0;
        block.buildProgress = 0;
        block.isBuilding = false;
        block.isDestroying = false;
        block.age = 0;
        block.highlight = 0;
        block.clickEffect = 0;
        block.studGlow = 0;
        block.velocity = { x: 0, y: 0, z: 0 };
        block.angularVelocity = { x: 0, y: 0, z: 0 };
      },
      30,
      150
    );
  }

  protected onInit(): void {
    this.maxBlocks = Math.min(this.getMaxParticles(), 100);
    this.initializeConstructionSites();
    this.startInitialConstruction();
    console.log(`LegoTheme initialized - Ready to build with ${this.maxBlocks} blocks`);
  }

  protected onDraw(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    deltaTime: number
  ): void {
    this.constructionTime += deltaTime * 0.001;
    
    // Update systems
    this.updateConstructionSites(deltaTime);
    this.updateBlocks(deltaTime);
    this.updateClickParticles(deltaTime);
    
    // Render systems (back to front for proper 3D layering)
    this.renderConstructionGrid(context, width, height, centerX, centerY);
    
    // Sort blocks by z-depth for proper 3D rendering
    const sortedBlocks = [...this.blocks].sort((a, b) => b.z - a.z);
    
    // Render blocks
    sortedBlocks.forEach(block => {
      this.renderBlock(context, block, centerX, centerY);
    });
    
    // Render effects
    this.renderClickParticles(context, centerX, centerY);
    
    // Render building progress indicator
    if (this.currentConstruction?.isActive) {
      this.renderBuildingProgress(context, width, height);
    }
  }

  protected onStateChange(newState: VoiceState): void {
    switch (newState) {
      case VoiceState.USER_SPEAKING:
        console.log("🎤 [LegoTheme] User speaking - Red alert building");
        this.buildingSpeed = 2;
        this.startConstruction('tower');
        this.createClickEffect(this.centerX, this.centerY);
        break;
        
      case VoiceState.PROCESSING:
        console.log("⚙️ [LegoTheme] Processing - Purple power construction");
        this.buildingSpeed = 3;
        this.startConstruction('pyramid');
        this.triggerMassConstruction();
        break;
        
      case VoiceState.AI_SPEAKING:
        console.log("🤖 [LegoTheme] AI speaking - Green growth building");
        this.buildingSpeed = 1.5;
        this.startConstruction('house');
        break;
        
      case VoiceState.IDLE:
      default:
        console.log("🔄 [LegoTheme] Idle - Gentle construction");
        this.buildingSpeed = 1;
        this.startConstruction('wall');
        break;
    }
  }

  protected getThemeSpecificMetrics() {
    return {
      totalBlocks: this.blocks.length,
      buildingBlocks: this.blocks.filter(b => b.isBuilding).length,
      destroyingBlocks: this.blocks.filter(b => b.isDestroying).length,
      constructionSites: this.constructionSites.length,
      activeConstructions: this.constructionSites.filter(s => s.isActive).length,
      buildingProgress: this.currentConstruction ? Math.round(this.currentConstruction.buildingProgress * 100) : 0
    };
  }

  // Construction Site Management

  private initializeConstructionSites(): void {
    const sites: Array<{ type: ConstructionType; x: number; y: number }> = [
      { type: 'wall', x: -150, y: -50 },
      { type: 'tower', x: 100, y: -80 },
      { type: 'house', x: -50, y: 60 },
      { type: 'bridge', x: 80, y: 80 },
    ];

    sites.forEach(site => {
      const pattern = this.constructionPatterns[site.type];
      this.constructionSites.push({
        x: site.x,
        y: site.y,
        z: 0,
        width: pattern.width,
        height: pattern.height,
        depth: pattern.depth,
        blocks: [],
        buildingProgress: 0,
        isActive: false,
        constructionType: site.type
      });
    });
  }

  private startInitialConstruction(): void {
    // Start with a simple wall construction
    this.startConstruction('wall');
  }

  private startConstruction(type: ConstructionType): void {
    // Find or create construction site for this type
    let site = this.constructionSites.find(s => s.constructionType === type && !s.isActive);
    
    if (!site) {
      // Create new site if none available
      const pattern = this.constructionPatterns[type];
      const angle = random(0, Math.PI * 2);
      const distance = random(50, 150);
      
      site = {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: 0,
        width: pattern.width,
        height: pattern.height,
        depth: pattern.depth,
        blocks: [],
        buildingProgress: 0,
        isActive: true,
        constructionType: type
      };
      this.constructionSites.push(site);
    } else {
      site.isActive = true;
    }

    this.currentConstruction = site;
    this.generateConstructionBlocks(site);
  }

  private generateConstructionBlocks(site: ConstructionSite): void {
    const colors = this.getCurrentColorPalette();
    site.blocks = [];

    // Generate blocks based on construction type
    switch (site.constructionType) {
      case 'tower':
        this.generateTowerBlocks(site, colors);
        break;
      case 'wall':
        this.generateWallBlocks(site, colors);
        break;
      case 'pyramid':
        this.generatePyramidBlocks(site, colors);
        break;
      case 'house':
        this.generateHouseBlocks(site, colors);
        break;
      case 'bridge':
        this.generateBridgeBlocks(site, colors);
        break;
    }

    // Add blocks to main blocks array with staggered building animation
    site.blocks.forEach((block, index) => {
      setTimeout(() => {
        if (this.blocks.length < this.maxBlocks) {
          block.isBuilding = true;
          block.buildProgress = 0;
          block.alpha = 0;
          this.blocks.push(block);
          this.createClickEffect(block.x + site.x, block.y + site.y);
        }
      }, index * 150 / this.buildingSpeed);
    });
  }

  private generateTowerBlocks(site: ConstructionSite, colors: Color[]): void {
    for (let y = 0; y < site.height; y++) {
      for (let x = 0; x < site.width; x++) {
        for (let z = 0; z < site.depth; z++) {
          const block = this.blockPool.acquire();
          
          block.x = site.x + (x - site.width/2) * this.baseBlockSize;
          block.y = site.y + (z - site.depth/2) * this.baseBlockSize;
          block.z = y * this.blockHeight;
          block.width = 1;
          block.height = 1;
          block.depth = 1;
          block.color = colors[y % colors.length].clone();
          
          site.blocks.push(block);
        }
      }
    }
  }

  private generateWallBlocks(site: ConstructionSite, colors: Color[]): void {
    for (let y = 0; y < site.height; y++) {
      for (let x = 0; x < site.width; x++) {
        const block = this.blockPool.acquire();
        
        block.x = site.x + (x - site.width/2) * this.baseBlockSize;
        block.y = site.y;
        block.z = y * this.blockHeight;
        
        // Vary block sizes for interesting wall pattern
        if (x % 3 === 0 && y % 2 === 0) {
          block.width = 2;
          block.height = 1;
          block.depth = 1;
        } else {
          block.width = 1;
          block.height = 1;  
          block.depth = 1;
        }
        
        block.color = colors[x % colors.length].clone();
        site.blocks.push(block);
      }
    }
  }

  private generatePyramidBlocks(site: ConstructionSite, colors: Color[]): void {
    for (let y = 0; y < site.height; y++) {
      const layerSize = site.width - y;
      const offset = y / 2;
      
      for (let x = 0; x < layerSize; x++) {
        for (let z = 0; z < layerSize; z++) {
          const block = this.blockPool.acquire();
          
          block.x = site.x + (x - layerSize/2 + offset) * this.baseBlockSize;
          block.y = site.y + (z - layerSize/2 + offset) * this.baseBlockSize;
          block.z = y * this.blockHeight;
          block.width = 1;
          block.height = 1;
          block.depth = 1;
          block.color = colors[y % colors.length].clone();
          
          site.blocks.push(block);
        }
      }
    }
  }

  private generateHouseBlocks(site: ConstructionSite, colors: Color[]): void {
    // House base
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < site.width; x++) {
        for (let z = 0; z < site.depth; z++) {
          // Skip interior for hollow house
          if (y < 2 && x > 0 && x < site.width-1 && z > 0 && z < site.depth-1) continue;
          
          const block = this.blockPool.acquire();
          block.x = site.x + (x - site.width/2) * this.baseBlockSize;
          block.y = site.y + (z - site.depth/2) * this.baseBlockSize;
          block.z = y * this.blockHeight;
          block.width = 1;
          block.height = 1;
          block.depth = 1;
          block.color = colors[0].clone(); // Use first color for walls
          
          site.blocks.push(block);
        }
      }
    }
    
    // House roof (simplified triangle)
    for (let y = 3; y < site.height; y++) {
      const roofSize = site.width - (y - 2);
      const offset = (y - 2) / 2;
      
      for (let x = 0; x < roofSize; x++) {
        const block = this.blockPool.acquire();
        block.x = site.x + (x - roofSize/2 + offset) * this.baseBlockSize;
        block.y = site.y;
        block.z = y * this.blockHeight;
        block.width = 1;
        block.height = 1;
        block.depth = 1;
        block.color = colors[1].clone(); // Use second color for roof
        
        site.blocks.push(block);
      }
    }
  }

  private generateBridgeBlocks(site: ConstructionSite, colors: Color[]): void {
    // Bridge pillars
    for (let pillar = 0; pillar < 2; pillar++) {
      const pillarX = pillar * (site.width - 1);
      for (let y = 0; y < site.height - 1; y++) {
        for (let z = 0; z < site.depth; z++) {
          const block = this.blockPool.acquire();
          block.x = site.x + (pillarX - site.width/2) * this.baseBlockSize;
          block.y = site.y + (z - site.depth/2) * this.baseBlockSize;
          block.z = y * this.blockHeight;
          block.width = 1;
          block.height = 1;
          block.depth = 1;
          block.color = colors[0].clone();
          
          site.blocks.push(block);
        }
      }
    }
    
    // Bridge deck
    const deckY = site.height - 1;
    for (let x = 0; x < site.width; x++) {
      for (let z = 0; z < site.depth; z++) {
        const block = this.blockPool.acquire();
        block.x = site.x + (x - site.width/2) * this.baseBlockSize;
        block.y = site.y + (z - site.depth/2) * this.baseBlockSize;
        block.z = deckY * this.blockHeight;
        block.width = 1;
        block.height = 1;
        block.depth = 1;
        block.color = colors[1].clone();
        
        site.blocks.push(block);
      }
    }
  }

  private triggerMassConstruction(): void {
    // Build multiple structures simultaneously during processing
    const types: Array<ConstructionType> = ['tower', 'wall', 'pyramid'];
    types.forEach((type, index) => {
      setTimeout(() => {
        this.startConstruction(type);
      }, index * 500);
    });
  }

  // Block Management

  private updateConstructionSites(deltaTime: number): void {
    this.constructionSites.forEach(site => {
      if (site.isActive) {
        // Update building progress based on how many blocks are fully built
        const totalBlocks = site.blocks.length;
        const builtBlocks = site.blocks.filter(b => b.buildProgress >= 1).length;
        site.buildingProgress = totalBlocks > 0 ? builtBlocks / totalBlocks : 0;
        
        // Deactivate site when construction is complete
        if (site.buildingProgress >= 1) {
          site.isActive = false;
          if (this.currentConstruction === site) {
            this.currentConstruction = null;
          }
        }
      }
    });
  }

  private updateBlocks(deltaTime: number): void {
    this.blocks = this.blocks.filter(block => {
      // Update building animation
      if (block.isBuilding) {
        block.buildProgress = lerp(block.buildProgress, block.targetBuildProgress, 0.05);
        block.alpha = lerp(block.alpha, block.targetAlpha, 0.1);
        
        if (block.buildProgress >= 0.98) {
          block.isBuilding = false;
          block.buildProgress = 1;
          block.alpha = 1;
        }
      }
      
      // Update destruction animation
      if (block.isDestroying) {
        block.age += deltaTime;
        
        // Physics simulation during destruction
        block.x += block.velocity.x * deltaTime * 0.1;
        block.y += block.velocity.y * deltaTime * 0.1;
        block.z += block.velocity.z * deltaTime * 0.1;
        
        block.rotX += block.angularVelocity.x * deltaTime * 0.001;
        block.rotY += block.angularVelocity.y * deltaTime * 0.001;
        block.rotZ += block.angularVelocity.z * deltaTime * 0.001;
        
        // Apply gravity
        block.velocity.z -= 0.5 * deltaTime * 0.1;
        
        // Fade out
        block.alpha = lerp(block.alpha, 0, 0.02);
        
        // Remove if expired or fallen too far
        if (block.age >= block.maxAge || block.z < -200 || block.alpha < 0.01) {
          this.blockPool.release(block);
          return false;
        }
      }
      
      // Update rotation animations
      block.rotX = lerp(block.rotX, block.targetRotX, 0.05);
      block.rotY = lerp(block.rotY, block.targetRotY, 0.05);
      block.rotZ = lerp(block.rotZ, block.targetRotZ, 0.05);
      
      // Update visual effects
      block.highlight = lerp(block.highlight, 0, 0.1);
      block.clickEffect = lerp(block.clickEffect, 0, 0.2);
      block.studGlow = lerp(block.studGlow, 0, 0.05);
      
      // Mouse interaction
      const screenX = block.x + this.centerX;
      const screenY = block.y + this.centerY - block.z * 0.5; // Simple 3D projection
      const distance = distance2D(screenX, screenY, this.mouseX, this.mouseY);
      
      if (distance < 30) {
        const influence = 1 - (distance / 30);
        block.highlight = Math.max(block.highlight, influence * this.mouseInfluence);
        block.studGlow = Math.max(block.studGlow, influence * this.mouseInfluence * 0.5);
      }
      
      return true;
    });
  }

  // Rendering

  private renderBlock(context: CanvasRenderingContext2D, block: LegoBlock, centerX: number, centerY: number): void {
    if (block.alpha < 0.01) return;
    
    context.save();
    
    // Calculate screen position with 3D projection
    const screenX = centerX + block.x;
    const screenY = centerY + block.y - block.z * 0.6; // Isometric-style projection
    
    // Apply building animation scale
    const buildScale = block.isBuilding ? 
      Easing.backOut(block.buildProgress) : 1;
    
    const blockWidth = this.baseBlockSize * block.width * buildScale;
    const blockHeight = this.baseBlockSize * block.depth * buildScale;
    const blockDepth = this.blockHeight * block.height * buildScale;
    
    context.globalAlpha = block.alpha;
    context.translate(screenX, screenY);
    
    // Apply 3D rotation (simplified)
    if (block.rotX !== 0 || block.rotY !== 0 || block.rotZ !== 0) {
      context.rotate(block.rotZ);
    }
    
    // Draw block shadow
    this.renderBlockShadow(context, blockWidth, blockHeight, block.alpha * 0.3);
    
    // Draw block faces for 3D effect
    this.renderBlockFaces(context, block, blockWidth, blockHeight, blockDepth);
    
    // Draw studs on top face
    this.renderBlockStuds(context, block, blockWidth, blockHeight);
    
    // Draw highlight effect
    if (block.highlight > 0.1) {
      this.renderBlockHighlight(context, blockWidth, blockHeight, block.highlight);
    }
    
    // Draw click effect
    if (block.clickEffect > 0.1) {
      this.renderBlockClickEffect(context, blockWidth, blockHeight, block.clickEffect);
    }
    
    context.restore();
  }

  private renderBlockShadow(context: CanvasRenderingContext2D, width: number, height: number, alpha: number): void {
    const shadowOffset = 3;
    context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    context.fillRect(shadowOffset, shadowOffset, width, height);
  }

  private renderBlockFaces(context: CanvasRenderingContext2D, block: LegoBlock, width: number, height: number, depth: number): void {
    const color = block.color;
    
    // Top face (brightest)
    const topColor = color.lighten(0.2);
    context.fillStyle = `rgba(${topColor.r}, ${topColor.g}, ${topColor.b}, 1)`;
    context.fillRect(-width/2, -height/2 - depth, width, height);
    
    // Front face (normal)
    context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    context.fillRect(-width/2, -height/2, width, depth);
    
    // Right face (darker)
    const rightColor = color.darken(0.15);
    context.fillStyle = `rgba(${rightColor.r}, ${rightColor.g}, ${rightColor.b}, 1)`;
    
    // Draw right face as parallelogram
    context.beginPath();
    context.moveTo(width/2, -height/2);
    context.lineTo(width/2 + depth*0.6, -height/2 - depth*0.6);
    context.lineTo(width/2 + depth*0.6, height/2 - depth*0.6);
    context.lineTo(width/2, height/2);
    context.closePath();
    context.fill();
    
    // Block outline
    context.strokeStyle = rightColor.darken(0.3).toString();
    context.lineWidth = 1;
    context.strokeRect(-width/2, -height/2, width, depth);
  }

  private renderBlockStuds(context: CanvasRenderingContext2D, block: LegoBlock, width: number, height: number): void {
    const studsX = Math.floor(block.width);
    const studsY = Math.floor(block.depth);
    const studSpacingX = width / studsX;
    const studSpacingY = height / studsY;
    
    const studColor = block.color.lighten(0.4);
    const glowIntensity = block.studGlow;
    
    for (let x = 0; x < studsX; x++) {
      for (let y = 0; y < studsY; y++) {
        const studX = -width/2 + (x + 0.5) * studSpacingX;
        const studY = -height/2 + (y + 0.5) * studSpacingY - this.blockHeight * block.height;
        
        context.save();
        
        // Stud glow effect
        if (glowIntensity > 0.1) {
          const gradient = context.createRadialGradient(studX, studY, 0, studX, studY, this.studSize * 2);
          gradient.addColorStop(0, `rgba(${studColor.r}, ${studColor.g}, ${studColor.b}, ${glowIntensity})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(studX, studY, this.studSize * 2, 0, Math.PI * 2);
          context.fill();
        }
        
        // Stud body
        context.fillStyle = `rgba(${studColor.r}, ${studColor.g}, ${studColor.b}, 1)`;
        context.beginPath();
        context.arc(studX, studY, this.studSize, 0, Math.PI * 2);
        context.fill();
        
        // Stud highlight
        const highlightColor = studColor.lighten(0.3);
        context.fillStyle = `rgba(${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b}, 0.7)`;
        context.beginPath();
        context.arc(studX - 1, studY - 1, this.studSize * 0.6, 0, Math.PI * 2);
        context.fill();
        
        context.restore();
      }
    }
  }

  private renderBlockHighlight(context: CanvasRenderingContext2D, width: number, height: number, intensity: number): void {
    context.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
    context.lineWidth = 2;
    context.strokeRect(-width/2 - 2, -height/2 - 2, width + 4, height + 4);
  }

  private renderBlockClickEffect(context: CanvasRenderingContext2D, width: number, height: number, intensity: number): void {
    const effectRadius = Math.max(width, height) * intensity * 0.8;
    
    context.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, effectRadius, 0, Math.PI * 2);
    context.stroke();
  }

  private renderConstructionGrid(context: CanvasRenderingContext2D, width: number, height: number, centerX: number, centerY: number): void {
    const alpha = 0.1;
    const gridSize = this.baseBlockSize;
    
    context.save();
    context.strokeStyle = `rgba(150, 150, 150, ${alpha})`;
    context.lineWidth = 0.5;
    
    // Draw grid centered on screen
    const startX = centerX - (Math.floor(width / 2 / gridSize) * gridSize);
    const startY = centerY - (Math.floor(height / 2 / gridSize) * gridSize);
    
    // Vertical lines
    for (let x = startX; x < width + startX; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y < height + startY; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    
    context.restore();
  }

  private renderBuildingProgress(context: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.currentConstruction) return;
    
    const progress = this.currentConstruction.buildingProgress;
    const barWidth = 200;
    const barHeight = 8;
    const x = (width - barWidth) / 2;
    const y = height - 50;
    
    context.save();
    
    // Background
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 10);
    
    // Progress bar background
    context.fillStyle = 'rgba(100, 100, 100, 0.8)';
    context.fillRect(x, y, barWidth, barHeight);
    
    // Progress bar fill
    const colors = this.getCurrentColorPalette();
    const fillColor = colors[0];
    context.fillStyle = `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, 0.9)`;
    context.fillRect(x, y, barWidth * progress, barHeight);
    
    // Text
    context.font = '12px monospace';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(
      `Building ${this.currentConstruction.constructionType.toUpperCase()}... ${Math.round(progress * 100)}%`,
      width / 2,
      y - 15
    );
    
    context.restore();
  }

  // Click Effects and Particles

  private createClickEffect(x: number, y: number): void {
    // Create particle burst effect
    const colors = this.getCurrentColorPalette();
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const speed = random(2, 6);
      
      this.clickParticles.push({
        x: x,
        y: y,
        z: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: random(2, 4),
        size: random(2, 4),
        color: colors[Math.floor(Math.random() * colors.length)].clone(),
        alpha: 1,
        age: 0,
        maxAge: random(30, 60)
      });
    }
    
    // Add click effect to nearby blocks
    this.blocks.forEach(block => {
      const blockScreenX = block.x + this.centerX;
      const blockScreenY = block.y + this.centerY;
      const distance = distance2D(blockScreenX, blockScreenY, x, y);
      
      if (distance < 50) {
        const influence = 1 - (distance / 50);
        block.clickEffect = Math.max(block.clickEffect, influence);
      }
    });
  }

  private updateClickParticles(deltaTime: number): void {
    this.clickParticles = this.clickParticles.filter(particle => {
      particle.age += deltaTime;
      
      particle.x += particle.vx * deltaTime * 0.1;
      particle.y += particle.vy * deltaTime * 0.1;
      particle.z += particle.vz * deltaTime * 0.1;
      
      particle.vz -= 0.3 * deltaTime * 0.1; // Gravity
      particle.alpha = 1 - (particle.age / particle.maxAge);
      
      return particle.age < particle.maxAge && particle.alpha > 0.01;
    });
  }

  private renderClickParticles(context: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    this.clickParticles.forEach(particle => {
      const screenX = centerX + particle.x;
      const screenY = centerY + particle.y - particle.z * 0.5;
      
      context.save();
      context.globalAlpha = particle.alpha;
      context.fillStyle = particle.color.toString();
      context.beginPath();
      context.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }

  // Utility Methods

  private getCurrentColorPalette(): Color[] {
    switch (this.currentState) {
      case VoiceState.USER_SPEAKING:
        return this.legoColors.userSpeaking;
      case VoiceState.PROCESSING:
        return this.legoColors.processing;
      case VoiceState.AI_SPEAKING:
        return this.legoColors.aiSpeaking;
      default:
        return this.legoColors.idle;
    }
  }

  protected onDispose(): void {
    this.blocks = [];
    this.blockPool.clear();
    this.constructionSites = [];
    this.clickParticles = [];
    this.currentConstruction = null;
  }
}