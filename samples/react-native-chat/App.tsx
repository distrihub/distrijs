import { useMemo, useState } from 'react';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chat, DistriNativeProvider, useAgent } from '@distri/react-native';
import StorybookUIRoot from './.rnstorybook';

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_DISTRI_BASE_URL
  ?? (Platform.OS === 'android' ? 'http://10.0.2.2:1341/v1' : 'http://localhost:1341/v1');
const DEFAULT_AGENT_ID = process.env.EXPO_PUBLIC_DISTRI_AGENT_ID ?? '';
const DEFAULT_WORKSPACE_ID = process.env.EXPO_PUBLIC_DISTRI_WORKSPACE_ID ?? '';

function AgentChat({ agentId }: { agentId: string }) {
  const { agent, loading, error } = useAgent({ agentIdOrDef: agentId });
  if (loading) return <Text style={styles.status}>Loading agent…</Text>;
  if (error) return <Text style={styles.error}>{error.message}</Text>;
  if (!agent) return <Text style={styles.status}>Agent not found or unavailable.</Text>;
  return <Chat agent={agent} threadId={`native-${agentId}`} />;
}

function SampleApp() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [agentId, setAgentId] = useState(DEFAULT_AGENT_ID);
  const [workspaceId, setWorkspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [accessToken, setAccessToken] = useState('');
  const [connected, setConnected] = useState(false);
  const config = useMemo(() => ({
    baseUrl: baseUrl.trim().replace(/\/$/, ''),
    accessToken,
    workspaceId: workspaceId.trim(),
    fetchImpl: expoFetch,
    timeout: 30000,
  }), [accessToken, baseUrl, workspaceId]);

  if (connected) {
    return (
      <SafeAreaView style={styles.screen}>
        <DistriNativeProvider config={config}>
          <View style={styles.header}>
            <Text style={styles.title}>Distri · {agentId}</Text>
            <Pressable accessibilityRole="button" onPress={() => setConnected(false)}>
              <Text style={styles.link}>Disconnect</Text>
            </Pressable>
          </View>
          <AgentChat agentId={agentId} />
        </DistriNativeProvider>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.setup}>
        <Text style={styles.title}>Connect to Distri</Text>
        <Text style={styles.help}>Use a short-lived user access token. It stays in memory and is not written to disk.</Text>
        <TextInput value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" placeholder="Distri API URL" style={styles.field} />
        <TextInput value={agentId} onChangeText={setAgentId} autoCapitalize="none" placeholder="Agent ID" style={styles.field} />
        <TextInput value={workspaceId} onChangeText={setWorkspaceId} autoCapitalize="none" placeholder="Workspace ID" style={styles.field} />
        <TextInput
          value={accessToken}
          onChangeText={setAccessToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Short-lived access token"
          style={styles.field}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!baseUrl.trim() || !agentId.trim() || !workspaceId.trim() || !accessToken.trim()}
          onPress={() => setConnected(true)}
          style={({ pressed }) => [styles.connect, pressed && styles.pressed]}
        >
          <Text style={styles.connectText}>Connect</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  setup: { flex: 1, justifyContent: 'center', gap: 14, padding: 24 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { color: '#0f172a', fontSize: 21, fontWeight: '700' },
  help: { color: '#475569', fontSize: 15, lineHeight: 22 },
  field: { minHeight: 48, borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#ffffff' },
  connect: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#1d4ed8' },
  connectText: { color: '#ffffff', fontWeight: '600' },
  pressed: { opacity: 0.8 },
  link: { color: '#1d4ed8', fontWeight: '600' },
  status: { padding: 20, color: '#334155' },
  error: { padding: 20, color: '#b91c1c' },
});

export default function App() {
  if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true') {
    return <StorybookUIRoot />;
  }
  return <SampleApp />;
}
