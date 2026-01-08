import React from 'react';
import type { ChatEmptyStateController } from './Chat';
import { Button } from './ui/button';

export interface ChatEmptyStateStarter {
  id?: string;
  /** Display label for the starter button */
  label: string;
  /** The prompt text to send (defaults to label if not provided) */
  prompt?: string;
  /** Optional description shown below the label */
  description?: string;
  /** Whether to auto-send when clicked (defaults to true) */
  autoSend?: boolean;
  /** Optional icon/emoji to display before the label */
  icon?: string;
  /** Optional variant for different styling */
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ChatEmptyStateCategory {
  id: string;
  title?: string;
  description?: string;
  /** Icon for the category header */
  icon?: string;
  starters?: ChatEmptyStateStarter[];
  /** Layout for starters: 'list' (default) or 'grid' */
  layout?: 'list' | 'grid';
}

export interface ChatEmptyStateOptions {
  eyebrow?: string;
  description?: string;
  promptPlaceholder?: string;
  promptHelperText?: string;
  categoriesLabel?: string;
  startersLabel?: string;
  categories?: ChatEmptyStateCategory[];
  autoSendOnStarterClick?: boolean;
  /** Default layout for all categories: 'list' (default) or 'grid' */
  layout?: 'list' | 'grid';
}

interface DefaultChatEmptyStateProps {
  controller: ChatEmptyStateController;
  options?: ChatEmptyStateOptions;
  maxWidth?: string;
}

export const DefaultChatEmptyState: React.FC<DefaultChatEmptyStateProps> = ({ controller, options, maxWidth }) => {
  const disabled = controller.isLoading || controller.isStreaming;
  const categories = options?.categories ?? [];
  const defaultLayout = options?.layout ?? 'list';

  const handleStarterClick = (starter: ChatEmptyStateStarter) => {
    const prompt = starter.prompt ?? starter.label;
    console.log('[ChatEmptyState] Starter clicked:', { label: starter.label, prompt, autoSend: starter.autoSend });

    controller.setInput(prompt);

    const shouldSubmit = starter.autoSend ?? options?.autoSendOnStarterClick ?? true;
    console.log('[ChatEmptyState] Should submit:', shouldSubmit);

    if (!shouldSubmit) {
      return;
    }

    console.log('[ChatEmptyState] Submitting prompt:', prompt);
    void controller.submit(prompt).catch((err) => {
      console.error('[ChatEmptyState] Submit error:', err);
    });
  };

  const renderStarter = (starter: ChatEmptyStateStarter, layout: 'list' | 'grid') => {
    const variant = starter.variant ?? 'outline';
    const isGrid = layout === 'grid';

    return (
      <Button
        key={starter.id ?? starter.label}
        type="button"
        variant={variant}
        size="sm"
        className={`h-auto whitespace-normal rounded-lg border-border/50 bg-background text-left text-sm font-normal hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer select-none ${
          isGrid
            ? 'flex-col items-center justify-center p-4 gap-2'
            : 'justify-start px-3 py-3'
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleStarterClick(starter);
        }}
        disabled={disabled}
      >
        {starter.icon && (
          <span className={`text-lg ${isGrid ? '' : 'mr-2'}`}>{starter.icon}</span>
        )}
        <span className={`flex flex-col ${isGrid ? 'items-center text-center' : 'items-start'} gap-1`}>
          <span className="font-medium text-foreground">
            {starter.label}
          </span>
          {starter.description ? (
            <span className="text-xs text-muted-foreground">
              {starter.description}
            </span>
          ) : null}
        </span>
      </Button>
    );
  };

  return (
    <div className="py-4 sm:py-8">
      <div
        className="mx-auto w-full px-2"
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="">
          <div className="flex flex-col gap-6">

            {controller.composer ? (
              <div className="flex flex-col gap-2">
                {controller.composer}
                {options?.promptHelperText ? (
                  <p className="text-xs text-muted-foreground text-center sm:text-left">
                    {options.promptHelperText}
                  </p>
                ) : null}
              </div>
            ) : null}

            {categories.length > 0 ? (
              <div className="space-y-1 p-1">
                {options?.categoriesLabel ? (
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {options.categoriesLabel}
                  </p>
                ) : null}
                {options?.startersLabel ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    {options.startersLabel}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3">
                  {categories.map((category) => {
                    const categoryLayout = category.layout ?? defaultLayout;
                    return (
                      <div
                        key={category.id}
                        className="bg-background/70 p-1 sm:p-4"
                      >
                        {(category.title || category.description || category.icon) ? (
                          <div className="flex items-start gap-2 mb-3">
                            {category.icon && (
                              <span className="text-xl">{category.icon}</span>
                            )}
                            <div className="flex flex-col gap-1">
                              {category.title ? (
                                <h3 className="text-xs font-semibold text-foreground">
                                  {category.title}
                                </h3>
                              ) : null}
                              {category.description ? (
                                <p className="text-xs text-muted-foreground">
                                  {category.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {category.starters && category.starters.length > 0 ? (
                          <div className={
                            categoryLayout === 'grid'
                              ? 'grid grid-cols-2 sm:grid-cols-3 gap-2'
                              : 'flex flex-col gap-2'
                          }>
                            {category.starters.map((starter) => renderStarter(starter, categoryLayout))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultChatEmptyState;
