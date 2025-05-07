import React from 'react';

interface Tab {
  label: string;
  value: string;
}

interface TabsInlineProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export function TabsInline({ tabs, value, onChange, children }: TabsInlineProps) {
  return (
    <div className="w-full">
      <div className="flex gap-2 border-b border-slate-200 bg-transparent">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={
              value === tab.value
                ? 'px-4 py-2 text-base font-semibold border-b-2 border-slate-700 text-slate-800 transition-colors duration-150 focus:outline-none'
                : 'px-4 py-2 text-base font-normal border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-colors duration-150 focus:outline-none'
            }
            onClick={() => onChange(tab.value)}
            aria-selected={value === tab.value}
            tabIndex={0}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
} 