export interface MediaItem {
  id: string;
  name: string;
  url: string;
  mainCategory: string;
  subCategory?: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  duration?: number;
}

export interface SubcategoryData {
  name: string;
  count: number;
  items: MediaItem[];
}

export interface PlaylistCategory {
  name: string;
  count: number;
  items: MediaItem[];
  subcategories: { [key: string]: SubcategoryData };
}

export interface PlaylistData {
  name: string;
  url?: string;
  content: string;
  items: MediaItem[];
  createdAt: Date;
}