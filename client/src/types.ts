// Common interface definitions for the client application

// User interface
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
  is_verified?: boolean;
}

// Playlist interface
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  songs?: Song[];
  user?: User;
  song_count?: number;
}

// Song interface
export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  image_url?: string;
  duration?: number;
  playlist_id?: string;
  created_at?: string;
  updated_at?: string;
  source?: string;
}

// Theme interface
export interface Theme {
  id: string;
  name: string;
  description?: string;
  background_url?: string;
  image_url?: string;
  gradient_colors?: string[];
  background_color?: string;
  text_color?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  is_dark?: boolean;
  is_default?: boolean;
  is_public?: boolean;
  is_standard?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  user?: User;
}

// Add more interfaces as needed 