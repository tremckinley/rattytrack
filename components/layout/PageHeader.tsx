import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
}

export default function PageHeader({ title, description, actionButton }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 border-b-2 border-foreground pb-4 mb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {actionButton && <div>{actionButton}</div>}
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
