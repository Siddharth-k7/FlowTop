'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
  icon?: React.ReactNode;
}

export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ destructive = false, icon, className = '', children, disabled, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="menuitem"
        type="button"
        disabled={disabled}
        onClick={onClick}
        tabIndex={-1}
        className={[
          'w-full flex items-center gap-space-3 px-space-3 py-space-2 text-small text-left rounded-sm transition-colors focus-ring touch-target select-none',
          destructive
            ? 'text-error hover:bg-error-tint active:bg-error-tint'
            : 'text-primary hover:bg-surface active:bg-surface-light',
          disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {icon && <span className="shrink-0 text-muted inline-flex items-center" aria-hidden="true">{icon}</span>}
        <span className="flex-1">{children}</span>
      </button>
    );
  }
);
MenuItem.displayName = 'MenuItem';

export const MenuDivider: React.FC = () => (
  <hr className="my-space-1 border-t border-border" role="separator" />
);

export interface MenuProps {
  trigger: React.ReactElement<{
    onClick?: React.MouseEventHandler;
    'aria-haspopup'?: string | boolean;
    'aria-expanded'?: boolean;
    'aria-controls'?: string;
    id?: string;
    ref?: React.Ref<HTMLElement>;
  }>;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({
  trigger,
  children,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const focusedIndexRef = useRef(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const id = useId();
  const triggerId = `${id}-trigger`;
  const menuId = `${id}-menu`;

  // Focus trap / outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const getMenuItems = (): HTMLButtonElement[] => {
    if (!menuRef.current) return [];
    return Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>(
        'button[role="menuitem"]:not([disabled])'
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        focusedIndexRef.current = 0;
      }
      return;
    }

    const items = getMenuItems();
    if (items.length === 0) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown': {
        e.preventDefault();
        const next = (focusedIndexRef.current + 1) % items.length;
        focusedIndexRef.current = next;
        items[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = (focusedIndexRef.current - 1 + items.length) % items.length;
        focusedIndexRef.current = prev;
        items[prev]?.focus();
        break;
      }
      case 'Home':
        e.preventDefault();
        focusedIndexRef.current = 0;
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        focusedIndexRef.current = items.length - 1;
        items[items.length - 1]?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Focus first item when opened
  useEffect(() => {
    if (isOpen) {
      const items = getMenuItems();
      if (items.length > 0) {
        items[0]?.focus();
        focusedIndexRef.current = 0;
      }
    } else {
      focusedIndexRef.current = -1;
    }
  }, [isOpen]);

  const clonedTrigger = React.cloneElement(trigger, {
    id: triggerId,
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': menuId,
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
    },
    onClick: (e: React.MouseEvent) => {
      trigger.props.onClick?.(e);
      setIsOpen(prev => !prev);
    },
  });

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="relative inline-block text-left"
    >
      {clonedTrigger}

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          tabIndex={-1}
          className={[
            'absolute z-dropdown mt-space-2 min-w-[12rem] p-space-1 bg-surface-solid rounded-md border border-border shadow-md focus:outline-none animate-in fade-in zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};
