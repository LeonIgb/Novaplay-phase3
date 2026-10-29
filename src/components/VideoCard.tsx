import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoItem } from '../types';
import { colors, radius, spacing } from '../theme/colors';
import { formatSize, formatTime } from '../utils/format';

type Props = {
  video: VideoItem;
  variant?: 'large' | 'row';
  active?: boolean;
  onPress: () => void;
};

export default function VideoCard({ video, variant = 'large', active, onPress }: Props) {
  const isRow = variant === 'row';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.title}`}
      style={({ pressed }) => [isRow ? styles.row : styles.large, { opacity: pressed ? 0.8 : 1 }]}
    >
      {/* PLACEHOLDER thumbnail: real frame thumbnails are not connected yet */}
      <View style={[styles.thumb, isRow ? styles.thumbRow : styles.thumbLarge, { backgroundColor: video.tint }, active && styles.thumbActive]}>
        <Ionicons name="play-circle-outline" size={isRow ? 30 : 44} color="rgba(248,250,252,0.55)" />
        {video.durationSec ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatTime(video.durationSec)}</Text>
          </View>
        ) : null}
      </View>
      <View style={isRow ? styles.metaRow : styles.metaLarge}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {video.folder} · {formatSize(video.sizeMb)} · {video.addedLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  large: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  thumb: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbActive: { borderWidth: 2, borderColor: colors.primary },
  thumbLarge: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
  thumbRow: { width: 150, aspectRatio: 16 / 9, borderRadius: radius.sm },
  badge: { position: 'absolute', right: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  metaLarge: { paddingTop: spacing.sm, paddingHorizontal: 2 },
  metaRow: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  sub: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
});
