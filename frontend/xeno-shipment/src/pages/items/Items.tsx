import { Card, CardBody, CardHeader } from '@heroui/react'
import MaterialsTable from '@pages/items/MaterialsTable'

const Items = () => {
  return (
    <div>
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4 pb-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold">Items & Materials</h1>
              <p className="text-small text-default-600">
                Browse and search all available materials
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="overflow-visible p-4">
          <MaterialsTable
            showRefreshButton={true}
            showSearch={true}
            showRevisionColumn={true}
            showNumberColumn={true}
            itemsPerPage={15}
            minHeight="400px"
            selectable={false}
          />
        </CardBody>
      </Card>
    </div>
  )
}

export default Items
