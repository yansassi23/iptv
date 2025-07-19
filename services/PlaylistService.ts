import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaItem, PlaylistCategory, PlaylistData, SubcategoryData } from '@/types/media';

const STORAGE_KEY = 'playlists';

export class PlaylistService {
  static async addPlaylist(name: string, content: string, url?: string, forceCategory?: string): Promise<void> {
    try {
      console.log('PlaylistService.addPlaylist: Iniciando adição de playlist:', name);
      console.log('PlaylistService.addPlaylist: forceCategory:', forceCategory);
      console.log('PlaylistService.addPlaylist: Tamanho do conteúdo:', content.length);
      
      const items = this.parseM3U(content, forceCategory);
      console.log('PlaylistService.addPlaylist: Itens parseados do conteúdo:', items.length);
      
      // Log detalhado dos primeiros 3 itens para verificar categorização
      items.slice(0, 3).forEach((item, index) => {
        console.log(`PlaylistService.addPlaylist: Item ${index + 1}:`, {
          name: item.name,
          mainCategory: item.mainCategory,
          subCategory: item.subCategory,
          url: item.url.substring(0, 50) + '...'
        });
      });
      
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
      console.log('PlaylistService.getAllCategories: Iniciando carregamento de categorias');
      const playlists = await this.getPlaylists();
      console.log('PlaylistService.getAllCategories: Playlists carregadas:', playlists.length);
      
      const allItems = playlists.flatMap(p => p.items);
      console.log('PlaylistService.getAllCategories: Total de itens de todas as playlists:', allItems.length);
      
      const categoriesMap = new Map<string, MediaItem[]>();
      
      allItems.forEach(item => {
        const category = item.mainCategory || 'Sem categoria';
        console.log('PlaylistService.getAllCategories: Processando item:', item.name, 'categoria principal:', category, 'subcategoria:', item.subCategory);
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, []);
        }
        categoriesMap.get(category)!.push(item);
      });

      console.log('PlaylistService.getAllCategories: Categorias encontradas no mapa:', Array.from(categoriesMap.keys()));
      
      const categories: PlaylistCategory[] = [];
      categoriesMap.forEach((items, name) => {
        console.log(`PlaylistService.getAllCategories: Categoria "${name}" com ${items.length} itens`);
        
        // Agrupar itens por subcategoria
        const subcategoriesMap = new Map<string, MediaItem[]>();
        items.forEach(item => {
          const subCat = item.subCategory || 'Geral';
          if (!subcategoriesMap.has(subCat)) {
            subcategoriesMap.set(subCat, []);
          }
          subcategoriesMap.get(subCat)!.push(item);
        });

        // Criar objeto de subcategorias
        const subcategories: { [key: string]: SubcategoryData } = {};
        subcategoriesMap.forEach((subItems, subName) => {
          subcategories[subName] = {
            name: subName,
            count: subItems.length,
            items: subItems.sort((a, b) => a.name.localeCompare(b.name)),
          };
        });

        categories.push({
          name,
          count: items.length,
          items: items.sort((a, b) => a.name.localeCompare(b.name)),
          subcategories,
        });
      });

      const finalCategories = categories.sort((a, b) => a.name.localeCompare(b.name));
      console.log('PlaylistService.getAllCategories: Categorias finais:', finalCategories.map(c => `${c.name} (${c.count})`));
      
      return finalCategories;
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

  static extractCategories(groupTitle: string, forceCategory?: string): { main: string; sub?: string } {
    console.log('=== extractCategories DEBUG ===');
    console.log('Input groupTitle:', JSON.stringify(groupTitle));
    
    if (!groupTitle || !groupTitle.trim()) {
      const result = { main: 'Outros' };
      console.log('No groupTitle - returning:', result);
      return result;
    }
    
    // Clean and normalize the groupTitle
    const cleanGroupTitle = groupTitle.trim();
    
    console.log('Processing groupTitle:', cleanGroupTitle);
    
    if (cleanGroupTitle.includes('|')) {
      console.log('groupTitle contains | separator');
      const parts = cleanGroupTitle.split('|').map(part => part.trim()).filter(part => part);
      console.log('Split parts:', parts);
      
      if (parts.length >= 2) {
        // First part becomes main category (normalized)
        const mainCategory = this.normalizeMainCategory(parts[0]);
        
        // Second part becomes subcategory
        const subCategory = parts[1];
        
        const result = { main: mainCategory, sub: subCategory };
        console.log('Extracted from pipe-separated parts:', result);
        return result;
      }
    }
    
    // Single category - check if it's a main category keyword
    if (this.isMainCategoryKeyword(cleanGroupTitle)) {
      const mainCategory = this.normalizeMainCategory(cleanGroupTitle);
      const result = { main: mainCategory };
      console.log('Recognized as main category:', result);
      return result;
    } else {
      // Not a main category keyword, treat as subcategory
      const result = { main: 'Outros', sub: cleanGroupTitle };
      console.log('Treating as subcategory:', result);
      return result;
    }
  }

  static isMainCategoryKeyword(text: string): boolean {
    if (!text) return false;
    
    const normalized = text.toLowerCase().trim();
    const mainCategoryKeywords = [
      'tv', 'filmes', 'filme', 'movies', 'movie', 'séries', 'series', 'serie',
      'canais', 'canal', 'channels', 'channel', 'outros', 'other', 'geral', 'general'
    ];
    
    return mainCategoryKeywords.some(keyword => 
      normalized === keyword || normalized.includes(keyword)
    );
  }

