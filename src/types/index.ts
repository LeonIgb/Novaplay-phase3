export type VideoItem = {
  id: string;
  title: string;
  uri: string; // local file URI (file://...) from the document picker
  sizeMb: number;
  addedLabel: string;
  folder: string;
  tint: string; // placeholder thumbnail color (real thumbnails come later)
  durationSec?: number; // filled in once the player has loaded the video
};

export type RootStackParamList = {
  Library: undefined;
  Player: { videoId: string };
};
