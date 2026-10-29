import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing, APP_NAME } from '../theme/colors';
import { RootStackParamList } from '../types';
import { useLibrary } from '../state/LibraryContext';
import { formatSize } from '../utils/format';
import IconButton from '../components/IconButton';
import StateView from '../components/StateView';
import VideoCard from '../components/VideoCard';

type Preview = 'normal' | 'loading' | 'error';
type Props = NativeStackScreenProps<RootStackParamList, 'Library'>;

export default function LibraryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const columns = width > height ? 2 : 1;
  const { videos, addVideos } = useLibrary();
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Preview>('normal');

  // Real: opens the system file picker and copies chosen videos into app cache for reliable playback.
  const importVideos = async () => {
    try {
      setImporting(true);
      const res = await DocumentPicker.getDocumentAsync({ type: 'video/*', multiple: true, copyToCacheDirectory: true });
      if (res.canceled) return;
      const added = addVideos(res.assets.map((a) => ({ name: a.name, uri: a.uri, sizeBytes: a.size ?? 0 })));
      if (added === 0) Alert.alert('Already added', 'Those videos are already in your library.');
    } catch (e: any) {
      Alert.alert("Couldn't import videos", e?.message ?? 'Something went wrong while reading the selected files.');
    } finally {
      setImporting(false);
    }
  };

  const notConnected = () => Alert.alert('Not connected yet', 'Search arrives in a later phase.');
  const totalMb = videos.reduce((a, v) => a + v.sizeMb, 0);

  let body: React.ReactNode;
  if (preview === 'loading' || importing) {
    body = <StateView kind="loading" message={importing ? 'Importing videos…' : 'Loading your library…'} />;
  } else if (preview === 'error') {
    body = <StateView kind="error" title="Couldn't load your library" message="Something went wrong while reading your videos." actionLabel="Try again" onAction={() => setPreview('normal')} />;
  } else if (videos.length === 0) {
    body = <StateView kind="empty" title="No videos yet" message="Add videos from your device to start watching offline." actionLabel="Add videos" onAction={importVideos} />;
  } else {
    body = (
      <FlatList
        key={columns}
        data={videos}
        numColumns={columns}
        keyExtractor={(v) => v.id}
        columnWrapperStyle={columns > 1 ? { gap: spacing.lg } : undefined}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        ListHeaderComponent={<Text style={styles.summary}>{videos.length} {videos.length === 1 ? 'video' : 'videos'} · {formatSize(totalMb)}</Text>}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <VideoCard video={item} onPress={() => navigation.navigate('Player', { videoId: item.id })} />
          </View>
        )}
      />
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logoDot} />
          <Text style={styles.brandText}>{APP_NAME}</Text>
        </View>
        <IconButton name="search-outline" label="Search (not connected)" onPress={notConnected} />
        <IconButton name="add-circle-outline" label="Add videos" size={28} color={colors.primary} onPress={importVideos} />
      </View>

      {/* DEV ONLY: preview loading/error layouts. Remove before release. */}
      <View style={styles.devRow}>
        <Text style={styles.devLabel}>Preview state:</Text>
        {(['normal', 'loading', 'error'] as Preview[]).map((s) => (
          <Pressable key={s} onPress={() => setPreview(s)} style={[styles.chip, preview === s && styles.chipOn]}>
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.secondary },
  brandText: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  devLabel: { color: colors.textSecondary, fontSize: 11 },
  chip: { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  chipOn: { borderWidth: 1, borderColor: colors.secondary },
  chipText: { color: colors.secondary, fontSize: 12, fontWeight: '600' },
  summary: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.md },
});
