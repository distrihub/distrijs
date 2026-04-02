// packages/react/src/extensions/SlashCommandExtension.ts
import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface SlashCommandOptions {
  onOpen: () => void;
  onClose: () => void;
  onNavigate: (direction: 'up' | 'down') => void;
  onSelect: () => void;
}

const pluginKey = new PluginKey('slashCommand');

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onOpen: () => {},
      onClose: () => {},
      onNavigate: () => {},
      onSelect: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { onOpen, onClose } = this.options;

    return [
      new Plugin({
        key: pluginKey,
        props: {
          handleKeyDown(view, event) {
            const { state } = view;
            const { selection } = state;
            const text = state.doc.textContent;

            // Open palette when '/' is typed at start or after whitespace
            if (event.key === '/') {
              const before = text.slice(0, selection.from - 1);
              if (before.length === 0 || /\s$/.test(before)) {
                setTimeout(onOpen, 0);
              }
              return false;
            }

            // Close on Escape
            if (event.key === 'Escape') {
              onClose();
              return false;
            }

            return false;
          },
        },
      }),
    ];
  },
});
