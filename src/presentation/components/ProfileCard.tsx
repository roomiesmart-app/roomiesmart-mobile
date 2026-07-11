import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export interface ProfileData {
  id: string;
  name: string;
  subtitle: string;
  affinityScore: number;
  habits: string[];
  bio: string;
  budget: number;
  imageUrl: string;
}

interface ProfileCardProps {
  profile: ProfileData;
  onMessage?: (profile: ProfileData) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onMessage }) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: profile.imageUrl }} style={styles.image} />
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{profile.affinityScore}%</Text>
        </View>
        <View style={styles.overlayTextContainer}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{profile.subtitle}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.habitsContainer}>
          {profile.habits.map((habit, idx) => (
            <View key={idx} style={styles.habitBadge}>
              <Text style={styles.habitText}>{habit}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
        <View style={styles.footer}>
          <Text style={styles.budget}>💵 ${profile.budget}/mes</Text>
          <TouchableOpacity style={styles.button} onPress={() => onMessage?.(profile)}>
            <Text style={styles.buttonText}>Mensaje</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F2E3DB',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
    backgroundColor: '#eee',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  overlayTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: '#f0f0f0',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoContainer: {
    padding: 20,
  },
  habitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  habitBadge: {
    backgroundColor: '#FDF0EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 6,
    marginRight: 6,
  },
  habitText: {
    color: '#8C3A27',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bio: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  budget: {
    color: '#8C3A27',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#8C3A27',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
