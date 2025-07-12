"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "../../Components/ui/button"
import { Calendar } from "../../Components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../Components/ui/form"
import { Input } from "../../Components/ui/input"
import { Textarea } from "../../Components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "../../Components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select"
import { useToast } from "../components/ui/use-toast"
import { cn } from "@/lib/utils"

//validation with zod - min length field + valid format
const formSchema = z.object({
  title: z.string().min(2, {
    message: "Session title must be at least 2 characters.",
  }),
  trainerName: z.string().min(2, {
    message: "Trainer name must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
  startTime: z.string({
    required_error: "Please select a start time.",
  }),
  endTime: z.string({
    required_error: "Please select an end time.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  maxParticipants: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) > 0, {
    message: "Maximum participants must be a positive number.",
  }),
  description: z.string().optional(),
})

export default function SessionForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Get trainer name from localStorage
  const trainerName = typeof window !== "undefined" ? localStorage.getItem("userName") || "" : ""
  const trainerId = typeof window !== "undefined" ? localStorage.getItem("userId") || "" : ""

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      //default values for form
      title: "",
      trainerName: trainerName, // Auto-fill trainer name
      location: "",
      maxParticipants: "10",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // Create session object with start and end dates
      const formattedDate = format(values.date, "yyyy-MM-dd")
      const start = new Date(`${formattedDate}T${values.startTime}`)
      const end = new Date(`${formattedDate}T${values.endTime}`)

      const sessionData = {
        ...values,
        start,
        end,
        trainerId, // <-- Make sure this is present
      }

      console.log("Submitting sessionData:", sessionData) // <-- Add this log

      // Send data to API
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Session scheduled",
          description: "Your session has been successfully scheduled.",
        })
        form.reset()
        router.refresh()
        // Switch to calendar tab
        const calendarTab = document.querySelector('[value="calendar"]') as HTMLElement
        if (calendarTab) calendarTab.click()
      } else if (response.status === 409) {
        // Scheduling conflict
        toast({
          title: "Scheduling Conflict",
          description: data.error || "The trainer is already booked during this time.",
          variant: "destructive",
        })
      } else {
        // Other errors
        toast({
          title: "Error",
          description: data.error || "There was a problem scheduling your session.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: "There was a problem scheduling your session.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <h2 className="text-2xl font-bold text-black">Schedule a New Session</h2>
          <p className="text-gray-600 mt-1">Fill out the details below to create a new training session</p>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-semibold">Session Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., HIIT Workout, Yoga Class"
                          className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trainerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-semibold">Trainer Name</FormLabel>
                      <FormControl>
                        <Input className="border-gray-300 bg-gray-50 text-gray-700" {...field} readOnly />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-black font-semibold">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal border-gray-300 hover:bg-gray-50",
                                !field.value && "text-gray-500",
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 text-gray-500" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="bg-white"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-semibold">Start Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-gray-200">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const hour = i.toString().padStart(2, "0")
                            return (
                              <>
                                <SelectItem key={`${hour}:00`} value={`${hour}:00`} className="hover:bg-gray-50">
                                  {`${hour}:00`}
                                </SelectItem>
                                <SelectItem key={`${hour}:30`} value={`${hour}:30`} className="hover:bg-gray-50">
                                  {`${hour}:30`}
                                </SelectItem>
                              </>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-semibold">End Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-gray-200">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const hour = i.toString().padStart(2, "0")
                            return (
                              <>
                                <SelectItem key={`${hour}:00`} value={`${hour}:00`} className="hover:bg-gray-50">
                                  {`${hour}:00`}
                                </SelectItem>
                                <SelectItem key={`${hour}:30`} value={`${hour}:30`} className="hover:bg-gray-50">
                                  {`${hour}:30`}
                                </SelectItem>
                              </>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-semibold">Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Studio 1, Main Gym Floor"
                          className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-semibold">Maximum Participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-600" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black font-semibold">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details about the session"
                        className="min-h-[100px] border-gray-300 focus:border-red-500 focus:ring-red-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Scheduling...
                  </div>
                ) : (
                  "Schedule Session"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