  static normalizeMainCategory(category: string): string {
    if (!category) return 'Outros';
    
    console.log('PlaylistService.normalizeMainCategory: Normalizando:', category);
    
    const title = category.toLowerCase();
    
    // Categorias de Filmes
    if (title.includes('filme') || title.includes('filmes') || title.includes('movie') || 
        title.includes('movies') || title.includes('cinema') || title.includes('film') || 
        title.includes('films') || title.includes('hd movie') || title.includes('longa') || 
        title.includes('longas') || title.includes('longa-metragem') || title.includes('documentario') || 
        title.includes('documentários') || title.includes('documentary') || title.includes('documentaries')) {
      console.log('PlaylistService.normalizeMainCategory: Categorizado como Filmes');
      return 'Filmes';
    }
    
    // Categorias de Séries
    if (title.includes('série') || title.includes('series') || title.includes('seriado') || 
        title.includes('seriados') || title.includes('temporada') || title.includes('season') || 
        title.includes('episódio') || title.includes('episode') || title.includes('novela') ||
        title.includes('novelas') || title.includes('tv show') || title.includes('tv shows') ||
        title.includes('show') || title.includes('shows') || title.includes('miniserie') ||
        title.includes('minisserie') || title.includes('sitcom') || title.includes('soap opera') ||
        title.includes('telenovela') || title.includes('anime') || title.includes('animes') ||
        title.includes('desenho') || title.includes('desenhos') || title.includes('cartoon') ||
        title.includes('cartoons') || title.includes('reality') || title.includes('talk show')) {
      console.log('PlaylistService.normalizeMainCategory: Categorizado como Séries');
      return 'Séries';
    }
    
    // Categorias de TV
    if (title.includes('tv') || title.includes('canal') || title.includes('canais') || 
        title.includes('channel') || title.includes('channels') || title.includes('televisão') || 
        title.includes('television') || title.includes('live') || title.includes('ao vivo') ||
        title.includes('live tv') || title.includes('iptv') || title.includes('news') || 
        title.includes('notícia') || title.includes('noticias') || title.includes('jornalismo') ||
        title.includes('esporte') || title.includes('esportes') || title.includes('sport') || 
        title.includes('sports') || title.includes('futebol') || title.includes('football') ||
        title.includes('música') || title.includes('music') || title.includes('musical') ||
        title.includes('infantil') || title.includes('infantis') || title.includes('kids') ||
        title.includes('criança') || title.includes('criancas') || title.includes('children') ||
        title.includes('religioso') || title.includes('religious') || title.includes('gospel') ||
        title.includes('cultura') || title.includes('cultural') || title.includes('educativo') ||
        title.includes('educational') || title.includes('variedades') ||
        title.includes('variety') || title.includes('entretenimento') || title.includes('entertainment') ||
        title.includes('culinaria') || title.includes('cooking') || title.includes('lifestyle') ||
        title.includes('nacional') || title.includes('internacional') || title.includes('regional') ||
        title.includes('local') || title.includes('aberto') || title.includes('fechado') ||
        title.includes('premium') || title.includes('hd') || title.includes('4k')) {
      console.log('PlaylistService.normalizeMainCategory: Categorizado como TV');
      return 'TV';
    }
    
    console.log('PlaylistService.normalizeMainCategory: Categorizado como Outros');
    return 'Outros';
  }

  static parseM3U(content: string, forceCategory?: string): MediaItem[] {
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
        let rawGroupTitle = '';
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
              rawGroupTitle = value;
              break;
          }
        }
        
        // Extract categories from group-title
        const categories = this.extractCategories(rawGroupTitle);
        
        // Determine main category
        if (forceCategory) {
          // Use forced category as main category
          currentItem.mainCategory = forceCategory;
        } else if (categories.main !== 'Outros') {
          // Use extracted main category
          currentItem.mainCategory = categories.main;
        } else {
          // Try to infer from name
          const inferredCategory = this.normalizeMainCategory(currentItem.name || '');
          currentItem.mainCategory = inferredCategory !== 'Outros' ? inferredCategory : 'Outros';
        }
        
        // Always use extracted subcategory if available
        currentItem.subCategory = categories.sub;
        
        // Extract name (everything after the last comma)
        const nameMatch = extinf.match(/,(.+)$/);
        if (nameMatch) {
          currentItem.name = nameMatch[1].trim();
        } else {
          // Se não encontrou nome após vírgula, tenta usar tvg-name
          if (currentItem.tvgName) {
            currentItem.name = currentItem.tvgName;
          } else {
            // Se não tem tvg-name, usa um nome genérico baseado no índice
            currentItem.name = `Canal ${i + 1}`;
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
            mainCategory: currentItem.mainCategory || 'Outros',
            subCategory: currentItem.subCategory,
            tvgId: currentItem.tvgId,
            tvgName: currentItem.tvgName,
            tvgLogo: currentItem.tvgLogo,
            duration: currentItem.duration,
          };
          
          console.log('PlaylistService.parseM3U: Adicionando item:', {
            name: item.name,
            mainCategory: item.mainCategory,
            subCategory: item.subCategory
          });
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
          mainCategory: currentItem.mainCategory || 'Outros',
          subCategory: currentItem.subCategory,
          tvgId: currentItem.tvgId,
          tvgName: currentItem.tvgName,
          tvgLogo: currentItem.tvgLogo,
          duration: currentItem.duration,
        };
        
        console.log('PlaylistService.parseM3U: Adicionando item (URL não-HTTP):', {
          name: item.name,
          mainCategory: item.mainCategory,
          subCategory: item.subCategory
        });
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