import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

interface AsyncSearchDropdownProps<T> {
  placeholder: string;
  onSearch: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  renderOption: (item: T) => React.ReactNode;
  value: T | null;
  disabled?: boolean;
  inputClassName?: string;
  popoverWidth?: string;
  popoverStyle?: React.CSSProperties;
}

export function AsyncSearchDropdown<T extends { id: string }>({
  placeholder,
  onSearch,
  onSelect,
  renderOption,
  value,
  disabled,
  inputClassName,
  popoverWidth,
  popoverStyle
}: AsyncSearchDropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<T[]>([]);
  const [touched, setTouched] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (open && triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      onSearch(query).then((res) => {
        setResults(res);
        setLoading(false);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open, onSearch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start items-center ${inputClassName || ""}`}
          disabled={disabled}
          onClick={() => setTouched(true)}
          ref={triggerRef}
        >
          <span className="flex-1 truncate text-left">
            {value ? renderOption(value) : <span className="text-gray-400">{placeholder}</span>}
          </span>
          <Search className="ml-2 h-4 w-4 text-gray-400 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={`p-0 left-0`}
        style={{ ...(popoverStyle || {}), width: triggerWidth ? `${triggerWidth}px` : undefined }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              </div>
            ) : results.length === 0 && touched ? (
              <CommandEmpty>No results found</CommandEmpty>
            ) : (
              results.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {renderOption(item)}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 