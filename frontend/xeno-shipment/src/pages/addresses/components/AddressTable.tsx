import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Pagination
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import type { AddressTableProps } from '../types'
import { getCardTypeInfo, formatAddress, getPaginatedItems } from '../utils/addressUtils'

const AddressTable = ({
  addresses,
  isLoading,
  onAddressClick,
  currentPage: initialPage,
  itemsPerPage
}: AddressTableProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const { totalPages, startIndex, currentItems } = getPaginatedItems(
    addresses,
    currentPage,
    itemsPerPage
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" label="Loading addresses..." />
      </div>
    )
  }

  return (
    <>
      <Table
        aria-label="Addresses table"
        classNames={{
          wrapper: "min-h-[400px]",
          table: "min-w-full",
        }}
        isStriped
        selectionMode="single"
      >
        <TableHeader>
          <TableColumn className="w-16">No.</TableColumn>
          <TableColumn className="w-32">CODE</TableColumn>
          <TableColumn className="w-20">TYPE</TableColumn>
          <TableColumn className="min-w-[250px]">COMPANY NAME</TableColumn>
          <TableColumn className="min-w-[300px]">ADDRESS</TableColumn>
          <TableColumn className="w-24">COUNTRY</TableColumn>
          <TableColumn className="w-20">CURRENCY</TableColumn>
          <TableColumn className="min-w-[180px]">CONTACT PERSON</TableColumn>
          <TableColumn className="min-w-[200px]">EMAIL</TableColumn>
          <TableColumn className="min-w-[150px]">PHONE</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No addresses found">
          {currentItems.map((address, index) => {
            const typeInfo = getCardTypeInfo(address.CardType)
            return (
              <TableRow
                key={address.CardCode}
                className="cursor-pointer hover:bg-default-100 transition-colors"
                onClick={() => onAddressClick(address)}
              >
                <TableCell>
                  <span className="text-sm font-medium text-default-600">
                    {startIndex + index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-primary text-sm">
                    {address.CardCode}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={typeInfo.color}
                    startContent={<Icon icon={typeInfo.icon} width={14} />}
                  >
                    {typeInfo.label}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col max-w-[250px]">
                    <span className="text-sm font-medium text-foreground truncate">
                      {address.CardName}
                    </span>
                    {address.BillToDef && address.BillToDef !== address.CardName && (
                      <span className="text-tiny text-default-500 truncate">
                        Bill to: {address.BillToDef}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col max-w-[300px]">
                    <span className="text-sm text-default-600 truncate">
                      {formatAddress(address)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-default-600">
                      {address.Country || address.MailCountr || 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="bordered" color="warning">
                    {address.Currency || 'N/A'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-default-600">
                    {address.CntctPrsn || 'Not specified'}
                  </span>
                </TableCell>
                <TableCell>
                  {address.E_Mail ? (
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:letter-bold" className="text-default-400" width={14} />
                      <span className="text-sm text-default-600 truncate max-w-[180px]">
                        {address.E_Mail}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-default-400">No email</span>
                  )}
                </TableCell>
                <TableCell>
                  {address.Phone1 ? (
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:phone-bold" className="text-default-400" width={14} />
                      <span className="text-sm text-default-600">
                        {address.Phone1}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-default-400">No phone</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            showShadow
            color="primary"
          />
        </div>
      )}
    </>
  )
}

export default AddressTable