import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Trash2,
  Download,
  Info,
  Database,
  Wifi,
  HardDrive,
  Tv,
  Film,
  Monitor,
  Plus,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PlaylistService } from '@/services/PlaylistService';
import { AddPlaylistModal } from '@/components/AddPlaylistModal';

export default function SettingsScreen() {
  const [storageInfo, setStorageInfo] = useState({
    totalPlaylists: 0,
    totalItems: 0,
  });
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [modalDefaultNamePrefix, setModalDefaultNamePrefix] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const categories = await PlaylistService.getAllCategories();
      const totalItems = categories.reduce((sum, cat) => sum + cat.count, 0);
      setStorageInfo({
        totalPlaylists: categories.length,
        totalItems,
      });
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
    }
  };

  const openAddModal = (categoryPrefix: string) => {
    setModalDefaultNamePrefix(categoryPrefix);
    setIsAddModalVisible(true);
  };

  const clearAllData = () => {
    Alert.alert(
      'Limpar todos os dados',
      'Tem certeza que deseja remover todas as playlists? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await PlaylistService.clearAllData();
              setStorageInfo({ totalPlaylists: 0, totalItems: 0 });
              loadStorageInfo();
              Alert.alert('Sucesso', 'Todos os dados foram removidos.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar os dados.');
            }
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const data = await PlaylistService.exportData();
      Alert.alert(
        'Dados exportados',
        `Total de ${data.length} itens foram preparados para exportação.`
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar os dados.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações de armazenamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Armazenamento</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Database size={20} color="#FF6B35" />
              <Text style={styles.infoLabel}>Total de playlists</Text>
              <Text style={styles.infoValue}>{storageInfo.totalPlaylists}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <HardDrive size={20} color="#FF6B35" />
              <Text style={styles.infoLabel}>Total de itens</Text>
              <Text style={styles.infoValue}>{storageInfo.totalItems}</Text>
            </View>
          </View>
        </View>

        {/* Adicionar por categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionar Playlists</Text>
          
          <TouchableOpacity
            style={styles.categoryAddButton}
            onPress={() => openAddModal('Playlist de TV')}
          >
            <Tv size={20} color="#4CAF50" />
            <Text style={[styles.actionText, { color: '#4CAF50' }]}>
              Adicionar Lista de TV
            </Text>
            <Plus size={16} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.categoryAddButton}
            onPress={() => openAddModal('Playlist de Séries')}
          >
            <Monitor size={20} color="#9C27B0" />
            <Text style={[styles.actionText, { color: '#9C27B0' }]}>
              Adicionar Lista de Séries
            </Text>
            <Plus size={16} color="#9C27B0" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.categoryAddButton}
            onPress={() => openAddModal('Playlist de Filmes')}
          >
            <Film size={20} color="#FF9800" />
            <Text style={[styles.actionText, { color: '#FF9800' }]}>
              Adicionar Lista de Filmes
            </Text>
            <Plus size={16} color="#FF9800" />
          </TouchableOpacity>
        </View>

        {/* Ações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={exportData}>
            <Download size={20} color="#2196F3" />
            <Text style={styles.actionText}>Exportar dados</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={clearAllData}
          >
            <Trash2 size={20} color="#F44336" />
            <Text style={[styles.actionText, styles.dangerText]}>
              Limpar todos os dados
            </Text>
          </TouchableOpacity>
        </View>

        {/* Informações do app */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Info size={20} color="#FF6B35" />
              <Text style={styles.infoLabel}>Versão do app</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Wifi size={20} color="#FF6B35" />
              <Text style={styles.infoLabel}>Suporte M3U/M3U8</Text>
              <Text style={styles.infoValue}>Sim</Text>
            </View>
          </View>
        </View>

        {/* Instruções */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como usar</Text>
          
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Adicionar playlist:</Text>
            <Text style={styles.helpText}>
              • Use os botões de categoria acima ou o "+" na tela inicial{'\n'}
              • Cole sua URL M3U/M3U8 ou o conteúdo da playlist{'\n'}
              • O app irá organizar automaticamente por categorias
            </Text>
            
            <Text style={styles.helpTitle}>Reproduzir conteúdo:</Text>
            <Text style={styles.helpText}>
              • Toque em qualquer item de mídia{'\n'}
              • Use os controles de reprodução{'\n'}
              • Funciona em mobile e TV smart
            </Text>
          </View>
        </View>
      </ScrollView>

      <AddPlaylistModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSuccess={() => {
          loadStorageInfo();
          setIsAddModalVisible(false);
        }}
        defaultNamePrefix={modalDefaultNamePrefix}
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    flex: 1,
    color: '#CCC',
    fontSize: 16,
    marginLeft: 12,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F1F',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#2A1F1F',
  },
  actionText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  dangerText: {
    color: '#F44336',
  },
  helpCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 20,
  },
  helpTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  helpText: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
});