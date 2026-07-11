import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MatchmakingRepository } from '../../infrastructure/MatchmakingRepository';
import { getSession, clearSession, UserSession } from '../../core/session';
import { ProfileCard, ProfileData } from '../components/ProfileCard';
import { FilterModal, MatchmakingFilters } from '../components/FilterModal';

export const DashboardScreen = ({ navigation }: any) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [naturalProfiles, setNaturalProfiles] = useState<ProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileData[]>([]);
  const [loadingNatural, setLoadingNatural] = useState(true);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (!user) {
        navigation.replace('Login');
        return;
      }
      setSession(user);
      loadNaturalMatches(user.id);
    };
    init();
  }, []);

  const formatProfiles = (data: any[]): ProfileData[] => {
    if (!Array.isArray(data)) return [];

    return data.map((match: any) => {
      const c = match?.candidate || match?.profile || match;
      const rawMoney = c?.budget?.max || c?.budget?.min || c?.budget || c?.monthlyBudget || c?.preferences?.financial?.budgetRange?.max || c?.preferences?.financial?.budgetRange?.min || 180;
      const cleanBudget = typeof rawMoney === 'object' ? rawMoney.max || rawMoney.min || 180 : Number(rawMoney);
      const isEarly = c?.isEarlyBird ?? c?.habits?.isEarlyBird ?? c?.preferences?.lifestyle?.isEarlyBird ?? true;
      const smokeText = c?.smokingPreference || c?.habits?.smokingPreference || c?.preferences?.social?.smokingPreference || 'No fumo';

      return {
        id: c?.id || Math.random().toString(),
        name: c?.fullName || c?.name || 'Estudiante UCE',
        subtitle: c?.roomType || c?.preferences?.financial?.roomType || 'Privada',
        affinityScore: Number(match?.compatibilityScore ?? match?.affinityScore ?? 75),
        habits: [isEarly ? 'Madrugador' : 'Noctámbulo', smokeText.toLowerCase().includes('no') ? 'No fumo' : 'Fumador'],
        bio: match?.aiExplanation || match?.bio || 'Estudiante afín según algoritmo de convivencia.',
        budget: isNaN(cleanBudget) ? 180 : cleanBudget,
        imageUrl: c?.imageUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(c?.fullName || c?.name || 'default')}&size=200`,
      };
    });
  };

  const loadNaturalMatches = async (userId: string) => {
    setLoadingNatural(true);
    try {
      const response = await MatchmakingRepository.getProfiles({ userId, filters: {} });
      setNaturalProfiles(formatProfiles(response));
    } catch (error) {
      console.error('Error cargando matches naturales', error);
    } finally {
      setLoadingNatural(false);
    }
  };

  const handleApplyFilters = async (filters: MatchmakingFilters) => {
    if (!session) return;
    setLoadingFiltered(true);
    setHasSearched(true);
    try {
      const response = await MatchmakingRepository.getProfiles({ userId: session.id, filters });
      setFilteredProfiles(formatProfiles(response));
    } catch (error) {
      console.error('Error aplicando filtros', error);
    } finally {
      setLoadingFiltered(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    navigation.replace('Login');
  };

  const openChat = (profile: ProfileData) => {
    if (!session) return;
    if (profile.id === session.id) {
      console.log("No puedes enviarte mensajes a ti mismo.");
      return;
    }
    navigation.navigate('Chat', {
      targetUserId: profile.id,
      targetName: profile.name,
      currentUserId: session.id
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hola, {session?.name?.split(' ')[0]}</Text>
          <Text style={styles.headerSubtitle}>Encuentra tu roomie ideal</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
            <Text style={styles.filterBtnText}>🔍 Buscar con Filtros</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matchmaking Ideal</Text>
          <Text style={styles.sectionSubtitle}>Afinidad calculada por IA</Text>

          {loadingNatural ? (
            <ActivityIndicator size="large" color="#8C3A27" style={{ marginTop: 20 }} />
          ) : naturalProfiles.length === 0 ? (
            <Text style={styles.emptyText}>No hay sugerencias en este momento.</Text>
          ) : (
            naturalProfiles.map((p) => (
              <ProfileCard key={`nat-${p.id}`} profile={p} onMessage={openChat} />
            ))
          )}
        </View>

        {hasSearched && (
          <View style={[styles.section, styles.borderTop]}>
            <Text style={styles.sectionTitle}>Resultados de Búsqueda</Text>
            <Text style={styles.sectionSubtitle}>Candidatos filtrados manualmente</Text>

            {loadingFiltered ? (
              <ActivityIndicator size="large" color="#8C3A27" style={{ marginTop: 20 }} />
            ) : filteredProfiles.length === 0 ? (
              <Text style={styles.emptyText}>Ningún roomie cumple con todos los filtros.</Text>
            ) : (
              filteredProfiles.map((p) => (
                <ProfileCard key={`filt-${p.id}`} profile={p} onMessage={openChat} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#827471',
  },
  logoutBtn: {
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutBtnText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    marginBottom: 30,
  },
  filterBtn: {
    backgroundColor: '#8C3A27',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8C3A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#E5D1C6',
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#827471',
    marginBottom: 20,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
