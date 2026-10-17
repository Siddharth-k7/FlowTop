import React, { useState, useRef, useId, createContext, useContext } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items?: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: React.ReactNode;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (val: string) => void;
  tabsId: string;
  orientation: 'horizontal' | 'vertical';
  registerTab: (val: string, element: HTMLButtonElement | null) => void;
  tabElements: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  value: controlledValue,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  className = '',
  children,
}) => {
  const tabsId = useId();
  const initialValue = controlledValue ?? defaultValue ?? items?.[0]?.id ?? '';
  const [internalValue, setInternalValue] = useState<string>(initialValue);

  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;
  const tabElements = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleSelectTab = (val: string) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  const registerTab = (val: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabElements.current.set(val, element);
    } else {
      tabElements.current.delete(val);
    }
  };

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab: handleSelectTab,
    tabsId,
    orientation,
    registerTab,
    tabElements,
  };

  // If items array prop is provided, render data-driven layout
  if (items && items.length > 0) {
    return (
      <TabsContext.Provider value={contextValue}>
        <div className={`flex flex-col w-full ${className}`}>
          <TabList>
            {items.map(item => (
              <Tab key={item.id} value={item.id} disabled={item.disabled}>
                {item.label}
              </Tab>
            ))}
          </TabList>

          {items.map(item => (
            <TabPanel key={item.id} value={item.id}>
              {item.content}
            </TabPanel>
          ))}
        </div>
      </TabsContext.Provider>
    );
  }

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`flex ${orientation === 'vertical' ? 'flex-row' : 'flex-col'} w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  'aria-label'?: string;
}

export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(
  ({ className = '', children, ...props }, ref) => {
    const { orientation, activeTab, setActiveTab, tabElements } = useTabsContext();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const tabs = Array.from(tabElements.current.entries())
        .filter(([, el]) => !el.disabled)
        .map(([id]) => id);

      if (tabs.length === 0) return;

      const currentIndex = tabs.indexOf(activeTab);
      let nextIndex = -1;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const nextTabId = tabs[nextIndex];
      if (nextTabId !== undefined) {
        setActiveTab(nextTabId);
        tabElements.current.get(nextTabId)?.focus();
      }
    };

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={[
          'flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-none',
          orientation === 'vertical' ? 'flex-col border-b-0 border-r' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabList.displayName = 'TabList';

export interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
}

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  ({ value, className = '', children, disabled, ...props }, ref) => {
    const { activeTab, setActiveTab, tabsId, registerTab } = useTabsContext();
    const isSelected = activeTab === value;
    const tabId = `${tabsId}-tab-${value}`;
    const panelId = `${tabsId}-panel-${value}`;

    const setRef = (node: HTMLButtonElement | null) => {
      registerTab(value, node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    return (
      <button
        ref={setRef}
        role="tab"
        id={tabId}
        type="button"
        disabled={disabled}
        aria-selected={isSelected}
        aria-controls={panelId}
        tabIndex={isSelected ? 0 : -1}
        onClick={() => !disabled && setActiveTab(value)}
        className={[
          'min-h-touch touch-target px-space-4 py-space-2 text-small font-medium select-none transition-colors relative focus-ring',
          isSelected
            ? 'text-purple-deep border-b-2 border-purple-deep font-semibold'
            : 'text-muted hover:text-primary hover:border-b-2 hover:border-border-strong',
          disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Tab.displayName = 'Tab';

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, className = '', children, ...props }, ref) => {
    const { activeTab, tabsId } = useTabsContext();
    const isSelected = activeTab === value;
    const tabId = `${tabsId}-tab-${value}`;
    const panelId = `${tabsId}-panel-${value}`;

    if (!isSelected) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId}
        tabIndex={0}
        className={`p-space-4 focus-ring rounded-sm outline-none ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabPanel.displayName = 'TabPanel';
