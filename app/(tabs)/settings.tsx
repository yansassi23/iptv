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
} from 'lucide-react-native';
import { PlaylistService } from '@/services/PlaylistService';

export default function SettingsScreen() {
  const [storageInfo, setStorageInfo] = useState({
    totalPlaylists: 0,
    totalItems: 0,
  });

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
             loadStorageInfo(); // Recarrega as informações após limpar
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
        <Text style={styles.title}>Configurações</Text>
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
              • Toque no botão "+" na tela inicial{'\n'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
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