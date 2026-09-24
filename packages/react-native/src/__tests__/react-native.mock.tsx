import { ReactNode } from 'react';

type NativeProps = {
  children?: ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityState?: { disabled?: boolean };
  disabled?: boolean;
  onPress?: () => void;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  data?: unknown[];
  renderItem?: (info: { item: unknown; index: number }) => ReactNode;
  keyExtractor?: (item: unknown, index: number) => string;
  style?: unknown;
  [key: string]: unknown;
};

export const View = ({ children, accessibilityLabel }: NativeProps) => <div aria-label={accessibilityLabel}>{children}</div>;
export const Text = ({ children, accessibilityRole, onPress }: NativeProps) => (
  <span role={accessibilityRole === 'alert' ? 'alert' : undefined} onClick={onPress}>{children}</span>
);
export const TextInput = ({
  value,
  onChangeText,
  editable,
  multiline,
  accessibilityLabel,
  placeholder,
}: NativeProps) => (
  <textarea
    aria-label={accessibilityLabel}
    placeholder={placeholder as string | undefined}
    disabled={editable === false}
    value={String(value ?? '')}
    onChange={event => onChangeText?.(event.currentTarget.value)}
    data-multiline={Boolean(multiline)}
  />
);
export const Pressable = ({
  children,
  accessibilityLabel,
  disabled,
  onPress,
}: NativeProps) => (
  <button type="button" aria-label={accessibilityLabel} disabled={disabled} onClick={onPress}>{children}</button>
);
export const ActivityIndicator = ({ accessibilityLabel }: NativeProps) => (
  <div aria-label={accessibilityLabel} />
);
export const Image = ({ accessibilityLabel, source }: NativeProps) => (
  <img alt={accessibilityLabel as string | undefined} src={(source as { uri?: string } | undefined)?.uri} />
);
export const Linking = { openURL: (..._args: unknown[]) => Promise.resolve() };
export const FlatList = ({ data = [], renderItem, keyExtractor, accessibilityLabel, ListHeaderComponent, ListFooterComponent, ListEmptyComponent }: NativeProps) => (
  <div aria-label={accessibilityLabel}>
    {ListHeaderComponent as ReactNode}
    {data.map((item, index) => (
      <div key={keyExtractor?.(item, index)}>
        {renderItem?.({ item, index })}
      </div>
    ))}
    {data.length === 0 ? ListEmptyComponent as ReactNode : null}
    {ListFooterComponent as ReactNode}
  </div>
);
export const Modal = ({ visible, children }: NativeProps) => (visible ? <div role="dialog">{children}</div> : null);
export const StyleSheet = Object.assign({ create: <T extends Record<string, unknown>>(styles: T) => styles }, {
  hairlineWidth: 1,
});
export const Platform = {
  OS: 'android',
  select: <T,>(spec: { ios?: T; android?: T; default?: T }): T | undefined => spec.android ?? spec.default,
};
