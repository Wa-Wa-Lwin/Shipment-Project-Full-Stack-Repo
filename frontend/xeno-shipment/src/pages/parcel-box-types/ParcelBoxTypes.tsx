import { useState, useEffect } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Card,
    CardBody,
    CardHeader,
    Spinner,
    Chip,
    Pagination,
    Button
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import parcelBoxTypesService from './parcelBoxTypesService';
import type { ParcelBoxType } from './types';
import { ParcelBoxTypeFormModal } from './components/ParcelBoxTypeFormModal';

const ParcelBoxTypes = () => {
    const navigate = useNavigate();
    const [parcelBoxTypesData, setParcelBoxTypesData] = useState<ParcelBoxType[]>([]);
    const [filteredData, setFilteredData] = useState<ParcelBoxType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchParcelBoxTypes();
    }, []);

    const fetchParcelBoxTypes = async () => {
        setIsLoading(true);
        try {
            const response = await parcelBoxTypesService.getAllParcelBoxTypes();
            console.log('API Response:', response);
            if (response.status === 'success' && Array.isArray(response.data)) {
                setParcelBoxTypesData(response.data);
                setFilteredData(response.data);
            } else {
                console.error('Unexpected response format:', response);
                alert(`Failed to load box types: ${response.message || 'Unexpected response format'}`);
            }
        } catch (error: any) {
            console.error('Failed to fetch parcel box types:', error);
            alert(`Error loading box types: ${error.response?.data?.message || error.message || 'Network error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let baseData = parcelBoxTypesData;

        // Apply status filter
        if (filterType === 'active') {
            baseData = parcelBoxTypesData.filter(box => (box.active === 1 || box.active === true || box.active === null));
        } else if (filterType === 'inactive') {
            baseData = parcelBoxTypesData.filter(box => box.active === 0);
        }

        // Apply search filter
        if (searchQuery.trim() === '') {
            setFilteredData(baseData);
        } else {
            const filtered = baseData.filter(box =>
                box.box_type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                box.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                box.dimension_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                box.weight_unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (box.remark && box.remark.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredData(filtered);
        }
        setCurrentPage(1);
    }, [searchQuery, parcelBoxTypesData, filterType]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredData.slice(startIndex, endIndex);

    const formatDimensions = (box: ParcelBoxType) => {
        return `${box.depth} x ${box.width} x ${box.height} ${box.dimension_unit}`;
    };

    const formatWeight = (box: ParcelBoxType) => {
        return `${box.parcel_weight} ${box.weight_unit}`;
    };

    const handleRowClick = (boxTypeId: number | string) => {
        navigate(`/local/parcel-box-types/${boxTypeId}`);
    };

    return (
        <div className="space-y-6 p-5">
            <Card className="w-full">
                <CardHeader className="flex flex-col gap-4 pb-4">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-2xl font-bold">Parcel Box Types Management</h1>
                                <p className="text-small text-default-600">
                                    {filteredData.length} box types found
                                </p>
                            </div>
                            <Button
                                color="primary"
                                startContent={<Icon icon="solar:add-circle-linear" width={20} />}
                                onPress={() => setIsModalOpen(true)}
                            >
                                Add Box Type
                            </Button>
                        </div>

                        <div className="flex gap-3 items-center">
                            {/* Filter Chips */}
                            <div className="flex gap-2">
                                <Chip
                                    size="sm"
                                    variant={filterType === 'all' ? 'solid' : 'flat'}
                                    color={filterType === 'all' ? 'primary' : 'default'}
                                    className="cursor-pointer"
                                    onClick={() => setFilterType('all')}
                                >
                                    All
                                </Chip>
                                <Chip
                                    size="sm"
                                    variant={filterType === 'active' ? 'solid' : 'flat'}
                                    color={filterType === 'active' ? 'success' : 'default'}
                                    className="cursor-pointer"
                                    onClick={() => setFilterType('active')}
                                >
                                    Active
                                </Chip>
                                <Chip
                                    size="sm"
                                    variant={filterType === 'inactive' ? 'solid' : 'flat'}
                                    color={filterType === 'inactive' ? 'danger' : 'default'}
                                    className="cursor-pointer"
                                    onClick={() => setFilterType('inactive')}
                                >
                                    Inactive
                                </Chip>
                            </div>

                            {/* Search Bar */}
                            <Input
                                placeholder="Search box types..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                startContent={<Icon icon="solar:magnifer-bold" />}
                                variant="bordered"
                                className="max-w-md"
                                isClearable
                                onClear={() => setSearchQuery('')}
                            />

                            <Chip color="primary" variant="flat">
                                Total: {parcelBoxTypesData.length}
                            </Chip>
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="overflow-visible p-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spinner size="lg" label="Loading box types..." />
                        </div>
                    ) : (
                        <>
                            <Table
                                aria-label="Parcel box types table"
                                classNames={{
                                    wrapper: "min-h-[400px]",
                                    table: "min-w-full",
                                }}
                                isStriped
                                selectionMode="single"
                            >
                                <TableHeader>
                                    <TableColumn className="w-16">No.</TableColumn>
                                    <TableColumn className="w-24">ID</TableColumn>
                                    <TableColumn className="min-w-[200px]">BOX TYPE NAME</TableColumn>
                                    <TableColumn className="min-w-[150px]">TYPE</TableColumn>
                                    <TableColumn className="min-w-[250px]">DIMENSIONS (D x W x H)</TableColumn>
                                    <TableColumn className="w-40">WEIGHT</TableColumn>
                                    <TableColumn className="min-w-[200px]">REMARK</TableColumn>
                                    <TableColumn className="w-24">STATUS</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No box types found">
                                    {currentItems.map((box, index) => (
                                        <TableRow
                                            key={box.parcelBoxTypeID}
                                            className="cursor-pointer hover:bg-default-100"
                                            onClick={() => handleRowClick(box.parcelBoxTypeID)}
                                        >
                                            {/* No */}
                                            <TableCell>
                                                <span className="text-sm font-medium text-default-600">
                                                    {startIndex + index + 1}
                                                </span>
                                            </TableCell>
                                            {/* ID */}
                                            <TableCell>
                                                <span className="text-sm font-medium text-default-600">
                                                    {box.parcelBoxTypeID}
                                                </span>
                                            </TableCell>
                                            {/* BOX TYPE NAME */}
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-primary text-sm">
                                                        {box.box_type_name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            {/* TYPE */}
                                            <TableCell>
                                                <Chip size="sm" variant="flat" color="primary">
                                                    {box.type}
                                                </Chip>
                                            </TableCell>
                                            {/* DIMENSIONS */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="solar:ruler-linear" width={16} className="text-default-400" />
                                                    <span className="text-sm text-default-600">
                                                        {formatDimensions(box)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            {/* WEIGHT */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="solar:scale-linear" width={16} className="text-default-400" />
                                                    <span className="text-sm text-default-600">
                                                        {formatWeight(box)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            {/* REMARK */}
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {box.remark && (
                                                        <span className="text-xs text-default-500">
                                                            {box.remark}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            {/* STATUS */}
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    color={(box.active === 1 || box.active === true || box.active === null) ? 'success' : 'danger'}
                                                >
                                                    {(box.active === 1 || box.active === true || box.active === null) ? 'Active' : 'Inactive'}
                                                </Chip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
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
                    )}
                </CardBody>
            </Card>

            {/* Create/Edit Modal */}
            <ParcelBoxTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchParcelBoxTypes}
                mode="create"
            />
        </div>
    );
};

export default ParcelBoxTypes;
