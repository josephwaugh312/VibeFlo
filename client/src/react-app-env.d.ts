/// <reference types="react-scripts" />

// For modules without type definitions
declare module 'react-youtube';
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg';
declare module '*.png';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';

// Extend Window interface if needed for global objects
interface Window {
  YT?: any;
  onYouTubeIframeAPIReady?: () => void;
}
