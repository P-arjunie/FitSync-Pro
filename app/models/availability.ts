import mongoose, { Schema } from "mongoose"

// Define the schema for time slots
const TimeSlotSchema = new Schema({
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
})

// Define the schema for day availability
const DayAvailabilitySchema = new Schema({
  enabled: {
    type: Boolean,
    default: false,
  },
  timeSlots: {
    type: [TimeSlotSchema],
    default: [{ startTime: "09:00", endTime: "17:00" }],
  },
})

// Define the schema for weekly availability
const AvailabilitySchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  schedule: {
    Monday: DayAvailabilitySchema,
    Tuesday: DayAvailabilitySchema,
    Wednesday: DayAvailabilitySchema,
    Thursday: DayAvailabilitySchema,
    Friday: DayAvailabilitySchema,
    Saturday: DayAvailabilitySchema,
    Sunday: DayAvailabilitySchema,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Create or retrieve the model
export const Availability = mongoose.models.Availability || mongoose.model("Availability", AvailabilitySchema)
