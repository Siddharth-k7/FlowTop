import React, { useState } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  src?: string;
  alt: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

function getInitials(nameOrAlt: string): string {
  const clean = nameOrAlt.trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  const last = parts[parts.length - 1];
  const firstChar = first[0] ?? '';
  const lastChar = last?.[0] ?? '';
  return (firstChar + lastChar).toUpperCase() || '?';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const displayName = name || alt;
  const initials = getInitials(displayName);

  const sizeClasses: Record<AvatarSize, string> = {
    sm: 'w-space-6 h-space-6 text-caption',
    md: 'w-touch h-touch text-small',
    lg: 'w-space-7 h-space-7 text-body',
    xl: 'w-space-8 h-space-8 text-title',
  };

  const shapeClass = shape === 'circle' ? 'rounded-pill' : 'rounded-md';

  const showImage = src && !hasError;

  return (
    <div
      className={[
        'relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none',
        sizeClasses[size],
        shapeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          role="img"
          aria-label={displayName}
          className="w-full h-full flex items-center justify-center bg-purple-pale text-purple-deep font-semibold"
        >
          {initials}
        </span>
      )}
    </div>
  );
};
