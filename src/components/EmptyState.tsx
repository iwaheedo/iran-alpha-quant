'use client';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="bg-white rounded border border-border p-8 text-center">
      <p className="text-xs text-txt-tertiary mb-1">{title}</p>
      <p className="text-[10px] text-txt-tertiary mb-3">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-7 px-4 bg-blue text-white text-[11px] font-medium rounded hover:bg-blue/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
