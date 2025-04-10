export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  password?: string;
  google_id?: string;
  github_id?: string;
  facebook_id?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
} 