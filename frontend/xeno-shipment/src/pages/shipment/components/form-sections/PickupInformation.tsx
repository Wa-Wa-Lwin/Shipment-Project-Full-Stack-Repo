import { Card, CardHeader, CardBody, Input, Textarea, Alert } from '@heroui/react'
import { Controller } from 'react-hook-form'
import type { FormSectionProps } from '../../types/shipment-form.types'
import { getDefaultPickupValues } from '../../constants/form-defaults'
import { useEffect, useState } from 'react'

interface PickupInformationProps extends FormSectionProps {
  today: string
  setValue?: any
  watch?: any
  onClearRates?: () => void
}

const PickupInformation = ({ register, errors, control, watch, onClearRates }: PickupInformationProps) => {

  // Get default pickup values based on current time
  const { pickupDate: defaultPickupDate, minDate, expectedDeliveryDate: defaultExpectedDeliveryDate } = getDefaultPickupValues()

  // Watch pickup date to adjust start time
  const pickupDate = watch ? watch('pick_up_date') : defaultPickupDate
  const expectedDeliveryDate = watch ? watch('due_date') : defaultExpectedDeliveryDate
  const pickupStartTime = watch ? watch('pick_up_start_time') : ''
  const pickupEndTime = watch ? watch('pick_up_end_time') : ''

  // State to track if pickup date is on weekend
  const [isWeekend, setIsWeekend] = useState(false)
  const [isDeliveryBeforePickup, setIsDeliveryBeforePickup] = useState(false)
  const [isOutsideOfficeHours, setIsOutsideOfficeHours] = useState(false)

  // Check if a date is weekend (Saturday = 6, Sunday = 0)
  const checkIfWeekend = (dateString: string) => {
    if (!dateString) return false
    const date = new Date(dateString + 'T00:00:00')
    const day = date.getDay()
    return day === 0 || day === 6
  }

  // Check if delivery date is before pickup date
  const checkDeliveryBeforePickup = (pickup: string, delivery: string) => {
    if (!pickup || !delivery) return false
    const pickupDate = new Date(pickup + 'T00:00:00')
    const deliveryDate = new Date(delivery + 'T00:00:00')
    return deliveryDate < pickupDate
  }

  // Check if pickup times are outside office hours (9 AM to 5 PM)
  const checkOutsideOfficeHours = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false

    // Convert time strings to minutes for easier comparison
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const officeStartMinutes = 9 * 60 // 9:00 AM
    const officeEndMinutes = 17 * 60 // 5:00 PM

    return startMinutes < officeStartMinutes || endMinutes > officeEndMinutes
  }

  // Update weekend status when pickup date changes
  useEffect(() => {
    if (pickupDate) {
      setIsWeekend(checkIfWeekend(pickupDate))
    }
  }, [pickupDate])

  // Update delivery date validation when either date changes
  useEffect(() => {
    if (pickupDate && expectedDeliveryDate) {
      setIsDeliveryBeforePickup(checkDeliveryBeforePickup(pickupDate, expectedDeliveryDate))
    }
  }, [pickupDate, expectedDeliveryDate])

  // Update office hours validation when pickup times change
  useEffect(() => {
    if (pickupStartTime && pickupEndTime) {
      setIsOutsideOfficeHours(checkOutsideOfficeHours(pickupStartTime, pickupEndTime))
    }
  }, [pickupStartTime, pickupEndTime])

  const normalizeTime = (timeString?: string) => {
    if (!timeString) return ""
    return timeString.split(":").slice(0, 2).join(":") // take first 2 parts (HH:mm)
  }

  const getPickUpStartTime = () => pickupStartTime ? normalizeTime(pickupStartTime) : '09:00'
  const getPickUpEndTime = () => pickupEndTime ? normalizeTime(pickupEndTime) : '17:00'

  return (
    <Card shadow="none">
      {/* <Card shadow="none" className="py-0 px-4 m-0"> */}
      <CardHeader className="px-0 pt-0 pb-1">
        <p className="text-blue-600 font-semibold text-sm">
           (Pickup Date & Time will be based on the pickup country.)
        </p>
      </CardHeader>

      <CardBody className="px-0 pt-0 pb-0">
        {isWeekend && (
          <Alert
            color="danger"
            variant="flat"
            title="Weekend Pickup"
            description="The selected pickup date falls on a weekend. Please confirm this is intentional as most carriers have limited or no weekend service."
            className="mb-3"
          />
        )}
        {isDeliveryBeforePickup && (
          <Alert
            color="danger"
            variant="flat"
            title="Invalid Delivery Date"
            description="The expected delivery date cannot be earlier than the pickup date. Please adjust the dates."
            className="mb-3"
          />
        )}
        {isOutsideOfficeHours && (
          <Alert
            color="danger"
            variant="flat"
            title="Outside Office Hours"
            description="The selected pickup time is outside standard office hours (9:00 AM - 5:00 PM). Please confirm this is intentional as it may affect carrier availability."
            className="mb-3"
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-2 gap-y-5">
          <>
            <Controller
              name="pick_up_date"
              control={control}
              rules={{ required: 'Pickup date is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  isRequired
                  type="date"
                  label={<span>Pickup Date</span>}
                  min={minDate}
                  value={pickupDate || defaultPickupDate}
                  onChange={(e) => {
                    field.onChange(e.target.value) // updates RHF
                    if (onClearRates) {
                      console.log('Pickup date changed, clearing rates...')
                      onClearRates()
                    }
                  }}
                  errorMessage={errors.pick_up_date?.message}
                  isInvalid={!!errors.pick_up_date}
                />
              )}
            />
            <Controller
              name="pick_up_start_time"
              control={control}
              rules={{ required: 'Pickup start time is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  isRequired
                  type="time"
                  label={<span>Start Time</span>}
                  errorMessage={errors.pick_up_start_time?.message}
                  isInvalid={!!errors.pick_up_start_time}
                  value={getPickUpStartTime()}
                  // value={field.value || getPickUpStartTime(pickupDate || defaultPickupDate)}
                  onChange={(e) => {
                    field.onChange(e.target.value) // updates RHF
                    if (onClearRates) {
                      console.log('Pickup start time changed, clearing rates...')
                      onClearRates()
                    }
                  }}
                  color={!watch('pick_up_start_time') ? "warning" : "default"}
                />
              )}
            />

            <Controller
              name="pick_up_end_time"
              control={control}
              rules={{ required: 'Pickup end time is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  isRequired
                  type="time"
                  label={<span>End Time</span>}
                  errorMessage={errors.pick_up_end_time?.message}
                  isInvalid={!!errors.pick_up_end_time}
                  value={getPickUpEndTime()}
                  // value={field.value || getPickUpEndTime()}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    // Clear rates when pickup end time changes
                    if (onClearRates) {
                      console.log('Pickup end time changed, clearing rates...')
                      onClearRates()
                    }
                  }}
                  color={!watch('pick_up_end_time') ? "warning" : "default"}
                />
              )}
            />
            <Controller
              name="due_date"
              control={control}
              rules={{ required: 'Expected delivery date is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  isRequired
                  type="date"
                  label={<span>Expected Delivery Date</span>}
                  min={minDate}
                  value={expectedDeliveryDate}
                  onChange={(e) => {
                    field.onChange(e.target.value) // updates RHF
                    if (onClearRates) {
                      console.log('Expected delivery date changed, clearing rates...')
                      onClearRates()
                    }
                  }}
                  errorMessage={errors.due_date?.message}
                  isInvalid={!!errors.due_date}
                />
              )}
            />
            <div className="col-span-4">
              <Textarea
                {...register('pick_up_instructions')}
                label={<span>Pickup Instructions</span>}
                placeholder="Enter pickup instructions"
                errorMessage={errors.pick_up_instructions?.message}
                isInvalid={!!errors.pick_up_instructions}
                rows={1}
                className="resize-none"
                minRows={1}
              // color={!watch('pick_up_instructions') ? "warning" : "default"}
              />
            </div>
          </>
        </div>
      </CardBody>
    </Card>
  )
}

export default PickupInformation