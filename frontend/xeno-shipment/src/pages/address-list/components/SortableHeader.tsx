import { Icon } from '@iconify/react'

interface SortableHeaderProps<T> {
  columnKey: keyof T
  label: string
  currentSortKey: keyof T | null
  sortDirection: 'asc' | 'desc'
  onSort: (key: keyof T) => void
  className?: string
}

export const SortableHeader = <T,>({
  columnKey,
  label,
  currentSortKey,
  sortDirection,
  onSort,
  className = ''
}: SortableHeaderProps<T>) => {
  return (
    <div
      className={`flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors ${className}`}
      onClick={() => onSort(columnKey)}
    >
      <span>{label}</span>
      {currentSortKey === columnKey && (
        <Icon
          icon={sortDirection === 'asc' ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
          width={16}
        />
      )}
    </div>
  )
}
