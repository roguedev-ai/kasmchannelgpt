/**
 * Utils Index
 * 
 * Exports all utility functions, constants, and types
 */

// Export constants and types
export * from './constants';

// Helper functions
export const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const isFileTypeAllowed = (type: string, allowedTypes: readonly string[]): boolean => {
  return allowedTypes.includes(type as any);
};
