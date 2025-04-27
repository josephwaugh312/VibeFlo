// Define user type
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  password?: string;
  profile_picture?: string;
  avatar_url?: string;
  google_id?: string;
  facebook_id?: string;
  github_id?: string;
  is_verified?: boolean;
  is_admin?: boolean;
  bio?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Define pomodoro session type
export interface PomodoroSession {
  id: number;
  user_id: number;
  duration: number;
  task?: string;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
} 