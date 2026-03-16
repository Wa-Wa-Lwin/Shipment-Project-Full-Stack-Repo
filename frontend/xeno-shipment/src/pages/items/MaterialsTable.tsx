import { useState, useEffect, useMemo, type JSX } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Chip,
  Pagination
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useParcelItemsCache } from '@hooks/useParcelItemsCache'

interface MaterialData {
  material_code: string
  description: string
  type_name: string
  part_revision: string
  supplier_name: string
  sku: string
  part_no: string
  hscode: string
}

interface MaterialsTableProps {
  onMaterialSelect?: (material: MaterialData) => void
  showRefreshButton?: boolean
  showSearch?: boolean
  showRevisionColumn?: boolean
  showNumberColumn?: boolean
  itemsPerPage?: number
  minHeight?: string
  selectable?: boolean
}

const DEBOUNCE_MS = 200

const MaterialsTable = ({
  onMaterialSelect,
  showRefreshButton = true,
  showSearch = true,
  showRevisionColumn = false,
  showNumberColumn = false,
  itemsPerPage = 25,
  minHeight = '400px',
  selectable = true
}: MaterialsTableProps) => {
  const { materials, isLoading, fetchParcelItems } = useParcelItemsCache()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)

  // Load materials on mount if not already loaded
  // This only runs once on mount, fetchParcelItems is intentionally excluded from deps
  // because the hook already manages cache and prevents duplicate calls
  useEffect(() => {
    if (materials.length === 0) {
      fetchParcelItems().catch(error => {
        console.error('Failed to load materials:', error)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [searchQuery])

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, materials])

  // Filter materials based on search query
  const filteredMaterials = useMemo(() => {
    if (!debouncedQuery.trim()) return materials
    const q = debouncedQuery.toLowerCase()
    return materials.filter(m =>
      m.material_code?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.type_name?.toLowerCase().includes(q) ||
      m.supplier_name?.toLowerCase().includes(q) ||
      m.sku?.toLowerCase().includes(q) ||
      m.part_no?.toLowerCase().includes(q) ||
      m.hscode?.toLowerCase().includes(q)
    )
  }, [materials, debouncedQuery])

  // Pagination calculations
  const totalItems = filteredMaterials.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const clampedPage = Math.min(page, totalPages)
  const startIndex = (clampedPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex)

  const showingFrom = totalItems === 0 ? 0 : startIndex + 1
  const showingTo = Math.min(endIndex, totalItems)

  const handleForceRefresh = () => {
    fetchParcelItems(true).catch(error => {
      console.error('Failed to refresh materials:', error)
    })
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assets':
        return 'primary'
      case 'it supplies':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const handleRowClick = (material: MaterialData) => {
    if (selectable && onMaterialSelect) {
      onMaterialSelect(material)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header Section */}
      {(showSearch || showRefreshButton) && (
        <div className="flex items-center justify-between gap-2">
          {showSearch && (
            <Input
              placeholder="Search materials by any field..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="solar:magnifer-bold" />}
              variant="flat"
              isDisabled={isLoading}
              className="flex-1"
              isClearable
              onClear={() => setSearchQuery('')}
            />
          )}
          <div className="flex items-center gap-2">
            {showRefreshButton && (
              <Button
                color="primary"
                variant="flat"
                size="sm"
                onPress={handleForceRefresh}
                isLoading={isLoading}
                startContent={!isLoading && <Icon icon="solar:refresh-bold" />}
              >
                Refresh
              </Button>
            )}
            {materials.length > 0 && (
              <Chip color="primary" variant="flat" size="sm">
                Total: {materials.length}
              </Chip>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <Table
        aria-label="Materials table"
        classNames={{
          wrapper: `min-h-[${minHeight}]`,
          table: "min-w-full",
        }}
        isStriped
        selectionMode={selectable ? "single" : "none"}
      >
        <TableHeader>
          {[
            showNumberColumn && <TableColumn key="number" className="w-16">No.</TableColumn>,
            <TableColumn key="material_code" className="w-48">MATERIAL CODE</TableColumn>,
            <TableColumn key="description" className="min-w-[300px]">DESCRIPTION</TableColumn>,
            <TableColumn key="type" className="w-32">TYPE</TableColumn>,
            <TableColumn key="sku" className="min-w-[200px]">SKU</TableColumn>,
            <TableColumn key="part_no" className="min-w-[200px]">PART NO</TableColumn>,
            <TableColumn key="hs_code" className="min-w-[200px]">HS CODE</TableColumn>,
            <TableColumn key="supplier" className="min-w-[250px]">SUPPLIER</TableColumn>,
            showRevisionColumn && <TableColumn key="revision" className="w-24">REVISION</TableColumn>,
          ].filter((col): col is JSX.Element => Boolean(col))}
        </TableHeader>
        <TableBody
          emptyContent={
            isLoading
              ? "Loading materials..."
              : materials.length === 0
                ? "No materials available. Please wait while we load the data."
                : "No materials found matching your search."
          }
          isLoading={isLoading && materials.length === 0}
          loadingContent="Loading materials from server..."
        >
          {paginatedMaterials.map((material, index) => (
            <TableRow
              key={material.material_code}
              className={selectable ? "cursor-pointer hover:bg-default-100 transition-colors" : ""}
              onClick={() => handleRowClick(material)}
            >
              {[
                showNumberColumn && (
                  <TableCell key="number">
                    <span className="text-sm font-medium text-default-600">
                      {startIndex + index + 1}
                    </span>
                  </TableCell>
                ),
                <TableCell key="material_code">
                  <span className="font-medium text-primary text-sm">
                    {material.material_code}
                  </span>
                </TableCell>,
                <TableCell key="description">
                  <div className="flex flex-col max-w-md">
                    <span className="text-sm font-medium text-foreground truncate">
                      {material.description}
                    </span>
                  </div>
                </TableCell>,
                <TableCell key="type">
                  <Chip
                    size="sm"
                    variant="flat"
                    color={getTypeColor(material.type_name)}
                  >
                    {material.type_name}
                  </Chip>
                </TableCell>,
                <TableCell key="sku">
                  <span className="text-sm text-default-600">
                    {material.sku}
                  </span>
                </TableCell>,
                <TableCell key="part_no">
                  <span className="text-sm text-default-600">
                    {material.part_no}
                  </span>
                </TableCell>,
                <TableCell key="hs_code">
                  <span className="text-sm text-default-600">
                    {material.hscode}
                  </span>
                </TableCell>,
                <TableCell key="supplier">
                  <span className="text-sm text-default-600 truncate max-w-[200px]">
                    {material.supplier_name}
                  </span>
                </TableCell>,
                showRevisionColumn && (
                  <TableCell key="revision">
                    <span className="text-sm text-default-500">
                      {material.part_revision}
                    </span>
                  </TableCell>
                ),
              ].filter((cell): cell is JSX.Element => Boolean(cell))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <span className="text-sm text-default-500">
            Showing {showingFrom.toLocaleString()}–{showingTo.toLocaleString()} of {totalItems.toLocaleString()}
          </span>
          <Pagination
            page={clampedPage}
            total={totalPages}
            onChange={setPage}
            showControls
            showShadow
            size="sm"
            color="primary"
            className="ml-auto"
          />
        </div>
      )}
    </div>
  )
}

export default MaterialsTable
export type { MaterialData, MaterialsTableProps }
