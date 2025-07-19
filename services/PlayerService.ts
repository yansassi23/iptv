import { MediaItem } from '@/types/media';

type MediaChangeListener = () => void;

class PlayerServiceClass {
  private currentMedia: MediaItem | null = null;
  private listeners: MediaChangeListener[] = [];

  async setCurrentMedia(media: MediaItem): Promise<void> {
    this.currentMedia = media;
    this.notifyListeners();
  }

  async getCurrentMedia(): Promise<MediaItem | null> {
    return this.currentMedia;
  }

  onMediaChange(listener: MediaChangeListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const PlayerService = new PlayerServiceClass();