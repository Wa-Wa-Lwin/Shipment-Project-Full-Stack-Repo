import { Card, CardHeader, CardBody, Input, Textarea, Select, SelectItem } from '@heroui/react'
import { Controller } from 'react-hook-form'
import { SALES_PERSON_OPTIONS, TOPIC_OPTIONS, SERVICE_OPTIONS } from '../../constants/form-defaults'
import type { FormSectionProps } from '../../types/shipment-form.types'
import { useState, useEffect } from 'react'
import { SHIPMENT_SCOPE_OPTIONS } from '@pages/shipment/constants/shipment_scope_types'

interface BasicInformationProps extends FormSectionProps {
  watch: <T = any>(name?: string) => T
  onClearRates?: () => void
}

const BasicInformation = ({ register, errors, control, watch, setValue, onClearRates }: BasicInformationProps) => {

  const [selectedTopic, setSelectedTopic] = useState<Set<string>>(new Set());
  const [selectedServiceOptions, setSelectedServiceOptions] = useState<Set<string>>(new Set());

  // Watch the send_to field to conditionally apply validation
  const sendTo = watch('send_to');

  // Initialize request_status on component mount
  useEffect(() => {
    const currentSendTo = sendTo || 'Approver';
    setRequestStatusValue(currentSendTo);
  }, []);

  // Watch form values to sync with form state
  const topicValue = watch('topic');
  const serviceOptionsValue = watch('service_options');
  const salesPersonValue = watch('sales_person');
  const shipmentScopeValue = watch('shipment_scope_type');

  // Update local state when form values change (for duplicated data)
  useEffect(() => {
    if (topicValue) {
      setSelectedTopic(new Set([topicValue]));
    }
  }, [topicValue]);

  useEffect(() => {
    if (serviceOptionsValue) {
      setSelectedServiceOptions(new Set([serviceOptionsValue]));
    }
  }, [serviceOptionsValue]);

  // Helper function to set request status based on send_to value
  const setRequestStatusValue = (sendToValue: string) => {
    if (setValue) {
      const requestStatus = sendToValue === "Approver" ? "requestor_requested" : "send_to_logistic";
      setValue("request_status", requestStatus, { shouldDirty: true, shouldValidate: true });
    }
  };

  // Automatically set request_status based on send_to value
  useEffect(() => {
    if (sendTo) {
      setRequestStatusValue(sendTo);
    }
  }, [sendTo]);

  // Helper function to determine if a field should be required based on send_to value
  const isFieldRequired = (_fieldName?: string) => {
    // All basic information fields are required
    return true;
  };

  return (
    <Card shadow="none" className='rounded-none'>
      <CardHeader className="px-0 pt-0 pb-1">
        <h2 className="text-lg font-semibold">Basic Information</h2>
      </CardHeader>
      <CardBody className="px-0 pt-0 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">

          <Controller
            name="shipment_scope_type"
            control={control}
            rules={isFieldRequired('shipment_scope_type') ? { required: "Shipment Scope is required" } : undefined}
            render={({ field }) => (
              <Select
                isRequired={isFieldRequired('shipment_scope_type')}
                {...field}
                label={<span>Shipment Scope</span>}
                placeholder="Select"
                errorMessage={errors.shipment_scope_type?.message}
                isInvalid={!!errors.shipment_scope_type}
                selectedKeys={shipmentScopeValue ? [shipmentScopeValue] : field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string
                  if (selectedKey) {
                    field.onChange(selectedKey)
                    // Clear rates since service option changed
                    if (onClearRates) {
                      console.log('shipment_scope_type changed, clearing rates...')
                      onClearRates()
                    }
                  }
                }}
                color={!watch('shipment_scope_type') ? "warning" : "default"}
              >
                {SHIPMENT_SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            )}
          />

          {/* <Controller
            name="send_to"
            control={control}
            rules={{ required: "Send to is required" }}
            render={({ field }) => (
              <Select
                isRequired
                {...field}
                label={<span>Send To</span>}
                placeholder="Select"
                errorMessage={errors.send_to?.message}
                isInvalid={!!errors.send_to}
                selectedKeys={sendToValue ? [sendToValue] : field.value ? [field.value] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string
                  if (selectedKey) {
                    field.onChange(selectedKey)
                  }
                }}
                color={!watch('send_to') ? "warning" : "default"}
              >
                <SelectItem key="Approver" value="Approver">
                  Approver
                </SelectItem>
                <SelectItem key="Logistic" value="Logistic">
                  Logistic
                </SelectItem>
              </Select>
            )}
          /> */}
          <div className="col-span-1 grid grid-cols-1 gap-2">
            <Controller
              name="topic"
              control={control}
              rules={{ required: "Topic is required" }}
              render={({ field }) => (
                <Select
                  isRequired
                  {...field}
                  label={<span>Topic</span>}
                  placeholder="Select"
                  errorMessage={errors.topic?.message}
                  isInvalid={!!errors.topic}
                  selectedKeys={topicValue ? [topicValue] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string
                    if (selectedKey) {
                      field.onChange(selectedKey)
                      setSelectedTopic(new Set([selectedKey]))
                    }
                  }}
                  color={!watch('topic') ? "warning" : "default"}
                >
                  {TOPIC_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />
            {selectedTopic.has('Others') && (
              <Textarea
                {...register('other_topic', {
                  required: selectedTopic.has('Others') ? "Other topic is required" : false
                })}
                isRequired={selectedTopic.has('Others')}
                label={<span>Other Topic</span>}
                placeholder="Enter"
                errorMessage={errors.other_topic?.message}
                isInvalid={!!errors.other_topic}
                required
                color={!watch('other_topic') ? "warning" : "default"}
                minRows={1}
              />
            )}
            {/* If shipment scope is IMPORT → show text input */}
            {selectedTopic.has('For Sales') && shipmentScopeValue === 'import' && (
              <Input
                {...register('sales_person', { required: "Sales person is required for import scope" })}
                label="Sales Person"
                isRequired={selectedTopic.has('For Sales')}
                placeholder="Enter sales person name"
                errorMessage={errors.sales_person?.message}
                isInvalid={!!errors.sales_person}
                color={!watch('sales_person') ? "warning" : "default"}
              />
            )}
            {selectedTopic.has('For Sales') && shipmentScopeValue !== 'import' && (
              <Controller
                name="sales_person"
                control={control}
                rules={selectedTopic.has('For Sales') ? { required: "Sales person is required" } : undefined}
                render={({ field }) => (
                  <Select
                    {...field}
                    isRequired={selectedTopic.has('For Sales')}
                    label={<span>Sales Person</span>}
                    placeholder="Select"
                    errorMessage={errors.sales_person?.message}
                    isInvalid={!!errors.sales_person}
                    selectedKeys={salesPersonValue ? [salesPersonValue] : []}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string
                      if (selectedKey) {
                        field.onChange(selectedKey)
                      }
                    }}
                    color={!watch('sales_person') ? "warning" : "default"}
                  >
                    {SALES_PERSON_OPTIONS.map((option) => (
                      <SelectItem key={option.key} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            )}
          </div>

          <div className="col-span-1 grid grid-cols-1 gap-2">

            <Controller
              name="service_options"
              control={control}
              defaultValue="Normal"
              rules={{ required: "Service option is required" }}
              render={({ field }) => {
                return (
                  <Select
                    {...field}
                    isRequired
                    label={<span>Service Options</span>}
                    placeholder="Select"
                    errorMessage={errors.service_options?.message}
                    isInvalid={!!errors.service_options}
                    selectedKeys={
                      serviceOptionsValue
                        ? [serviceOptionsValue]
                        : field.value
                          ? [field.value]
                          : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      if (selectedKey) {
                        field.onChange(selectedKey);
                        setSelectedServiceOptions(new Set([selectedKey]));

                        // If Supplier Pickup is selected, set Payment Terms to Free Of Charge
                        if (selectedKey === "Supplier Pickup" && setValue) {
                          setValue("payment_terms", "free_of_charge", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }

                        // If Grab Pickup is selected, initialize grab rate fields
                        if (selectedKey === "Grab" && setValue) {
                          const formData = watch();
                          if (!formData.grab_rate_amount) {
                            setValue("grab_rate_amount", "", { shouldDirty: true });
                          }
                          if (!formData.grab_rate_currency) {
                            setValue("grab_rate_currency", "THB", { shouldDirty: true });
                          }
                        }

                        // Clear rates since service option changed (except for Grab)
                        if (selectedKey !== "Grab" && onClearRates) {
                          console.log("Service option changed, clearing rates...");
                          onClearRates();
                        }
                      }
                    }}
                    color={!watch("service_options") ? "warning" : "default"}
                  >
                    {SERVICE_OPTIONS.map((option) => (
                      <SelectItem key={option.key} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                );
              }}
            />
            {selectedServiceOptions.has('Urgent') && (
              <Input
                isRequired={selectedServiceOptions.has('Urgent')}
                {...register('urgent_reason', {
                  required: selectedServiceOptions.has('Urgent') ? "Urgent reason is required" : false
                })}
                label={<span>Urgent Reason</span>}
                placeholder="Enter"
                errorMessage={errors.urgent_reason?.message}
                isInvalid={!!errors.urgent_reason}
                color={!watch('urgent_reason') ? "warning" : "default"}
              />
            )}
          </div>

          <Input
            {...register('po_number')}
            label={<span>PO Number</span>}
            placeholder="Enter"
            errorMessage={errors.po_number?.message}
            isInvalid={!!errors.po_number}
            color={!watch('po_number') ? "warning" : "default"}
          />
          <Input
            {...register('po_date')}
            type="date"
            label={<span>PO Date</span>}
            errorMessage={errors.po_date?.message}
            isInvalid={!!errors.po_date}
            // defaultValue={new Date().toISOString().split('T')[0]}
            color={!watch('po_date') ? "warning" : "default"}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
          />

          <Controller
            name="payment_terms"
            control={control}
            rules={isFieldRequired('payment_terms') ? { required: "Payment terms is required" } : undefined}
            render={({ field }) => (
              <Select
                isRequired={isFieldRequired('payment_terms')}
                {...field}
                label={<span>Payment Terms</span>}
                placeholder="Select"
                errorMessage={errors.payment_terms?.message}
                isInvalid={!!errors.payment_terms}
                selectedKeys={field.value ? new Set([field.value]) : new Set()}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string
                  if (selectedKey) {
                    field.onChange(selectedKey)
                    // Clear rates since service option changed
                    if (onClearRates) {
                      console.log('payment_terms changed, clearing rates...')
                      onClearRates()
                    }
                  }
                }}
                color={!watch('payment_terms') ? "warning" : "default"}
              >
                <SelectItem key="free_of_charge" value="free_of_charge">
                  Free Of Charge
                </SelectItem>
                <SelectItem key="charge" value="charge">
                  Charge
                </SelectItem>
              </Select>

            )}
          />

          <Textarea
            {...register('remark', { required: false })}
            label={<span>Remark</span>}
            placeholder="Enter remark"
            errorMessage={errors.remark?.message}
            isInvalid={!!errors.remark}
            minRows={1}
            className='hidden'
          />

        </div>
      </CardBody>
    </Card>
  )
}

export default BasicInformation
