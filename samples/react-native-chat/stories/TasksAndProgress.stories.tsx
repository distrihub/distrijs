import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { TaskView } from '@distri/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { makeTaskFixtureAgent } from './demoFixtures';

const meta: Meta<typeof TaskView> = { title: 'Distri Native/Task following', component: TaskView, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof TaskView>;

function TaskProgressStory() {
  const agent = useMemo(makeTaskFixtureAgent, []);
  return <View style={styles.screen}>
    <Text style={styles.intro}>Read-only task following over a deterministic resubscribe stream. Includes a child agent, streamed child/root messages, todos, context usage, and terminal status.</Text>
    <TaskView agent={agent} taskId="research-root" rendering="rich" />
  </View>;
}

export const MultiAgentResearch: Story = { render: () => <TaskProgressStory />, name: 'Multi-agent research · task tree' };

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#f8fafc' }, intro: { padding: 12, color: '#475569', fontSize: 13, lineHeight: 19, backgroundColor: '#eef2ff' } });
