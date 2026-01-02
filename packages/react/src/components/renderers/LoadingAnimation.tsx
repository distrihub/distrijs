import React from 'react';

export type LoadingAnimationPreset =
  | 'typing-dots'      // Classic bouncing dots (default)
  | 'pulse-ring'       // Pulsing ring animation
  | 'teacher-typing'   // Teacher avatar with typing indicator
  | 'spinner'          // Simple spinner
  | 'wave';            // Wave animation

export interface LoadingAnimationConfig {
  /** Preset animation style */
  preset?: LoadingAnimationPreset;
  /** Custom CSS class for the container */
  className?: string;
  /** Primary color (CSS color value) */
  primaryColor?: string;
  /** Secondary color for gradients (CSS color value) */
  secondaryColor?: string;
  /** Avatar emoji/icon for teacher-typing preset */
  avatar?: string;
  /** Label text shown alongside animation */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export interface LoadingAnimationProps {
  config?: LoadingAnimationConfig;
}

const sizeClasses = {
  sm: { dot: 'h-1.5 w-1.5', container: 'p-2', avatar: 'w-8 h-8 text-base' },
  md: { dot: 'h-2 w-2', container: 'p-3', avatar: 'w-10 h-10 text-lg' },
  lg: { dot: 'h-3 w-3', container: 'p-4', avatar: 'w-12 h-12 text-xl' },
};

/** Classic bouncing dots animation */
const TypingDotsAnimation: React.FC<{ config: LoadingAnimationConfig }> = ({ config }) => {
  const size = config.size || 'md';
  const classes = sizeClasses[size];
  const dotColor = config.primaryColor || 'currentColor';

  return (
    <div className={`flex items-center gap-4 py-3 ${config.className || ''}`}>
      <div className="w-full">
        <div className={`flex items-center space-x-1 ${classes.container} bg-muted/30 rounded-lg w-fit`}>
          <div className="flex space-x-1">
            {[0, 150, 300].map((delay, i) => (
              <div
                key={i}
                className={`${classes.dot} rounded-full animate-bounce`}
                style={{
                  animationDelay: `${delay}ms`,
                  backgroundColor: dotColor === 'currentColor' ? undefined : dotColor,
                }}
              />
            ))}
          </div>
          {config.label && (
            <span className="ml-2 text-sm text-muted-foreground">{config.label}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Pulsing ring animation (like the answer correct animation) */
const PulseRingAnimation: React.FC<{ config: LoadingAnimationConfig }> = ({ config }) => {
  const size = config.size || 'md';
  const sizeMap = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
  const primaryColor = config.primaryColor || '#10B981';
  const secondaryColor = config.secondaryColor || '#34D399';

  return (
    <div className={`flex items-center gap-3 py-3 ${config.className || ''}`}>
      <div className={`${sizeMap[size]} relative flex items-center justify-center`}>
        {/* Inner circle */}
        <div
          className="absolute inset-1 rounded-full animate-pulse"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        />
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ border: `2px solid ${primaryColor}` }}
        />
      </div>
      {config.label && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
};

/** Teacher avatar with typing indicator (like the designs) */
const TeacherTypingAnimation: React.FC<{ config: LoadingAnimationConfig }> = ({ config }) => {
  const size = config.size || 'md';
  const classes = sizeClasses[size];
  const primaryColor = config.primaryColor || '#10B981';
  const secondaryColor = config.secondaryColor || '#34D399';
  const avatar = config.avatar || '🎓';

  return (
    <div className={`flex items-start gap-3 py-3 ${config.className || ''}`}>
      {/* Avatar */}
      <div
        className={`${classes.avatar} rounded-full flex items-center justify-center shrink-0`}
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        {avatar}
      </div>
      {/* Typing indicator */}
      <div className="flex flex-col gap-1">
        {config.label && (
          <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
        )}
        <div className={`flex items-center space-x-1 ${classes.container} bg-muted/50 rounded-2xl w-fit`}>
          <div className="flex space-x-1">
            {[0, 200, 400].map((delay, i) => (
              <div
                key={i}
                className={`${classes.dot} bg-muted-foreground/50 rounded-full`}
                style={{
                  animation: 'typingBounce 1.4s infinite ease-in-out',
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

/** Simple spinner animation */
const SpinnerAnimation: React.FC<{ config: LoadingAnimationConfig }> = ({ config }) => {
  const size = config.size || 'md';
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' };
  const primaryColor = config.primaryColor || 'currentColor';

  return (
    <div className={`flex items-center gap-3 py-3 ${config.className || ''}`}>
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-2 border-muted border-t-current`}
        style={primaryColor !== 'currentColor' ? { borderTopColor: primaryColor } : undefined}
      />
      {config.label && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
};

/** Wave animation */
const WaveAnimation: React.FC<{ config: LoadingAnimationConfig }> = ({ config }) => {
  const size = config.size || 'md';
  const barHeights = { sm: 'h-4', md: 'h-6', lg: 'h-8' };
  const barWidths = { sm: 'w-1', md: 'w-1.5', lg: 'w-2' };
  const primaryColor = config.primaryColor || '#6366F1';

  return (
    <div className={`flex items-center gap-3 py-3 ${config.className || ''}`}>
      <div className="flex items-end gap-1">
        {[0, 100, 200, 300, 400].map((delay, i) => (
          <div
            key={i}
            className={`${barWidths[size]} ${barHeights[size]} rounded-full`}
            style={{
              backgroundColor: primaryColor,
              animation: 'wave 1.2s ease-in-out infinite',
              animationDelay: `${delay}ms`,
            }}
          />
        ))}
      </div>
      {config.label && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

/**
 * LoadingAnimation component that renders various loading indicator styles.
 *
 * @example
 * // Default typing dots
 * <LoadingAnimation />
 *
 * @example
 * // Teacher typing style with avatar
 * <LoadingAnimation config={{ preset: 'teacher-typing', avatar: '🎓', label: 'Teacher is typing...' }} />
 *
 * @example
 * // Custom colored pulse ring
 * <LoadingAnimation config={{ preset: 'pulse-ring', primaryColor: '#6366F1' }} />
 */
export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ config = {} }) => {
  const preset = config.preset || 'typing-dots';

  switch (preset) {
    case 'typing-dots':
      return <TypingDotsAnimation config={config} />;
    case 'pulse-ring':
      return <PulseRingAnimation config={config} />;
    case 'teacher-typing':
      return <TeacherTypingAnimation config={config} />;
    case 'spinner':
      return <SpinnerAnimation config={config} />;
    case 'wave':
      return <WaveAnimation config={config} />;
    default:
      return <TypingDotsAnimation config={config} />;
  }
};

export default LoadingAnimation;
