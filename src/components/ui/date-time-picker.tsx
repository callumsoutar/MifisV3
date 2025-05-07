import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './button';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { Calendar } from '@/components/ui/calendar';

// Helper: generate 30-min interval times as strings ("HH:mm")
function generateTimeOptions() {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return options;
}
const TIME_OPTIONS = generateTimeOptions();

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  minDate,
  maxDate,
  label,
}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-medium text-slate-700 mb-1">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-10 rounded-md"
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value
              ? format(value, 'dd MMM yyyy')
              : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 flex flex-col gap-3 rounded-xl shadow-lg">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={date => onChange?.(date ?? null)}
            required={false}
            initialFocus
            disabled={disabled}
            fromDate={minDate}
            toDate={maxDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export interface TimeSelectProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  placeholder = 'Select time',
  disabled,
  label,
}) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs font-medium text-slate-700 mb-1">{label}</label>}
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full h-10 rounded-md text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-48 overflow-y-auto">
        {TIME_OPTIONS.map((t) => (
          <SelectItem key={t} value={t} className="text-sm py-1 px-2">{t}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
); 