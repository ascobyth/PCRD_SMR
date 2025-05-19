"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  Layers,
  Beaker,
  FlaskConical,
  Microscope,
  Save,
  CalendarClock,
  Settings,
  List,
  GripVertical,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, addDays, isWeekend, isSameDay, parseISO, isValid, addHours } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Type definitions
type Request = {
  id: string
  title: string
  type: string
  capability: string
  status: string
  priority: string
  requester: string
  requestDate: string
  dueDate: string
  suggestedDueDate: string
  assignedTo: string
  progress: number
  samples: number
  department: string
  description: string
  equipment: string
  estimatedHours: number
  color?: string
}

type Equipment = {
  id: number
  name: string
  capability: string
  operator: string
  availability: number
}

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  requestId: string
  equipment: string
  priority: string
  color: string
}

type CalculationSettings = {
  skipWeekends: boolean
  workingHoursStart: number
  workingHoursEnd: number
  exceptionalDays: string[]
  useWorkingHours: boolean
}

export default function AssignDuePage() {
  // State variables
  const [searchQuery, setSearchQuery] = useState("")
  const [capabilityFilter, setCapabilityFilter] = useState("all")
  const [equipmentFilter, setEquipmentFilter] = useState("all")
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [groupByEquipment, setGroupByEquipment] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null)
  const [calculationSettings, setCalculationSettings] = useState<CalculationSettings>({
    skipWeekends: true,
    workingHoursStart: 8,
    workingHoursEnd: 17,
    exceptionalDays: [],
    useWorkingHours: true,
  })
  const [exceptionalDayInput, setExceptionalDayInput] = useState("")
  const [showSettingsSheet, setShowSettingsSheet] = useState(false)

  // Mock data for requests that are accepted but not completed
  const [requests, setRequests] = useState<Request[]>([
    {
      id: "REQ-2023-001",
      title: "HDPE Film Analysis",
      type: "NTR",
      capability: "Mechanical",
      status: "in-progress",
      priority: "high",
      requester: "John Smith",
      requestDate: "2023-10-15",
      dueDate: "2023-10-25",
      suggestedDueDate: "2023-10-24",
      assignedTo: "Mary Johnson",
      progress: 20,
      samples: 3,
      department: "Packaging R&D",
      description: "Analysis of tensile strength and elongation properties of HDPE film samples.",
      equipment: "Tensile Tester",
      estimatedHours: 4,
      color: "#EF4444",
    },
    {
      id: "REQ-2023-002",
      title: "PP Copolymer Characterization",
      type: "NTR",
      capability: "Thermal",
      status: "in-progress",
      priority: "medium",
      requester: "Sarah Lee",
      requestDate: "2023-10-14",
      dueDate: "2023-10-28",
      suggestedDueDate: "2023-10-26",
      assignedTo: "David Chen",
      progress: 45,
      samples: 2,
      department: "Product Development",
      description: "Thermal analysis of PP copolymer samples for new product development.",
      equipment: "DSC",
      estimatedHours: 6,
      color: "#F97316",
    },
    {
      id: "REQ-2023-005",
      title: "LDPE Film Tensile Strength",
      type: "NTR",
      capability: "Mechanical",
      status: "pending",
      priority: "medium",
      requester: "Emily Davis",
      requestDate: "2023-10-16",
      dueDate: "",
      suggestedDueDate: "2023-10-27",
      assignedTo: "Mary Johnson",
      progress: 0,
      samples: 4,
      department: "Film Production",
      description: "Tensile strength testing of LDPE film samples from different production batches.",
      equipment: "Tensile Tester",
      estimatedHours: 5,
      color: "#F97316",
    },
    {
      id: "REQ-2023-006",
      title: "GC-MS Equipment Reservation",
      type: "ER",
      capability: "Analytical",
      status: "approved",
      priority: "medium",
      requester: "James Wilson",
      requestDate: "2023-10-13",
      dueDate: "",
      suggestedDueDate: "2023-10-23",
      assignedTo: "Alex Martinez",
      progress: 0,
      samples: 0,
      department: "R&D Chemistry",
      description: "Reservation of GC-MS equipment for volatile compound analysis.",
      equipment: "GC-MS",
      estimatedHours: 8,
      color: "#F97316",
    },
    {
      id: "REQ-2023-007",
      title: "Polymer Blend Compatibility Study",
      type: "ASR",
      capability: "R&D",
      status: "in-progress",
      priority: "high",
      requester: "Jennifer Taylor",
      requestDate: "2023-10-11",
      dueDate: "2023-10-30",
      suggestedDueDate: "2023-10-29",
      assignedTo: "Thomas Anderson",
      progress: 65,
      samples: 6,
      department: "Materials Research",
      description: "Research study on compatibility of novel polymer blends for automotive applications.",
      equipment: "FTIR",
      estimatedHours: 12,
      color: "#EF4444",
    },
    {
      id: "REQ-2023-008",
      title: "FTIR Analysis of Unknown Residue",
      type: "ASR",
      capability: "Analytical",
      status: "pending",
      priority: "urgent",
      requester: "Karen White",
      requestDate: "2023-10-17",
      dueDate: "",
      suggestedDueDate: "2023-10-22",
      assignedTo: "Alex Martinez",
      progress: 0,
      samples: 1,
      department: "Quality Assurance",
      description: "Urgent analysis of unknown residue found in production equipment.",
      equipment: "FTIR",
      estimatedHours: 3,
      color: "#DC2626",
    },
    {
      id: "REQ-2023-009",
      title: "Impact Testing of ABS Samples",
      type: "NTR",
      capability: "Mechanical",
      status: "pending",
      priority: "medium",
      requester: "Robert Chen",
      requestDate: "2023-10-18",
      dueDate: "",
      suggestedDueDate: "2023-10-25",
      assignedTo: "Mary Johnson",
      progress: 0,
      samples: 5,
      department: "Automotive",
      description: "Impact testing of ABS samples for automotive interior components.",
      equipment: "Impact Tester",
      estimatedHours: 4,
      color: "#F97316",
    },
    {
      id: "REQ-2023-010",
      title: "TGA Analysis of Composite Materials",
      type: "ASR",
      capability: "Thermal",
      status: "pending",
      priority: "high",
      requester: "Lisa Wong",
      requestDate: "2023-10-19",
      dueDate: "",
      suggestedDueDate: "2023-10-26",
      assignedTo: "David Chen",
      progress: 0,
      samples: 3,
      department: "Aerospace",
      description: "Thermogravimetric analysis of composite materials for aerospace applications.",
      equipment: "TGA",
      estimatedHours: 7,
      color: "#EF4444",
    },
  ])

  // Mock data for equipment
  const equipment: Equipment[] = [
    { id: 1, name: "Tensile Tester", capability: "Mechanical", operator: "Mary Johnson", availability: 0.7 },
    { id: 2, name: "Impact Tester", capability: "Mechanical", operator: "Mary Johnson", availability: 0.8 },
    { id: 3, name: "DSC", capability: "Thermal", operator: "David Chen", availability: 0.6 },
    { id: 4, name: "TGA", capability: "Thermal", operator: "David Chen", availability: 0.5 },
    { id: 5, name: "GC-MS", capability: "Analytical", operator: "Alex Martinez", availability: 0.4 },
    { id: 6, name: "FTIR", capability: "Analytical", operator: "Alex Martinez", availability: 0.3 },
    { id: 7, name: "SEM", capability: "Microscopy", operator: "Lisa Wong", availability: 0.9 },
    { id: 8, name: "Optical Microscope", capability: "Microscopy", operator: "Lisa Wong", availability: 0.8 },
  ]

  // Get unique capabilities
  const capabilities = Array.from(new Set(equipment.map((eq) => eq.capability)))

  // Filter requests based on active tab
  const tabFilteredRequests = requests.filter((req) => {
    if (activeTab === "pending") return req.dueDate === ""
    if (activeTab === "assigned") return req.dueDate !== ""
    return true
  })

  // Apply capability filter
  const capabilityFilteredRequests =
    capabilityFilter === "all"
      ? tabFilteredRequests
      : tabFilteredRequests.filter((req) => req.capability === capabilityFilter)

  // Apply equipment filter
  const equipmentFilteredRequests =
    equipmentFilter === "all"
      ? capabilityFilteredRequests
      : capabilityFilteredRequests.filter((req) => req.equipment === equipmentFilter)

  // Apply search filter
  const searchFilteredRequests = searchQuery
    ? equipmentFilteredRequests.filter(
        (req) =>
          req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.department.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : equipmentFilteredRequests

  // Final displayed requests
  const displayRequests = searchFilteredRequests

  // Check if a date is in the exceptional days list
  function isExceptionalDay(date: Date, exceptionalDays: string[]): boolean {
    const dateStr = format(date, "yyyy-MM-dd")
    return exceptionalDays.includes(dateStr)
  }

  // Calculate start date based on due date, hours, and settings
  function calculateStartDate(dueDate: Date, hours: number, settings: CalculationSettings): Date {
    let currentDate = new Date(dueDate)
    let remainingHours = hours

    // If not using working hours, simply subtract the total hours
    if (!settings.useWorkingHours) {
      return addHours(currentDate, -hours)
    }

    // Calculate working hours per day
    const workingHoursPerDay = settings.workingHoursEnd - settings.workingHoursStart

    while (remainingHours > 0) {
      // Move back one day
      currentDate = addDays(currentDate, -1)

      // Skip weekends if setting is enabled
      if (settings.skipWeekends && isWeekend(currentDate)) {
        continue
      }

      // Skip exceptional days
      if (isExceptionalDay(currentDate, settings.exceptionalDays)) {
        continue
      }

      // Subtract working hours for this day
      remainingHours -= Math.min(remainingHours, workingHoursPerDay)
    }

    // Set the time to the end of working hours
    currentDate.setHours(settings.workingHoursEnd, 0, 0, 0)

    return currentDate
  }

  // Calculate suggested due date based on request date, hours, and settings
  function calculateSuggestedDueDate(requestDate: string, hours: number, settings: CalculationSettings): string {
    let currentDate = new Date(requestDate)
    let remainingHours = hours

    // If not using working hours, simply add the total hours
    if (!settings.useWorkingHours) {
      const dueDate = addHours(currentDate, hours)
      return format(dueDate, "MM/dd/yyyy")
    }

    // Calculate working hours per day
    const workingHoursPerDay = settings.workingHoursEnd - settings.workingHoursStart

    while (remainingHours > 0) {
      // Move forward one day
      currentDate = addDays(currentDate, 1)

      // Skip weekends if setting is enabled
      if (settings.skipWeekends && isWeekend(currentDate)) {
        continue
      }

      // Skip exceptional days
      if (isExceptionalDay(currentDate, settings.exceptionalDays)) {
        continue
      }

      // Subtract working hours for this day
      remainingHours -= Math.min(remainingHours, workingHoursPerDay)
    }

    // Set the time to the end of working hours
    currentDate.setHours(settings.workingHoursEnd, 0, 0, 0)

    return format(currentDate, "MM/dd/yyyy")
  }

  // Generate calendar events from requests with due dates
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return requests
      .filter((req) => req.dueDate)
      .map((req) => {
        const dueDate = new Date(req.dueDate)
        // Calculate start date based on estimated hours and settings
        const startDate = calculateStartDate(dueDate, req.estimatedHours, calculationSettings)

        return {
          id: `event-${req.id}`,
          title: req.title,
          start: startDate,
          end: dueDate,
          requestId: req.id,
          equipment: req.equipment,
          priority: req.priority,
          color: req.color || getColorForPriority(req.priority),
        }
      })
  }, [requests, calculationSettings])

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate how many days from the previous month we need to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate how many days from the next month we need to show to complete the grid
    const totalDaysToShow = Math.ceil((daysInMonth + daysFromPrevMonth) / 7) * 7
    const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth

    const days = []

    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 1)
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      days.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i),
        isCurrentMonth: false,
        isWeekend: isWeekend(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i)),
        isExceptional: isExceptionalDay(
          new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i),
          calculationSettings.exceptionalDays,
        ),
      })
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        isWeekend: isWeekend(new Date(year, month, i)),
        isExceptional: isExceptionalDay(new Date(year, month, i), calculationSettings.exceptionalDays),
      })
    }

    // Add days from next month
    const nextMonth = new Date(year, month + 1, 1)
    for (let i = 1; i <= daysFromNextMonth; i++) {
      days.push({
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i),
        isCurrentMonth: false,
        isWeekend: isWeekend(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i)),
        isExceptional: isExceptionalDay(
          new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i),
          calculationSettings.exceptionalDays,
        ),
      })
    }

    return days
  }, [currentMonth, calculationSettings.exceptionalDays])

  // Group events by equipment
  const eventsByEquipment = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}

    calendarEvents.forEach((event) => {
      if (!grouped[event.equipment]) {
        grouped[event.equipment] = []
      }
      grouped[event.equipment].push(event)
    })

    return grouped
  }, [calendarEvents])

  // Get color based on priority
  function getColorForPriority(priority: string): string {
    switch (priority) {
      case "urgent":
        return "#DC2626" // Red
      case "high":
        return "#EF4444" // Light Red
      case "medium":
        return "#F97316" // Orange
      case "low":
        return "#22C55E" // Green
      default:
        return "#6B7280" // Gray
    }
  }

  // Handle checkbox selection
  const toggleSelectRequest = (id: string) => {
    setSelectedRequests((prev) => (prev.includes(id) ? prev.filter((requestId) => requestId !== id) : [...prev, id]))
  }

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedRequests.length === displayRequests.length) {
      setSelectedRequests([])
    } else {
      setSelectedRequests(displayRequests.map((req) => req.id))
    }
  }

  // Handle assigning due date to selected requests
  const assignDueDate = () => {
    if (!selectedDate || selectedRequests.length === 0) return

    const formattedDate = format(selectedDate, "MM/dd/yyyy")

    setRequests(requests.map((req) => (selectedRequests.includes(req.id) ? { ...req, dueDate: formattedDate } : req)))

    // Clear selection after assigning
    setSelectedRequests([])
    setSelectedDate(undefined)
  }

  // Handle auto-assign due dates
  const autoAssignDueDates = () => {
    // Recalculate suggested due dates based on current settings
    const updatedRequests = requests.map((req) => {
      if (req.dueDate === "") {
        const suggestedDueDate = calculateSuggestedDueDate(req.requestDate, req.estimatedHours, calculationSettings)
        return {
          ...req,
          suggestedDueDate,
          dueDate: suggestedDueDate,
        }
      }
      return req
    })

    setRequests(updatedRequests)
  }

  // Handle recalculating suggested due dates
  const recalculateSuggestedDueDates = () => {
    const updatedRequests = requests.map((req) => {
      const suggestedDueDate = calculateSuggestedDueDate(req.requestDate, req.estimatedHours, calculationSettings)
      return {
        ...req,
        suggestedDueDate,
      }
    })

    setRequests(updatedRequests)
  }

  // Handle adding exceptional day
  const addExceptionalDay = () => {
    if (!exceptionalDayInput) return

    try {
      // Try to parse the date
      const date = parseISO(exceptionalDayInput)

      if (!isValid(date)) {
        alert("Please enter a valid date in YYYY-MM-DD format")
        return
      }

      const formattedDate = format(date, "yyyy-MM-dd")

      if (calculationSettings.exceptionalDays.includes(formattedDate)) {
        alert("This date is already in the exceptional days list")
        return
      }

      setCalculationSettings((prev) => ({
        ...prev,
        exceptionalDays: [...prev.exceptionalDays, formattedDate],
      }))

      setExceptionalDayInput("")
    } catch (error) {
      alert("Please enter a valid date in YYYY-MM-DD format")
    }
  }

  // Handle removing exceptional day
  const removeExceptionalDay = (date: string) => {
    setCalculationSettings((prev) => ({
      ...prev,
      exceptionalDays: prev.exceptionalDays.filter((d) => d !== date),
    }))
  }

  // Handle drag start
  const handleDragStart = (requestId: string) => {
    setDraggedEvent(requestId)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle drop on calendar day
  const handleDrop = (date: Date) => {
    if (!draggedEvent) return

    const formattedDate = format(date, "MM/dd/yyyy")

    setRequests(requests.map((req) => (req.id === draggedEvent ? { ...req, dueDate: formattedDate } : req)))

    setDraggedEvent(null)
  }

  // Capability icon component
  const CapabilityIcon = ({ capability }: { capability: string }) => {
    switch (capability.toLowerCase()) {
      case "mechanical":
        return <Layers className="h-4 w-4 text-blue-600" />
      case "thermal":
        return <FlaskConical className="h-4 w-4 text-orange-600" />
      case "microscopy":
        return <Microscope className="h-4 w-4 text-purple-600" />
      case "physical":
        return <Beaker className="h-4 w-4 text-green-600" />
      case "analytical":
        return <FlaskConical className="h-4 w-4 text-red-600" />
      case "r&d":
        return <Beaker className="h-4 w-4 text-indigo-600" />
      default:
        return <Beaker className="h-4 w-4 text-gray-600" />
    }
  }

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-500 text-white hover:bg-red-600 font-medium px-3">Urgent</Badge>
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 font-medium px-3">High</Badge>
      case "medium":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-medium px-3">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-medium px-3">Low</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  // Effect to recalculate suggested due dates when calculation settings change
  useEffect(() => {
    recalculateSuggestedDueDates()
  }, [calculationSettings])

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex flex-col">
        {/* Top navigation */}
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container flex h-16 items-center px-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                <Link href="/request-management">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Request Management
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="container px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Assign Due Dates</h1>
              <p className="text-muted-foreground">Manage and schedule due dates for accepted requests</p>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Calculation Settings
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Due Date Calculation Settings</SheetTitle>
                    <SheetDescription>
                      Configure how due dates are calculated based on working hours and exceptions.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="useWorkingHours">Use Working Hours</Label>
                          <p className="text-sm text-muted-foreground">
                            Calculate due dates based on working hours instead of calendar days
                          </p>
                        </div>
                        <Switch
                          id="useWorkingHours"
                          checked={calculationSettings.useWorkingHours}
                          onCheckedChange={(checked) =>
                            setCalculationSettings((prev) => ({ ...prev, useWorkingHours: checked }))
                          }
                        />
                      </div>

                      {calculationSettings.useWorkingHours && (
                        <>
                          <div className="space-y-2">
                            <Label>Working Hours</Label>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Start: {calculationSettings.workingHoursStart}:00</span>
                              <span className="text-sm">End: {calculationSettings.workingHoursEnd}:00</span>
                            </div>
                            <div className="pt-2">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="workingHoursStart">Start Time</Label>
                                  <span className="text-sm text-muted-foreground">
                                    {calculationSettings.workingHoursStart}:00
                                  </span>
                                </div>
                                <Slider
                                  id="workingHoursStart"
                                  min={0}
                                  max={23}
                                  step={1}
                                  value={[calculationSettings.workingHoursStart]}
                                  onValueChange={(value) =>
                                    setCalculationSettings((prev) => ({
                                      ...prev,
                                      workingHoursStart: value[0],
                                      workingHoursEnd: Math.max(prev.workingHoursEnd, value[0] + 1),
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-1 mt-4">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="workingHoursEnd">End Time</Label>
                                  <span className="text-sm text-muted-foreground">
                                    {calculationSettings.workingHoursEnd}:00
                                  </span>
                                </div>
                                <Slider
                                  id="workingHoursEnd"
                                  min={1}
                                  max={24}
                                  step={1}
                                  value={[calculationSettings.workingHoursEnd]}
                                  onValueChange={(value) =>
                                    setCalculationSettings((prev) => ({
                                      ...prev,
                                      workingHoursEnd: value[0],
                                      workingHoursStart: Math.min(prev.workingHoursStart, value[0] - 1),
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="skipWeekends">Skip Weekends</Label>
                              <p className="text-sm text-muted-foreground">
                                Don't count Saturday and Sunday in due date calculations
                              </p>
                            </div>
                            <Switch
                              id="skipWeekends"
                              checked={calculationSettings.skipWeekends}
                              onCheckedChange={(checked) =>
                                setCalculationSettings((prev) => ({ ...prev, skipWeekends: checked }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Exceptional Days</Label>
                            <p className="text-sm text-muted-foreground">
                              Add specific dates to exclude from calculations (holidays, maintenance days, etc.)
                            </p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="YYYY-MM-DD"
                                value={exceptionalDayInput}
                                onChange={(e) => setExceptionalDayInput(e.target.value)}
                              />
                              <Button onClick={addExceptionalDay} type="button">
                                Add
                              </Button>
                            </div>
                            <div className="mt-2">
                              {calculationSettings.exceptionalDays.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {calculationSettings.exceptionalDays.map((day) => (
                                    <Badge key={day} variant="outline" className="flex items-center gap-1">
                                      {day}
                                      <button
                                        onClick={() => removeExceptionalDay(day)}
                                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No exceptional days added</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <SheetFooter>
                    <Button type="button">Apply Settings</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              <Button variant="outline" className="flex items-center gap-2" onClick={autoAssignDueDates}>
                <RefreshCw className="h-4 w-4" />
                Auto-Assign All
              </Button>
              <Button className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex justify-end mb-4">
            <div className="bg-muted/30 p-1 rounded-md">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
                Table View
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-4 w-4" />
                Calendar View
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6">
            {/* Filters and controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search requests..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={capabilityFilter} onValueChange={setCapabilityFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Capability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Capability</SelectLabel>
                          <SelectItem value="all">All Capabilities</SelectItem>
                          {capabilities.map((capability) => (
                            <SelectItem key={capability} value={capability}>
                              {capability}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Equipment</SelectLabel>
                          <SelectItem value="all">All Equipment</SelectItem>
                          {equipment
                            .filter((eq) => capabilityFilter === "all" || eq.capability === capabilityFilter)
                            .map((eq) => (
                              <SelectItem key={eq.id} value={eq.name}>
                                {eq.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {viewMode === "table" && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="groupByEquipment"
                          checked={groupByEquipment}
                          onCheckedChange={(checked) => setGroupByEquipment(checked as boolean)}
                        />
                        <label htmlFor="groupByEquipment" className="text-sm cursor-pointer">
                          Group by Operator/Equipment
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs - Fixed to prevent overlapping */}
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="pending" className="flex items-center justify-center gap-2">
                  <span>Pending Assignment</span>
                  <Badge variant="secondary">{requests.filter((req) => req.dueDate === "").length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="assigned" className="flex items-center justify-center gap-2">
                  <span>Assigned</span>
                  <Badge variant="secondary">{requests.filter((req) => req.dueDate !== "").length}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Batch actions for table view */}
            {viewMode === "table" && selectedRequests.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted/10 border rounded-md">
                <div className="text-sm">
                  <span className="font-medium">{selectedRequests.length}</span> requests selected
                </div>
                <div className="flex gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={assignDueDate}
                    disabled={!selectedDate}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Assign Due Date
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedRequests([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedRequests.length === displayRequests.length && displayRequests.length > 0}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Select all requests"
                            />
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Capability</TableHead>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Suggested Due</TableHead>
                        <TableHead>Assigned Due</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRequests.length > 0 ? (
                        displayRequests.map((request) => {
                          const eq = equipment.find((e) => e.name === request.equipment)
                          return (
                            <TableRow
                              key={request.id}
                              className="hover:bg-muted/30"
                              draggable={true}
                              onDragStart={() => handleDragStart(request.id)}
                            >
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={selectedRequests.includes(request.id)}
                                    onCheckedChange={() => toggleSelectRequest(request.id)}
                                    aria-label={`Select request ${request.id}`}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{request.id}</TableCell>
                              <TableCell>
                                <div className="font-medium">{request.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {request.requester} • {request.department}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <CapabilityIcon capability={request.capability} />
                                  {request.capability}
                                </div>
                              </TableCell>
                              <TableCell>{request.equipment}</TableCell>
                              <TableCell>{eq?.operator || "Unassigned"}</TableCell>
                              <TableCell>
                                <PriorityBadge priority={request.priority} />
                              </TableCell>
                              <TableCell>{request.estimatedHours} hrs</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {request.suggestedDueDate}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {request.dueDate ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {request.dueDate}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    Not Assigned
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                        <CalendarClock className="h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                      <div className="p-2">
                                        <h4 className="font-medium mb-2">Set Due Date</h4>
                                        <CalendarComponent
                                          mode="single"
                                          selected={request.dueDate ? new Date(request.dueDate) : undefined}
                                          onSelect={(date) => {
                                            if (date) {
                                              const formattedDate = format(date, "MM/dd/yyyy")
                                              setRequests(
                                                requests.map((req) =>
                                                  req.id === request.id ? { ...req, dueDate: formattedDate } : req,
                                                ),
                                              )
                                            }
                                          }}
                                          initialFocus
                                        />
                                        <div className="flex justify-end mt-2">
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setRequests(
                                                requests.map((req) =>
                                                  req.id === request.id ? { ...req, dueDate: "" } : req,
                                                ),
                                              )
                                            }}
                                            variant="outline"
                                            className="mr-2"
                                          >
                                            Clear
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setRequests(
                                                requests.map((req) =>
                                                  req.id === request.id
                                                    ? { ...req, dueDate: req.suggestedDueDate }
                                                    : req,
                                                ),
                                              )
                                            }}
                                          >
                                            Use Suggested
                                          </Button>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                            No requests found for the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Calendar View */}
            {viewMode === "calendar" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium">Calendar View</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                        }
                      >
                        Previous Month
                      </Button>
                      <span className="font-medium">{format(currentMonth, "MMMM yyyy")}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                        }
                      >
                        Next Month
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-7 text-center font-medium bg-muted/30 border-b">
                      <div className="py-2">Sunday</div>
                      <div className="py-2">Monday</div>
                      <div className="py-2">Tuesday</div>
                      <div className="py-2">Wednesday</div>
                      <div className="py-2">Thursday</div>
                      <div className="py-2">Friday</div>
                      <div className="py-2">Saturday</div>
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr border-b">
                      {calendarDays.map((day, index) => {
                        // Get events for this day
                        const dayEvents = calendarEvents.filter((event) => isSameDay(event.end, day.date))

                        return (
                          <div
                            key={index}
                            className={`min-h-[120px] border-r last:border-r-0 border-b last:border-b-0 p-1 ${
                              !day.isCurrentMonth ? "bg-muted/20 text-muted-foreground" : ""
                            } ${day.isWeekend && calculationSettings.skipWeekends ? "bg-muted/30" : ""} ${
                              day.isExceptional ? "bg-yellow-50" : ""
                            }`}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(day.date)}
                          >
                            <div className="flex justify-between items-start">
                              <span
                                className={`text-sm font-medium ${!day.isCurrentMonth ? "text-muted-foreground" : ""}`}
                              >
                                {format(day.date, "d")}
                              </span>
                              {day.isWeekend && calculationSettings.skipWeekends && (
                                <Badge variant="outline" className="text-xs bg-muted/50">
                                  Weekend
                                </Badge>
                              )}
                              {day.isExceptional && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                  Exception
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 space-y-1 max-h-[100px] overflow-y-auto">
                              {dayEvents.map((event) => {
                                const request = requests.find((req) => req.id === event.requestId)
                                if (!request) return null

                                return (
                                  <div
                                    key={event.id}
                                    className="text-xs p-1 rounded-sm text-white overflow-hidden text-ellipsis"
                                    style={{ backgroundColor: event.color }}
                                    title={`${request.title} - ${request.equipment} - ${request.estimatedHours} hrs`}
                                  >
                                    <div className="font-medium">{request.title}</div>
                                    <div className="flex justify-between">
                                      <span>{request.equipment}</span>
                                      <span>{request.estimatedHours} hrs</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Draggable requests for calendar view */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg font-medium">Pending Requests</CardTitle>
                    <CardDescription>Drag and drop requests onto the calendar to assign due dates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayRequests
                        .filter((req) => req.dueDate === "")
                        .map((request) => (
                          <div
                            key={request.id}
                            className="border rounded-md p-3 cursor-move hover:shadow-md transition-shadow"
                            draggable={true}
                            onDragStart={() => handleDragStart(request.id)}
                            style={{
                              borderLeftColor: request.color || getColorForPriority(request.priority),
                              borderLeftWidth: "4px",
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{request.title}</h4>
                                <p className="text-sm text-muted-foreground">{request.id}</p>
                              </div>
                              <PriorityBadge priority={request.priority} />
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <CapabilityIcon capability={request.capability} />
                                <span>
                                  {request.capability} - {request.equipment}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{request.estimatedHours} hours</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Suggested: {request.suggestedDueDate}</span>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

