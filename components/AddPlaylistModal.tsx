import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Link, FileText, File } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PlaylistService } from '@/services/PlaylistService';

interface AddPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPlaylistModal({ visible, onClose, onSuccess }: AddPlaylistModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'url' | 'text' | 'file'>('url');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setUrl('');
    setContent('');
    setFileName('');
    setMode('url');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const playlistName = name.trim() || `Playlist ${new Date().toLocaleDateString()}`;

    if (mode === 'url' && !url.trim()) {
      Alert.alert('Erro', 'Digite uma URL válida');
      return;
    }

    if (mode === 'text' && !content.trim()) {
      Alert.alert('Erro', 'Cole o conteúdo da playlist');
      return;
    }

    if (mode === 'file' && !content.trim()) {
      Alert.alert('Erro', 'Selecione um arquivo M3U válido');
      return;
    }

    try {
      setLoading(true);
      console.log('AddPlaylistModal: Enviando. Modo:', mode, 'Nome:', playlistName, 'Tamanho da URL:', url.length, 'Tamanho do conteúdo:', content.length);
      
      let playlistContent = content;
      
      if (mode === 'url') {
        playlistContent = await PlaylistService.fetchPlaylistFromUrl(url);
        console.log('AddPlaylistModal: Conteúdo da playlist buscado (tamanho):', playlistContent.length);
      }

      console.log('AddPlaylistModal: Chamando PlaylistService.addPlaylist com nome:', playlistName, 'e tamanho do conteúdo:', playlistContent.length);
      await PlaylistService.addPlaylist(playlistName, playlistContent, mode === 'url' ? url : undefined);
      
      Alert.alert('Sucesso', 'Playlist adicionada com sucesso!', [
        { text: 'OK', onPress: () => {
          handleClose();
          onSuccess();
        }}
      ]);
      
    } catch (error) {
      console.error('AddPlaylistModal: Erro durante o envio:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao adicionar playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Arquivo selecionado:', file.name, 'URI:', file.uri);
        
        // Verificar se é um arquivo M3U
        if (!file.name.toLowerCase().endsWith('.m3u') && !file.name.toLowerCase().endsWith('.m3u8')) {
          Alert.alert('Erro', 'Por favor, selecione um arquivo M3U ou M3U8');
          return;
        }

        // Ler o conteúdo do arquivo com base na plataforma
        let fileContent: string;
        
        if (Platform.OS === 'web') {
          // Para web, usar FileReader API
          const response = await fetch(file.uri);
          fileContent = await response.text();
        } else {
          // Para iOS/Android, usar expo-file-system
          fileContent = await FileSystem.readAsStringAsync(file.uri);
        }
        
        console.log('Conteúdo do arquivo lido (tamanho):', fileContent.length);
        
        setContent(fileContent);
        setFileName(file.name);
      }
    } catch (error) {
      console.error('Erro ao selecionar arquivo:', error);
      Alert.alert('Erro', 'Não foi possível ler o arquivo selecionado');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Adicionar Playlist</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome da playlist (opcional)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Minha Lista IPTV..."
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'url' && styles.modeButtonActive]}
              onPress={() => setMode('url')}
            >
              <Link size={20} color={mode === 'url' ? '#FFF' : '#888'} />
              <Text style={[styles.modeText, mode === 'url' && styles.modeTextActive]}>
                URL
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, mode === 'text' && styles.modeButtonActive]}
              onPress={() => setMode('text')}
            >
              <FileText size={20} color={mode === 'text' ? '#FFF' : '#888'} />
              <Text style={[styles.modeText, mode === 'text' && styles.modeTextActive]}>
                Texto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, mode === 'file' && styles.modeButtonActive]}
              onPress={() => setMode('file')}
            >
              <File size={20} color={mode === 'file' ? '#FFF' : '#888'} />
              <Text style={[styles.modeText, mode === 'file' && styles.modeTextActive]}>
                Arquivo
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'url' ? (
            <View style={styles.field}>
              <Text style={styles.label}>URL da playlist M3U/M3U8</Text>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://exemplo.com/playlist.m3u"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          ) : mode === 'text' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Conteúdo da playlist</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="#EXTINF:-1 tvg-name=&quot;Canal&quot;,Canal de TV&#10;http://exemplo.com/stream.m3u8"
                placeholderTextColor="#666"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>Arquivo M3U/M3U8</Text>
              <TouchableOpacity style={styles.filePickerButton} onPress={handleFilePick}>
                <File size={20} color="#FF6B35" />
                <Text style={styles.filePickerText}>
                  {fileName ? fileName : 'Selecionar arquivo M3U'}
                </Text>
              </TouchableOpacity>
              {fileName && (
                <Text style={styles.fileSelectedText}>
                  Arquivo selecionado: {fileName}
                </Text>
              )}
            </View>
          )}

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Formatos suportados:</Text>
            <Text style={styles.helpText}>
              • Arquivos M3U e M3U8{'\n'}
              • Categorização automática em TV, Filmes e Séries{'\n'}
              • Importação via URL, texto ou arquivo{'\n'}
              • Reconhecimento inteligente de categorias{'\n'}
              • Suporte completo a tags #EXTINF
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Carregando...' : 'Adicionar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  modeTextActive: {
    color: '#FFF',
  },
  helpSection: {
    backgroundColor: '#1F1F1F',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filePickerText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  fileSelectedText: {
    color: '#FF6B35',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
});