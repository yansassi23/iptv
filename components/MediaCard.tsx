import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MediaItem } from '@/types/media';
import { PlayerService } from '@/services/PlayerService';

const { width } = Dimensions.get('window');
const isTV = Platform.isTV || width > 1000;
const cardWidth = isTV ? (width - 80) / 4 - 16 : (width - 60) / 2 - 8;

interface MediaCardProps {
  item: MediaItem;
}

export function MediaCard({ item }: MediaCardProps) {
  const router = useRouter();

  const handlePress = async () => {
    await PlayerService.setCurrentMedia(item);
    router.push('/player');
  };

  return (
    <TouchableOpacity style={[styles.card, { width: cardWidth }]} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {item.tvgLogo ? (
          <Image
            source={{ uri: item.tvgLogo }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Play size={32} color="#666" />
          </View>
        )}
        <View style={styles.playOverlay}>
          <Play size={20} color="#FFF" />
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {item.subCategory || item.mainCategory}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: cardWidth * 0.6,
    backgroundColor: '#2A2A2A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  category: {
    color: '#888',
    fontSize: 12,
    lineHeight: 16,
  },
});