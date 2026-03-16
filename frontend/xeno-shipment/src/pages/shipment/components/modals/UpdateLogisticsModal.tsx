import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Autocomplete, AutocompleteItem } from '@heroui/react';
import { Icon } from '@iconify/react';
import { INCOTERMS, CUSTOM_PURPOSES } from '../../constants/form-defaults';
import { ISO_3_COUNTRIES } from '../../constants/iso3countries';
import type { ShipmentGETData } from '../shipment-details';

interface UpdateLogisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: ShipmentGETData | null;
  editedParcelItems: any[];
  editCustomsPurpose: string;
  editCustomsTermsOfTrade: string;
  isUpdatingLogistics: boolean;
  onEditCustomsPurposeChange: (value: string) => void;
  onEditCustomsTermsOfTradeChange: (value: string) => void;
  onParcelItemUpdate: (itemId: string, field: string, value: string) => void;
  onSubmit: () => void;
}

const UpdateLogisticsModal = ({
  isOpen,
  onClose,
  shipment,
  editedParcelItems,
  editCustomsPurpose,
  editCustomsTermsOfTrade,
  isUpdatingLogistics,
  onEditCustomsPurposeChange,
  onEditCustomsTermsOfTradeChange,
  onParcelItemUpdate,
  onSubmit
}: UpdateLogisticsModalProps) => {
  const handleSaveChanges = () => {
    // Validation before calling submit
    const isDomestic = shipment?.shipment_scope_type?.toLowerCase().startsWith('domestic');

    // For non-domestic shipments, validate customs fields
    if (!isDomestic && (!editCustomsPurpose || !editCustomsTermsOfTrade)) {
      alert("⚠️ Please fill customs purpose and incoterms before updating.");
      return;
    }

    // Always validate parcel items
    if (editedParcelItems.some((item) => !item.hs_code || !item.origin_country)) {
      alert("⚠️ Please fill HS Code and Origin Country for all items.");
      return;
    }

    onSubmit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center text-blue-900 border-b-2 border-blue-300 bg-blue-50">
          <Icon icon="solar:box-bold-duotone" className="text-blue-600" width={28} />
          Update Logistics Information
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-100 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <Icon icon="solar:info-circle-bold" width={20} />
                Please update the required logistics information below. All fields marked with * are required.
              </p>
            </div>

            {/* Customs Purpose and Incoterms - Only for international shipments */}
            {shipment?.shipment_scope_type?.toLowerCase().startsWith('international') && (
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Customs Purpose"
                  placeholder="Select customs purpose"
                  selectedKeys={editCustomsPurpose ? [editCustomsPurpose] : []}
                  onSelectionChange={(keys) => onEditCustomsPurposeChange(Array.from(keys)[0] as string)}
                  size="md"
                  variant="bordered"
                  isRequired
                  isInvalid={!editCustomsPurpose}
                  errorMessage={!editCustomsPurpose ? "Customs purpose is required" : ""}
                >
                  {CUSTOM_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose.key} value={purpose.key}>
                      {purpose.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Incoterms"
                  placeholder="Select terms of trade"
                  selectedKeys={editCustomsTermsOfTrade ? [editCustomsTermsOfTrade] : []}
                  onSelectionChange={(keys) => onEditCustomsTermsOfTradeChange(Array.from(keys)[0] as string)}
                  size="md"
                  variant="bordered"
                  isRequired
                  isInvalid={!editCustomsTermsOfTrade}
                  errorMessage={!editCustomsTermsOfTrade ? "Terms of trade is required" : ""}
                >
                  {INCOTERMS.map((term) => (
                    <SelectItem key={term.key} value={term.key}>
                      {term.value}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

            {/* Parcel Items */}
            {editedParcelItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Icon icon="solar:box-minimalistic-bold" className="text-blue-600" width={20} />
                  <h3 className="text-base font-bold text-gray-900">Parcel Items</h3>
                </div>
                <div className="space-y-4">
                  {editedParcelItems.map((item, index) => (
                    <div key={item.id} className="border-2 border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                      <div className="flex items-start gap-2 pb-2 border-b border-gray-300">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div className="text-sm text-gray-700 flex-1">
                          <strong className="text-gray-900">Description:</strong> {item.description}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input
                          label="HS Code"
                          value={item.hs_code || ""}
                          onValueChange={(value) => onParcelItemUpdate(item.id, "hs_code", value)}
                          size="md"
                          variant="bordered"
                          isRequired
                          isInvalid={!item.hs_code}
                          errorMessage={!item.hs_code ? "HS Code is required" : ""}
                        />
                        <Autocomplete
                          label="Origin Country"
                          placeholder="Search country..."
                          selectedKey={item.origin_country || ""}
                          onSelectionChange={(key) => onParcelItemUpdate(item.id, "origin_country", key as string)}
                          size="md"
                          variant="bordered"
                          allowsCustomValue
                          isRequired
                          isInvalid={!item.origin_country}
                          errorMessage={!item.origin_country ? "Origin country is required" : ""}
                        >
                          {ISO_3_COUNTRIES.map((country) => (
                            <AutocompleteItem key={country.key} value={country.key}>
                              {country.value}
                            </AutocompleteItem>
                          ))}
                        </Autocomplete>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="border-t-2 border-gray-200">
          <Button
            variant="light"
            onPress={onClose}
            disabled={isUpdatingLogistics}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSaveChanges}
            isLoading={isUpdatingLogistics}
            disabled={isUpdatingLogistics}
            size="md"
            className="font-bold"
            startContent={<Icon icon="solar:diskette-bold" width={20} />}
          >
            {isUpdatingLogistics ? "Updating..." : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateLogisticsModal;
