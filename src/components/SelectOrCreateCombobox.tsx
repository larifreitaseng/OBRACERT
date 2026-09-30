import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';

interface SelectOrCreateComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  createLabel?: string;
  className?: string;
  storageKey?: string;
}

export const SelectOrCreateCombobox: React.FC<SelectOrCreateComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione ou crie...',
  createLabel = '+ Criar Novo...',
  className = '',
  storageKey,
}) => {
  const [customList, setCustomList] = useState<string[]>(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(`combobox_${storageKey}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newVal, setNewVal] = useState('');

  // Combine default options, customList, and current value if not already present
  const allOptions = Array.from(
    new Set([...options, ...customList, ...(value && !options.includes(value) ? [value] : [])])
  ).filter(Boolean);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__CREATE_NEW__') {
      setIsCreating(true);
      setNewVal('');
    } else {
      onChange(selected);
    }
  };

  const handleConfirmCreate = () => {
    const trimmed = newVal.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }

    if (!allOptions.includes(trimmed)) {
      const updated = [...customList, trimmed];
      setCustomList(updated);
      if (storageKey) {
        try {
          localStorage.setItem(`combobox_${storageKey}`, JSON.stringify(updated));
        } catch (e) {}
      }
    }

    onChange(trimmed);
    setIsCreating(false);
    setNewVal('');
  };

  if (isCreating) {
    return (
      <div className={`flex items-center gap-1.5 min-w-0 w-full ${className}`}>
        <input
          type="text"
          autoFocus
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirmCreate();
            } else if (e.key === 'Escape') {
              setIsCreating(false);
            }
          }}
          placeholder="Digite o novo item..."
          className="flex-1 min-w-0 w-full text-xs px-2.5 py-2 bg-amber-50 border border-amber-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium h-9"
        />
        <button
          type="button"
          onClick={handleConfirmCreate}
          className="h-9 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
          title="Confirmar e salvar"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsCreating(false)}
          className="h-9 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 min-w-0 w-full ${className}`}>
      <select
        value={value}
        onChange={handleSelectChange}
        className="flex-1 min-w-0 w-full text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium truncate h-9 cursor-pointer"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {allOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__CREATE_NEW__" className="font-bold text-amber-700 bg-amber-50">
          {createLabel}
        </option>
      </select>

      <button
        type="button"
        onClick={() => {
          setIsCreating(true);
          setNewVal('');
        }}
        className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 rounded-lg transition-colors shrink-0 cursor-pointer"
        title={createLabel}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
