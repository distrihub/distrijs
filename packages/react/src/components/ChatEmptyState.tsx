import React from 'react';
import type { ChatEmptyStateController } from './Chat';
import { Button } from './ui/button';

export interface ChatEmptyStateStarter {
  id?: string;
  label: string;
  prompt?: string;
  description?: string;
  autoSend?: boolean;
}

export interface ChatEmptyStateCategory {
  id: string;
  title?: string;
  description?: string;
  starters?: ChatEmptyStateStarter[];
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
}

interface DefaultChatEmptyStateProps {
  controller: ChatEmptyStateController;
  options?: ChatEmptyStateOptions;
  maxWidth?: string;
}

export const DefaultChatEmptyState: React.FC<DefaultChatEmptyStateProps> = ({ controller, options, maxWidth }) => {
  const disabled = controller.isLoading || controller.isStreaming;
  const categories = options?.categories ?? [];

  const handleStarterClick = (starter: ChatEmptyStateStarter) => {
    const prompt = starter.prompt ?? starter.label;
    controller.setInput(prompt);

    const shouldSubmit = starter.autoSend ?? options?.autoSendOnStarterClick ?? true;
    if (!shouldSubmit) {
      return;
    }

    void controller.submit(prompt).catch(() => {
      // Errors surface through Chat onError; nothing to do here.
    });
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
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-background/70 p-1 sm:p-4"
                    >
                      {(category.title || category.description) ? (
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
                      ) : null}

                      {category.starters && category.starters.length > 0 ? (
                        <div className="mt-3 flex flex-col gap-2">
                          {category.starters.map((starter) => (
                            <Button
                              key={starter.id ?? starter.label}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-auto justify-start whitespace-normal rounded-lg border-border/50 bg-background px-3 py-3 text-left text-sm font-normal hover:border-primary/40 hover:bg-primary/5"
                              onClick={() => handleStarterClick(starter)}
                              disabled={disabled}
                            >
                              <span className="flex flex-col items-start gap-1">
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
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
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
