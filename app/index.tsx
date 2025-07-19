import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { Tv, Film, Monitor, Settings, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PlaylistService } from '@/services/PlaylistService';
import { MediaItem, PlaylistCategory } from '@/types/media';
import { AddPlaylistModal } from '@/components/AddPlaylistModal';

const { width } = Dimensions.get('window');
const isTV = Platform.isTV || width > 1000;

export default function HomeScreen() {
  const [categories, setCategories] = useState<PlaylistCategory[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const data = await PlaylistService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryCount = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.count : 0;
  };

  const navigateToCategory = (category: string) => {
    switch (category) {
      case 'TV':
        router.push('/tv');
        break;
      case 'Filmes':
        router.push('/movies');
        break;
      case 'Séries':
        router.push('/series');
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando conteúdo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>StreamTV</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Monitor size={64} color="#666" />
          <Text style={styles.emptyTitle}>Nenhuma playlist encontrada</Text>
          <Text style={styles.emptySubtitle}>
            Adicione uma playlist M3U para começar
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Plus size={20} color="#FFF" />
            <Text style={styles.buttonText}>Adicionar Playlist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.categoriesGrid}>
          <TouchableOpacity
            style={[styles.categoryCard, styles.tvCard]}
            onPress={() => navigateToCategory('TV')}
          >
            <View style={styles.categoryIcon}>
              <Tv size={48} color="#4CAF50" />
            </View>
            <Text style={styles.categoryTitle}>TV</Text>
            <Text style={styles.categoryCount}>{getCategoryCount('TV')} canais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, styles.moviesCard]}
            onPress={() => navigateToCategory('Filmes')}
          >
            <View style={styles.categoryIcon}>
              <Film size={48} color="#FF9800" />
            </View>
            <Text style={styles.categoryTitle}>Filmes</Text>
            <Text style={styles.categoryCount}>{getCategoryCount('Filmes')} filmes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryCard, styles.seriesCard]}
            onPress={() => navigateToCategory('Séries')}
          >
            <View style={styles.categoryIcon}>
              <Monitor size={48} color="#9C27B0" />
            </View>
            <Text style={styles.categoryTitle}>Séries</Text>
            <Text style={styles.categoryCount}>{getCategoryCount('Séries')} séries</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddPlaylistModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSuccess={loadPlaylists}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1F1F1F',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    backgroundColor: '#666',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesGrid: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 20,
  },
  categoryCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tvCard: {
    borderColor: '#4CAF50',
  },
  moviesCard: {
    borderColor: '#FF9800',
  },
  seriesCard: {
    borderColor: '#9C27B0',
  },
  categoryIcon: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  categoryCount: {
    fontSize: 16,
    color: '#888',
  },
});