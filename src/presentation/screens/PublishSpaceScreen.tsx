import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { SpaceRepository } from '../../infrastructure/SpaceRepository';
import { CatalogRepository } from '../../infrastructure/CatalogRepository';
import { getSession } from '../../core/session';

export const PublishSpaceScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cityId, setCityId] = useState<string | null>(null);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    const loadCity = async () => {
      try {
        const cities = await CatalogRepository.getCities();
        const quito = cities.find(c => c.name.toLowerCase() === 'quito');
        setCityId((quito || cities[0])?.id ?? null);
      } catch (error) {
        console.error('Error cargando ciudades', error);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCity();
  }, []);

  const pickImage = async () => {
    if (photos.length >= 3) {
      Alert.alert('Límite', 'Solo puedes subir hasta 3 fotos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      // base64: true, // Si se necesitara base64
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !price || !neighborhood) {
      Alert.alert('Error', 'Por favor llena todos los campos obligatorios.');
      return;
    }
    if (!cityId) {
      Alert.alert('Error', 'No se pudo cargar la ciudad. Intenta de nuevo en un momento.');
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      if (!session) throw new Error('No hay sesión activa.');

      // Nota: En producción, deberías subir `photos` a un Storage (Supabase) 
      // y enviar las URLs públicas generadas al backend.
      // Para este demo, usaremos un placeholder genérico o la URI local.
      let uploadedPhotoUrls = [...photos];
      const defaultPhotos = [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1502672260266-1c1f5523a5b3?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=600'
      ];
      while (uploadedPhotoUrls.length < 5) {
        uploadedPhotoUrls.push(defaultPhotos[uploadedPhotoUrls.length % 5]);
      }

      const payload = {
        title,
        description,
        monthlyPrice: parseFloat(price),
        neighborhood,
        cityId,
        locationAddress: neighborhood, // Simplificado
        spaceType: 'Habitación compartida', // Simplificado
        ownerId: session.id,
        images: uploadedPhotoUrls,
        commonAreas: ['Cocina', 'Sala'],
        amenities: ['Wi-Fi'],
        status: 'published'
      };

      await SpaceRepository.publishSpace(payload);

      Alert.alert('Éxito', '¡Tu espacio ha sido publicado correctamente!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
      // Reset
      setTitle(''); setDescription(''); setPrice(''); setNeighborhood(''); setPhotos([]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo publicar el espacio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Publicar Espacio</Text>
        <Text style={styles.headerTitle}>Sube tu departamento o habitación</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Título del espacio *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Habitación amoblada cerca a la UCE"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe las reglas, el ambiente, etc."
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Precio Mensual ($) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 150"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>Barrio/Sector *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: La Gasca"
            value={neighborhood}
            onChangeText={setNeighborhood}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Fotos del Espacio ({photos.length}/3)</Text>
        <ScrollView horizontal style={styles.photoContainer} showsHorizontalScrollIndicator={false}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 3 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
              <Text style={styles.addPhotoIcon}>+</Text>
              <Text style={styles.addPhotoText}>Añadir</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (loading || loadingCities) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading || loadingCities}
      >
        {loading || loadingCities ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Publicar Espacio</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A3513D',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#3B241C',
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B241C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5D1C6',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoContainer: {
    flexDirection: 'row',
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#E5D1C6',
    borderStyle: 'dashed',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF2ED',
    marginRight: 10,
  },
  addPhotoIcon: {
    fontSize: 30,
    color: '#8C3A27',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#8C3A27',
    fontWeight: 'bold',
  },
  photoWrapper: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#8C3A27',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#8C3A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
