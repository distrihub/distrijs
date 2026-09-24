import { ReactNode, useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { DistriNativeTheme, useDistriTheme } from './theme';

export type MarkdownBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'rule' };

/** Line-based parser for the Markdown agents produce; no HTML, tables or nesting. */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = source.replace(/\r/g, '').split('\n');
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join(' ').trim() });
    if (list) blocks.push({ kind: 'list', ...list });
    if (quote.length) blocks.push({ kind: 'quote', text: quote.join(' ').trim() });
    paragraph = [];
    list = null;
    quote = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('```')) {
      flush();
      const code: string[] = [];
      for (i += 1; i < lines.length && !lines[i].trim().startsWith('```'); i++) code.push(lines[i]);
      blocks.push({ kind: 'code', text: code.join('\n') });
      continue;
    }
    if (!line) { flush(); continue; }
    if (/^([-*_])(\s*\1){2,}$/.test(line)) { flush(); blocks.push({ kind: 'rule' }); continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) { flush(); blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() }); continue; }
    const item = line.match(/^(?:([-*+])|(\d+)[.)])\s+(.+)$/);
    if (item) {
      const ordered = Boolean(item[2]);
      if (paragraph.length || quote.length || (list && list.ordered !== ordered)) flush();
      list = list ?? { ordered, items: [] };
      list.items.push(item[3]);
      continue;
    }
    const quoted = line.match(/^>\s?(.*)$/);
    if (quoted) {
      if (paragraph.length || list) flush();
      quote.push(quoted[1]);
      continue;
    }
    if (list && lines[i].startsWith('  ')) { list.items[list.items.length - 1] += ` ${line}`; continue; }
    if (list || quote.length) flush();
    paragraph.push(line);
  }
  flush();
  return blocks;
}

// No lookbehind (not safe on every Hermes build), so `_italic_` is not supported;
// `snake_case` stays literal.
const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g;

function renderInline(text: string, styles: ReturnType<typeof makeStyles>): ReactNode[] {
  return text.split(INLINE).filter(part => part !== '').map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <Text key={index} style={styles.bold}>{renderInline(part.slice(2, -2), styles)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) return <Text key={index} style={styles.code}>{part.slice(1, -1)}</Text>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      return (
        <Text key={index} style={styles.link} accessibilityRole="link" onPress={() => { void Linking.openURL(link[2]); }}>
          {link[1]}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <Text key={index} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    return part;
  });
}

export interface MarkdownProps {
  children: string;
  /** Merged into every text run, e.g. a bubble's text colour. */
  textStyle?: StyleProp<TextStyle>;
}

export function Markdown({ children, textStyle }: MarkdownProps) {
  const theme = useDistriTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const blocks = useMemo(() => parseMarkdown(children), [children]);

  return (
    <View style={styles.root}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return <Text key={index} accessibilityRole="header" style={[styles.text, textStyle, styles.heading]}>{renderInline(block.text, styles)}</Text>;
          case 'list':
            return (
              <View key={index} style={styles.list}>
                {block.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.listItem}>
                    <Text style={[styles.text, textStyle, styles.marker]}>{block.ordered ? `${itemIndex + 1}.` : '•'}</Text>
                    <Text style={[styles.text, textStyle, styles.listText]}>{renderInline(item, styles)}</Text>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            return <View key={index} style={styles.quote}><Text style={[styles.text, textStyle, styles.quoteText]}>{renderInline(block.text, styles)}</Text></View>;
          case 'code':
            return <View key={index} style={styles.codeBlock}><Text selectable style={styles.codeBlockText}>{block.text}</Text></View>;
          case 'rule':
            return <View key={index} style={styles.rule} />;
          default:
            return <Text key={index} style={[styles.text, textStyle]}>{renderInline(block.text, styles)}</Text>;
        }
      })}
    </View>
  );
}

function makeStyles(theme: DistriNativeTheme) {
  return StyleSheet.create({
    root: { gap: 8 },
    text: { color: theme.colors.text, fontSize: theme.fontSizes.body, lineHeight: theme.lineHeight, fontFamily: theme.fonts.body },
    heading: { fontSize: theme.fontSizes.heading, fontFamily: theme.fonts.heading ?? theme.fonts.body, fontWeight: '700', marginTop: 2 },
    bold: { fontWeight: '700' },
    italic: { fontStyle: 'italic' },
    code: { fontFamily: theme.fonts.mono, backgroundColor: theme.colors.codeBackground },
    link: { color: theme.colors.accent, textDecorationLine: 'underline' },
    list: { gap: 4 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    marker: { minWidth: 16, color: theme.colors.accent, fontWeight: '700' },
    listText: { flex: 1 },
    quote: { borderLeftWidth: 3, borderLeftColor: theme.colors.border, paddingLeft: 10 },
    quoteText: { color: theme.colors.mutedText },
    codeBlock: { borderRadius: 8, padding: 10, backgroundColor: theme.colors.codeBackground },
    codeBlockText: { fontFamily: theme.fonts.mono, fontSize: theme.fontSizes.small, lineHeight: theme.fontSizes.small * 1.5, color: theme.colors.text },
    rule: { height: 1, backgroundColor: theme.colors.border },
  });
}
