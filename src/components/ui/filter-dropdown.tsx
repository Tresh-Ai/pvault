import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  selectedFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  className?: string;
}

export function FilterDropdown({ 
  title, 
  options, 
  selectedFilters, 
  onFiltersChange,
  className 
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleToggleFilter = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(f => f !== filterId)
      : [...selectedFilters, filterId];
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange([]);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
          >
            <Filter className="h-3 w-3" />
            {selectedFilters.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                {selectedFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{title}</h4>
              {selectedFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                onClick={() => handleToggleFilter(option.id)}
              >
                <Checkbox
                  checked={selectedFilters.includes(option.id)}
                  onChange={() => {}} // Handled by parent div
                />
                <span className="text-sm flex-1">{option.label}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {option.count}
                  </span>
                )}
              </div>
            ))}
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">No options available</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}