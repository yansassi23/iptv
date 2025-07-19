import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Maximize,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PlayerService } from '@/services/PlayerService';
import { MediaItem } from '@/types/media';

export default function PlayerScreen() {
  const { width, height } = useWindowDimensions();
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Configure audio session
    configureAudio();
    loadCurrentMedia();
    
    const subscription = PlayerService.onMediaChange(loadCurrentMedia);
    return () => subscription();
  }, []);

  const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Erro ao configurar áudio:', error);
    }
  };

  const loadCurrentMedia = async () => {
    const media = await PlayerService.getCurrentMedia();
    setCurrentMedia(media);
    if (media) {
      setError(null);
      setIsLoading(true);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Erro ao controlar reprodução:', error);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Erro ao controlar áudio:', error);
    }
  };

  const toggleFullScreen = async () => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.presentFullscreenPlayer();
    } catch (error) {
      console.error('Erro ao entrar em tela cheia:', error);
    }
  };

  const skipBackward = async () => {
    if (!videoRef.current) return;
    
    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded && status.positionMillis) {
        const newPosition = Math.max(0, status.positionMillis - 10000);
        await videoRef.current.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Erro ao retroceder:', error);
    }
  };

  const skipForward = async () => {
    if (!videoRef.current) return;
    
    try {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded && status.positionMillis && status.durationMillis) {
        const newPosition = Math.min(status.durationMillis, status.positionMillis + 10000);
        await videoRef.current.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Erro ao avançar:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setIsMuted(status.isMuted);
      
      if (status.error) {
        setError('Erro ao reproduzir o vídeo');
      }
    } else if (status.error) {
      setError('Não foi possível carregar o vídeo');
      setIsLoading(false);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const goBack = () => {
    router.back();
  };

  if (!currentMedia) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum conteúdo selecionado</Text>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <ArrowLeft size={20} color="#FFF" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={Platform.OS !== 'web'} />
      
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={showControlsTemporarily}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          style={{ width, height }}
          source={{ uri: currentMedia.url }}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={true}
          isMuted={isMuted}
          volume={isMuted ? 0.0 : 1.0}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                videoRef.current?.replayAsync();
              }}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {showControls && !error && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.backControl} onPress={goBack}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.mediaInfo}>
                <Text style={styles.mediaTitle} numberOfLines={1}>
                  {currentMedia.name}
                </Text>
                <Text style={styles.mediaCategory} numberOfLines={1}>
                  {currentMedia.groupTitle}
                </Text>
              </View>
            </View>
            
            <View style={styles.centerControls}>
              <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
                <SkipBack size={32} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                {isPlaying ? (
                  <Pause size={40} color="#FFF" />
                ) : (
                  <Play size={40} color="#FFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
                <SkipForward size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.volumeButton} onPress={toggleMute}>
                {isMuted ? (
                  <VolumeX size={24} color="#FFF" />
                ) : (
                  <Volume2 size={24} color="#FFF" />
                )}
              </TouchableOpacity>
              
              <View style={styles.spacer} />
              
              <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullScreen}>
                <Maximize size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backControl: {
    marginRight: 16,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mediaCategory: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 4,
  },
  centerControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 35,
    padding: 15,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  volumeButton: {
    padding: 12,
  },
  spacer: {
    flex: 1,
  },
  fullscreenButton: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});