/**
 * Type definitions for test environment
 * 
 * Extends global types to include Node.js gc function
 * which is available when --expose-gc flag is used.
 */

declare global {
  namespace NodeJS {
    interface Global {
      gc?: () => void;
    }
  }
  
  var gc: (() => void) | undefined;
}

export {};