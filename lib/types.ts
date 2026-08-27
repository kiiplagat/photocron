export type Privacy = "public" | "followers" | "private";

export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
}

export interface Photo {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  taken_at: string; // date the photo was taken, e.g. "2026-06-14"
  privacy: Privacy;
  created_at: string;
  profiles?: Profile;
}
