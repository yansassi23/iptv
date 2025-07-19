import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaItem, PlaylistCategory, PlaylistData } from '@/types/media';

const STORAGE_KEY = 'playlists';

export class PlaylistService {
  static async addPlaylist(name: string, content: string, url?: string): Promise<void> {
    try {
      const items = this.parseM3U(content);
      console.log('PlaylistService.addPlaylist: Itens parseados do conteúdo:', items.length);
      
      if (items.length === 0) {
        throw new Error('Nenhum item de mídia válido encontrado na playlist.');
      }
      
      const playlist: PlaylistData = {
        name,
        url,
        content,
        items,
        createdAt: new Date(),
      };

      const existing = await this.getPlaylists();
      console.log('PlaylistService.addPlaylist: Playlists existentes antes de adicionar:', existing.length);
      existing.push(playlist);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      console.log('PlaylistService.addPlaylist: Playlist salva com sucesso no AsyncStorage.');
    } catch (error) {
      console.error('PlaylistService.addPlaylist: Erro ao adicionar playlist:', error);
      throw error;
    }
  }

  static async getPlaylists(): Promise<PlaylistData[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar playlists:', error);
      return [];
    }
  }

  static async getAllCategories(): Promise<PlaylistCategory[]> {
    try {
      const playlists = await this.getPlaylists();
      const allItems = playlists.flatMap(p => p.items);
      
      const categoriesMap = new Map<string, MediaItem[]>();
      
      allItems.forEach(item => {
        const category = item.groupTitle || 'Sem categoria';
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, []);
        }
        categoriesMap.get(category)!.push(item);
      });

      const categories: PlaylistCategory[] = [];
      categoriesMap.forEach((items, name) => {
        categories.push({
          name,
          count: items.length,
          items: items.sort((a, b) => a.name.localeCompare(b.name)),
        });
      });

      return categories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      return [];
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    }
  }

  static async exportData(): Promise<MediaItem[]> {
    try {
      const playlists = await this.getPlaylists();
      return playlists.flatMap(p => p.items);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  }

  static parseM3U(content: string): MediaItem[] {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    console.log('PlaylistService.parseM3U: Contagem de linhas processadas:', lines.length);
    console.log('PlaylistService.parseM3U: Primeiras 5 linhas:', lines.slice(0, 5));
    const items: MediaItem[] = [];
    
    let currentItem: Partial<MediaItem> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('#EXTINF:')) {
        // Parse EXTINF line
        const extinf = line.substring(8); // Remove '#EXTINF:'
        
        // Extract duration
        const durationMatch = extinf.match(/^(-?\d+(?:\.\d+)?)/);
        if (durationMatch) {
          currentItem.duration = parseFloat(durationMatch[1]);
        }
        
        // Extract attributes
        const attributeRegex = /(\w+)="([^"]+)"/g;
        let match;
        while ((match = attributeRegex.exec(extinf)) !== null) {
          const [, key, value] = match;
          switch (key) {
            case 'tvg-id':
              currentItem.tvgId = value;
              break;
            case 'tvg-name':
              currentItem.tvgName = value;
              break;
            case 'tvg-logo':
              currentItem.tvgLogo = value;
              break;
            case 'group-title':
              currentItem.groupTitle = value;
              break;
          }
        }
        
        // Extract name (everything after the last comma)
        const nameMatch = extinf.match(/,(.+)$/);
        if (nameMatch) {
          currentItem.name = nameMatch[1].trim();
          console.log('PlaylistService.parseM3U: Nome extraído:', currentItem.name);
        } else {
          // Se não encontrou nome após vírgula, tenta usar tvg-name
          if (currentItem.tvgName) {
            currentItem.name = currentItem.tvgName;
            console.log('PlaylistService.parseM3U: Nome extraído do tvg-name:', currentItem.name);
          } else {
            // Se não tem tvg-name, usa um nome genérico baseado no índice
            currentItem.name = `Canal ${i + 1}`;
            console.log('PlaylistService.parseM3U: Nome genérico atribuído:', currentItem.name);
          }
        }
        
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        // This is a URL line
        // Garante que sempre há um nome, mesmo que genérico
        if (!currentItem.name) {
          currentItem.name = currentItem.tvgName || `Canal ${items.length + 1}`;
        }
        
        if (currentItem.name) {
          const item: MediaItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: currentItem.name,
            url: line,
            groupTitle: currentItem.groupTitle || 'Sem categoria',
            tvgId: currentItem.tvgId,
            tvgName: currentItem.tvgName,
            tvgLogo: currentItem.tvgLogo,
            duration: currentItem.duration,
          };
          
          console.log('PlaylistService.parseM3U: Adicionando item:', item.name);
          items.push(item);
        }
        
        // Reset for next item
        currentItem = {};
      } else if (line && !line.startsWith('#') && currentItem.name) {
        // Linha que não é HTTP mas pode ser uma URL relativa ou outro formato
        // Só adiciona se tiver um nome definido
        const item: MediaItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: currentItem.name,
          url: line,
          groupTitle: currentItem.groupTitle || 'Sem categoria',
          tvgId: currentItem.tvgId,
          tvgName: currentItem.tvgName,
          tvgLogo: currentItem.tvgLogo,
          duration: currentItem.duration,
        };
        
        console.log('PlaylistService.parseM3U: Adicionando item (URL não-HTTP):', item.name);
        items.push(item);
        
        // Reset for next item
        currentItem = {};
      }
    }
    
    console.log('PlaylistService.parseM3U: Contagem final de itens processados:', items.length);
    return items;
  }

  static async fetchPlaylistFromUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Erro ao buscar playlist:', error);
      throw new Error('Não foi possível carregar a playlist da URL fornecida');
    }
  }
}