import type { Meta, StoryObj } from '@storybook/react';
import { ContextChip } from '@distri/react';

const meta: Meta<typeof ContextChip> = {
  title: 'Context/ContextChip',
  component: ContextChip,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof ContextChip>;

/** The composer placement: dial + % label, right-aligned, click opens the breakdown. */
export const ComposerStates: Story = {
  render: () => (
    <div className="flex flex-col items-end gap-3 w-64">
      <ContextChip ratio={0.18} showLabel onClick={() => {}} />
      <ContextChip ratio={0.52} showLabel onClick={() => {}} />
      <ContextChip ratio={0.83} showLabel onClick={() => {}} />
      <ContextChip ratio={0.96} showLabel onClick={() => {}} />
      <ContextChip ratio={0.62} showLabel isCompacting onClick={() => {}} />
    </div>
  ),
};

/** The SubTaskCard placement: 12px dial only, tooltip carries the number. */
export const SubtaskDial: Story = {
  render: () => (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-1.5 text-xs w-96">
      <span className="font-medium">subtask scene-s3</span>
      <span className="text-[10px] text-muted-foreground truncate flex-1 italic">Drafting scenes/s3.tsx…</span>
      <ContextChip ratio={0.44} size={12} className="opacity-70" />
      <span className="text-[10px] text-muted-foreground">running…</span>
    </div>
  ),
};
