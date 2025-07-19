export interface MediaItem {
  id: string;
  name: string;
  url: string;
  groupTitle: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  duration?: number;
}

export interface PlaylistCategory {
  name: string;
  count: number;
  items: MediaItem[];
}

export interface PlaylistData {
  name: string;
  url?: string;
  content: string;
  items: MediaItem[];
  createdAt: Date;
}