import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, Folder } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PlaylistService } from '@/services/PlaylistService';
import { MediaItem, SubcategoryData } from '@/types/media';
import { MediaCard } from '@/components/MediaCard';

const { width } = Dimensions.get('window');
const isTV = Platform.isTV || width > 1000;

export default function SeriesScreen() {
  const [subcategories, setSubcategories] = useState<SubcategoryData[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [seriesItems, setSeriesItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSeriesData();
  }, []);

  const loadSeriesData = async () => {
    try {
      setLoading(true);
      const categories = await PlaylistService.getAllCategories();
      const seriesCategory = categories.find(cat => cat.name === 'Séries');
      
      if (seriesCategory) {
        const subCatArray = Object.values(seriesCategory.subcategories);
        setSubcategories(subCatArray);
        
        // Se há apenas uma subcategoria, seleciona automaticamente
        if (subCatArray.length === 1) {
          setSelectedSubcategory(subCatArray[0].name);
          setSeriesItems(subCatArray[0].items);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar séries:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSubcategory = (subcategoryName: string) => {
    const subcategory = subcategories.find(sub => sub.name === subcategoryName);
    if (subcategory) {
      setSelectedSubcategory(subcategoryName);
      setSeriesItems(subcategory.items);
    }
  };

  const goBack = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setSeriesItems([]);
    } else {
      router.back();
    }
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <MediaCard item={item} />
  );

  const renderSubcategoryItem = ({ item }: { item: SubcategoryData }) => (
    <TouchableOpacity
      style={styles.subcategoryCard}
      onPress={() => selectSubcategory(item.name)}
    >
      <View style={styles.subcategoryIcon}>
        <Folder size={32} color="#9C27B0" />
      </View>
      <Text style={styles.subcategoryTitle}>{item.name}</Text>
      <Text style={styles.subcategoryCount}>{item.count} séries</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando séries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedSubcategory ? selectedSubcategory : 'Séries'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {!selectedSubcategory ? (
        // Mostrar lista de subcategorias
        <FlatList
          data={subcategories}
          renderItem={renderSubcategoryItem}
          keyExtractor={(item) => item.name}
          numColumns={isTV ? 3 : 2}
          contentContainerStyle={styles.subcategoriesGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma categoria de séries encontrada</Text>
            </View>
          }
        />
      ) : (
        // Mostrar itens da subcategoria selecionada
        <FlatList
          data={seriesItems}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={isTV ? 4 : 2}
          contentContainerStyle={styles.mediaGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma série encontrada nesta categoria</Text>
            </View>
          }
        />
      )}
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 44,
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
  subcategoriesGrid: {
    padding: 20,
    gap: 16,
  },
  subcategoryCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#9C27B0',
  },
  subcategoryIcon: {
    marginBottom: 12,
  },
  subcategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subcategoryCount: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  mediaGrid: {
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
  },
});