import * as React from 'react';
import { cn } from '../../lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-6 rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 px-6 pt-6', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p data-slot="card-description" className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

function CardAction({ className, ...props }) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('px-6 pb-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center border-t border-border px-6 py-4', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
