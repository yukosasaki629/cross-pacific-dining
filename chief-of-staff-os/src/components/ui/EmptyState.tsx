export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card card-pad text-center text-ink-500">
      <div className="mx-auto mb-2 text-sm font-semibold text-ink-700">{title}</div>
      {description ? <p className="mx-auto max-w-md text-sm">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
