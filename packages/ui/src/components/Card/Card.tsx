import React from 'react';

export type CardVariant = 'flat' | 'raised' | 'inset';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  as?: 'div' | 'article' | 'section';
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4' | 'span';
}

export type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-space-4 border-b border-border flex items-center justify-between gap-space-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Component = 'h3', className = '', children, ...props }, ref) => (
    <Component
      ref={ref}
      className={`text-title font-medium text-fg ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`p-space-4 text-body text-fg ${className}`} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = 'CardBody';

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`p-space-4 border-t border-border bg-surface/50 rounded-b-md flex items-center gap-space-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

type CardComponent = React.ForwardRefExoticComponent<
  CardProps & React.RefAttributes<HTMLDivElement>
> & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'flat', as: Component = 'div', className = '', children, ...props }, ref) => {
    const variants: Record<CardVariant, string> = {
      flat: 'bg-surface-solid border border-border shadow-none',
      raised: 'bg-surface-solid border border-border shadow-md',
      inset: 'bg-surface border border-border-strong shadow-none',
    };

    return (
      <Component
        ref={ref}
        className={`rounded-md overflow-hidden transition-shadow ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
) as CardComponent;

Card.displayName = 'Card';
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;
