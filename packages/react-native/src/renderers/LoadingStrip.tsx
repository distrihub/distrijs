import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DistriNativeTheme, useDistriTheme } from '../theme';

export const DEFAULT_LOADING_WORDS = [
  'Thinking…',
  'Working on it…',
  'Let me check…',
  'Almost there…',
  'Just a moment…',
];

export interface LoadingStripProps {
  words?: string[];
}

/** Three pulsing dots and a cycling word, shown while the agent works (the web chat's `LoadingStrip`). */
export function LoadingStrip({ words = DEFAULT_LOADING_WORDS }: LoadingStripProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(value => value + 1), 400);
    return () => clearInterval(interval);
  }, []);

  const word = words.length ? words[Math.floor((tick * 400) / 2500) % words.length] : undefined;
  return (
    <View accessibilityLabel="Assistant is responding" style={[styles.strip, theme.styles.loadingStrip]}>
      <View style={styles.dots}>
        {[0, 1, 2].map(index => <View key={index} style={[styles.dot, tick % 3 === index && styles.dotActive]} />)}
      </View>
      {word ? <Text style={styles.word}>{word}</Text> : null}
    </View>
  );
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    strip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
    dots: { flexDirection: 'row', gap: 4 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.accent, opacity: 0.35 },
    dotActive: { opacity: 1 },
    word: { color: theme.colors.mutedText, fontSize: theme.fontSizes.small, fontFamily: theme.fonts.body },
  });
}
