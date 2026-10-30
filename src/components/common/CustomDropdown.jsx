import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placeTop: false });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Recalculate fixed floating position on screen
  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = Math.max(rect.width, 125);
    
    // Check horizontal fit
    let left = align === 'right' ? rect.right - dropdownWidth : rect.left;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    // Check vertical fit (prefer below, flip above if constrained)
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeTop = spaceBelow < 220 && rect.top > 220;
    const top = placeTop ? rect.top - 6 : rect.bottom + 6;

    setCoords({
      top,
      left,
      width: dropdownWidth,
      placeTop
    });
  }, [align]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Event listeners for open state
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    function handleClickOutside(event) {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      updateCoords();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateCoords]);

  // Normalize options to { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value, label: opt.label ?? opt.value };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm flex items-center justify-between gap-1.5 select-none disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: coords.placeTop ? undefined : `${coords.top}px`,
            bottom: coords.placeTop ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            minWidth: `${coords.width}px`,
            maxWidth: 'calc(100vw - 24px)',
            zIndex: 99999
          }}
          className={`max-h-64 overflow-y-auto bg-white rounded-xl border border-slate-200/90 shadow-2xl shadow-slate-900/20 p-1 animate-in fade-in zoom-in-95 duration-150 select-none custom-scrollbar ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">No options</div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-2 text-xs sm:text-sm cursor-pointer flex items-center justify-between gap-3 rounded-lg transition-colors select-none ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-blue-600 shrink-0" strokeWidth={2.5} />}
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
