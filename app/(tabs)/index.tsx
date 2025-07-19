import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { Plus, Tv, Film, Monitor } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PlaylistService } from '@/services/PlaylistService';
import { MediaItem, PlaylistCategory } from '@/types/media';
import { MediaCard } from '@/components/MediaCard';
import { AddPlaylistModal } from '@/components/AddPlaylistModal';

const { width } = Dimensions.get('window');
const isTV = Platform.isTV || width > 1000;

export default function HomeScreen() {
  const [categories, setCategories] = useState<PlaylistCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  // Recarrega as playlists sempre que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      loadPlaylists();
    }, [])
  );

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


  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return categories.flatMap(cat => cat.items);
    }
    const category = categories.find(cat => cat.name === selectedCategory);
    return category ? category.items : [];
  };

  const getCategoryCount = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.count : 0;
  };
  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <MediaCard item={item} />
  );

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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
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
        <>
          <View style={styles.fixedCategoriesContainer}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'all' && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === 'all' && styles.categoryTextActive
              ]}>
                Todos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'TV' && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory('TV')}
            >
              <View style={styles.categoryContent}>
                <Tv size={16} color={selectedCategory === 'TV' ? '#FFF' : '#FF6B35'} />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === 'TV' && styles.categoryTextActive
                ]}>
                  TV ({getCategoryCount('TV')})
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'Séries' && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory('Séries')}
            >
              <View style={styles.categoryContent}>
                <Monitor size={16} color={selectedCategory === 'Séries' ? '#FFF' : '#FF6B35'} />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === 'Séries' && styles.categoryTextActive
                ]}>
                  Séries ({getCategoryCount('Séries')})
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'Filmes' && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory('Filmes')}
            >
              <View style={styles.categoryContent}>
                <Film size={16} color={selectedCategory === 'Filmes' ? '#FFF' : '#FF6B35'} />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === 'Filmes' && styles.categoryTextActive
                ]}>
                  Filmes ({getCategoryCount('Filmes')})
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <FlatList
            data={getFilteredItems()}
            renderItem={renderMediaItem}
            keyExtractor={(item) => item.id}
            numColumns={isTV ? 4 : 2}
            contentContainerStyle={styles.mediaGrid}
            showsVerticalScrollIndicator={false}
          />
        </>
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
  addButton: {
    backgroundColor: '#FF6B35',
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
  fixedCategoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 80,
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  mediaGrid: {
    padding: 20,
    gap: 16,
  },
});