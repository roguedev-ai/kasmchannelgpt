import React, { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SourceFiltersProps {
  filter: {
    status?: 'active' | 'inactive' | 'processing' | 'error' | 'all';
    type?: 'file' | 'url' | 'text' | 'api' | 'all';
    sortBy?: 'name' | 'created_at' | 'updated_at' | 'size';
    sortOrder?: 'asc' | 'desc';
  };
  onChange: (filter: Partial<SourceFiltersProps['filter']>) => void;
}

export const SourceFilters: React.FC<SourceFiltersProps> = ({
  filter,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }, 
    { value: 'processing', label: 'Processing' },
    { value: 'error', label: 'Error' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'file', label: 'Files' },
    { value: 'url', label: 'URLs' },
    { value: 'text', label: 'Text' },
    { value: 'api', label: 'API' },
  ];

  const sortOptions = [
    { value: 'updated_at', label: 'Last Updated' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'name', label: 'Name' },
    { value: 'size', label: 'Size' },
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filters
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 p-4 z-50 w-72 shadow-lg">
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Status
              </Label>
              <Select
                value={filter.status || 'all'}
                onValueChange={(value) => onChange({ status: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Type
              </Label>
              <Select
                value={filter.type || 'all'}
                onValueChange={(value) => onChange({ type: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Sort By
              </Label>
              <Select
                value={filter.sortBy || 'updated_at'}
                onValueChange={(value) => onChange({ sortBy: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <Label className="block text-sm font-medium mb-2">
                Order
              </Label>
              <Select
                value={filter.sortOrder || 'desc'}
                onValueChange={(value) => onChange({ sortOrder: value as any })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOrderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange({
                    status: 'all',
                    type: 'all',
                    sortBy: 'updated_at',
                    sortOrder: 'desc'
                  });
                }}
              >
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};