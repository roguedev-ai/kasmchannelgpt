/**
 * Voice Theme Utilities - Central Export
 * 
 * Re-exports all utility functions and classes for easy importing
 */

// Math utilities
export * from './math';

// Performance utilities
export * from './performance';

// Visual effects utilities
export * from './effects';

// Common type definitions for utilities
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform3D {
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
}