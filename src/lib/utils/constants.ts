/**
 * Application Constants
 */

export const CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ] as const // Make this a readonly tuple
} as const;

// Type for accepted file types
export type AcceptedFileType = typeof CONSTANTS.ACCEPTED_FILE_TYPES[number];
