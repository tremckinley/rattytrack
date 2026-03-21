import React from 'react';
import PageHeader from './PageHeader';

interface PageContainerProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageContainer({ title, description, actionButton, children }: PageContainerProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <PageHeader title={title} description={description} actionButton={actionButton} />
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
