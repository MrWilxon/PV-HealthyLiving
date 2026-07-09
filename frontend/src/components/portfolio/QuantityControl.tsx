'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantityControl({ value, onChange, min = 1, max = 999 }: QuantityControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    } else {
      setEditValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label="Decrease quantity"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      {isEditing ? (
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-11 w-16 text-center"
          aria-label="Quantity"
          min={min}
          max={max}
          autoFocus
        />
      ) : (
        <button
          onClick={() => {
            setIsEditing(true);
            setEditValue(value.toString());
          }}
          aria-label={`Quantity: ${value}. Click to edit`}
          className="h-11 w-16 flex items-center justify-center border rounded-md text-sm font-medium hover:bg-gray-50"
        >
          {value}
        </button>
      )}
      <Button
        variant="outline"
        size="icon"
        aria-label="Increase quantity"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
