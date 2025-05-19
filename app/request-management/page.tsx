"use client"

import React from "react"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Clock,
  Search,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  Bell,
  Calendar,
  BarChart3,
  Beaker,
  FlaskConical,
  Microscope,
  AlertCircle,
  MessageSquare,
  ClipboardList,
  Layers,
  Users,
  MoreHorizontal,
  Check,
  X,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { RequestSummaryDialog } from "@/components/request-summary-dialog"

export default function RequestManagementPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [activeView, setActiveView] = useState("list")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)

  // Mock data for requests
  const [requests, setRequests] = useState([
    {
      id: "REQ-2023-001",
      title: "HDPE Film Analysis",
      type: "NTR",
      capability: "Mechanical",
      status: "pending",
      priority: "high",
      requester: "John Smith",
      requestDate: "2023-10-15",
      dueDate: "2023-10-20",
      assignedTo: "Mary Johnson",
      progress: 0,
      samples: 3,
      department: "Packaging R&D",
      description: "Analysis of tensile strength and elongation properties of HDPE film samples.",
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
      dueDate: "2023-10-22",
      assignedTo: "David Chen",
      progress: 45,
      samples: 2,
      department: "Product Development",
      description: "Thermal analysis of PP copolymer samples for new product development.",
    },
    {
      id: "REQ-2023-003",
      title: "LLDPE Failure Analysis",
      type: "ASR",
      capability: "Microscopy",
      status: "completed",
      priority: "high",
      requester: "Michael Brown",
      requestDate: "2023-10-10",
      dueDate: "2023-10-18",
      assignedTo: "Lisa Wong",
      progress: 100,
      samples: 1,
      department: "Quality Control",
      description: "Investigation of failure mechanism in LLDPE film used in food packaging.",
    },
    {
      id: "REQ-2023-004",
      title: "PET Bottle Testing",
      type: "NTR",
      capability: "Physical",
      status: "rejected",
      priority: "low",
      requester: "Robert Johnson",
      requestDate: "2023-10-12",
      dueDate: "2023-10-19",
      assignedTo: "Unassigned",
      progress: 0,
      samples: 5,
      department: "Beverage Packaging",
      description: "Standard physical testing of PET bottles for carbonated beverages.",
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
      dueDate: "2023-10-23",
      assignedTo: "Unassigned",
      progress: 0,
      samples: 4,
      department: "Film Production",
      description: "Tensile strength testing of LDPE film samples from different production batches.",
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
      dueDate: "2023-10-21",
      assignedTo: "Alex Martinez",
      progress: 0,
      samples: 0,
      department: "R&D Chemistry",
      description: "Reservation of GC-MS equipment for volatile compound analysis.",
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
      dueDate: "2023-10-25",
      assignedTo: "Thomas Anderson",
      progress: 65,
      samples: 6,
      department: "Materials Research",
      description: "Research study on compatibility of novel polymer blends for automotive applications.",
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
      dueDate: "2023-10-19",
      assignedTo: "Unassigned",
      progress: 0,
      samples: 1,
      department: "Quality Assurance",
      description: "Urgent analysis of unknown residue found in production equipment.",
    },
  ])

  // Filter requests based on active tab (request type)
  const typeFilteredRequests =
    activeTab === "all" ? requests : requests.filter((request) => request.type.toLowerCase() === activeTab)

  // Apply status filter
  const statusFilteredRequests =
    statusFilter === "all" ? typeFilteredRequests : typeFilteredRequests.filter((req) => req.status === statusFilter)

  // Apply priority filter
  const priorityFilteredRequests =
    priorityFilter === "all"
      ? statusFilteredRequests
      : statusFilteredRequests.filter((req) => req.priority === priorityFilter)

  // Apply search filter
  const searchFilteredRequests = searchQuery
    ? priorityFilteredRequests.filter(
        (req) =>
          req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.department.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : priorityFilteredRequests

  // Final displayed requests
  const displayRequests = searchFilteredRequests

  // Count requests by status
  const pendingCount = requests.filter((req) => req.status === "pending").length
  const inProgressCount = requests.filter((req) => req.status === "in-progress" || req.status === "approved").length
  const completedCount = requests.filter((req) => req.status === "completed").length

  // Check if we should show checkboxes (when filtering by pending, in-progress, or completed)
  const showCheckboxes = statusFilter === "pending" || statusFilter === "in-progress" || statusFilter === "completed"

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

  // Handle batch actions
  const handleReceiveAll = () => {
    // In a real app, this would update the status of all selected requests
    console.log("Receiving all selected requests:", selectedRequests)
    // After processing, clear selections
    setSelectedRequests([])
  }

  const handleCompleteAll = () => {
    // In a real app, this would update the status of all selected requests
    console.log("Completing all selected requests:", selectedRequests)
    // After processing, clear selections
    setSelectedRequests([])
  }

  const handleApproveAll = () => {
    // In a real app, this would update the status of all selected requests to approved
    console.log("Approving all selected requests:", selectedRequests)
    // After processing, clear selections
    setSelectedRequests([])
  }

  const handleRejectAll = () => {
    // In a real app, this would update the status of all selected requests to rejected
    console.log("Rejecting all selected requests:", selectedRequests)
    // After processing, clear selections
    setSelectedRequests([])
  }

  // Handle opening request summary
  const handleOpenRequestSummary = (request: any) => {
    setSelectedRequest(request)
    setSummaryDialogOpen(true)
  }

  // Handle status change from the summary dialog
  const handleStatusChange = (requestId: string, newStatus: string) => {
    setRequests(requests.map((req) => (req.id === requestId ? { ...req, status: newStatus } : req)))
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300 flex items-center gap-1 font-medium"
          >
            <Clock3 className="h-3 w-3" /> Pending
          </Badge>
        )
      case "in-progress":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1 font-medium"
          >
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1 font-medium"
          >
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        )
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300 flex items-center gap-1 font-medium"
          >
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        )
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-300 flex items-center gap-1 font-medium"
          >
            <CheckCircle2 className="h-3 w-3" /> Approved
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
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

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  const parseDate = (dateString: string) => {
    const [month, day, year] = dateString.split("/")
    return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
  }

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Calendar data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, date: null })
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = formatDate(date)

      // Find requests due on this date
      const requestsForDay = displayRequests.filter((req) => {
        const dueDate = parseDate(req.dueDate)
        return dueDate.getDate() === day && dueDate.getMonth() === month && dueDate.getFullYear() === year
      })

      days.push({
        day,
        date: dateString,
        requests: requestsForDay,
        isToday: new Date().toDateString() === date.toDateString(),
      })
    }

    return days
  }, [currentMonth, displayRequests])

  // Group calendar days into weeks
  const calendarWeeks = useMemo(() => {
    const weeks = []
    let week = []

    for (let i = 0; i < calendarData.length; i++) {
      week.push(calendarData[i])

      if (week.length === 7 || i === calendarData.length - 1) {
        // If we have 7 days or we're at the end of the month
        weeks.push(week)
        week = []
      }
    }

    // If the last week is not complete, add empty cells
    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ day: null, date: null })
      }
      weeks.push(week)
    }

    return weeks
  }, [calendarData])

  // Get status color for calendar events
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-yellow-300 bg-yellow-50"
      case "in-progress":
        return "border-blue-300 bg-blue-50"
      case "completed":
        return "border-green-300 bg-green-50"
      case "rejected":
        return "border-red-300 bg-red-50"
      case "approved":
        return "border-green-300 bg-green-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  // Get priority color for calendar events
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-4 border-l-red-500"
      case "high":
        return "border-l-4 border-l-red-400"
      case "medium":
        return "border-l-4 border-l-orange-400"
      case "low":
        return "border-l-4 border-l-green-400"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex flex-col">
        {/* Top navigation */}
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                <Link href="/dashboard">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600"></span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" alt="User" />
                      <AvatarFallback>AT</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="container px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Request Management Hub</h1>
              <p className="text-muted-foreground">Manage and track all test requests across the PCRD system</p>
            </div>
          </div>

          {/* Main content area with sidebar */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64 space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg font-medium">Status Filter</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 px-1">
                    <Button
                      variant={statusFilter === "all" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("all")
                        setSelectedRequests([])
                      }}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      All Requests
                      <Badge className="ml-auto" variant="secondary">
                        {requests.length}
                      </Badge>
                    </Button>
                    <Button
                      variant={statusFilter === "pending" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("pending")
                        setSelectedRequests([])
                      }}
                    >
                      <Clock3 className="mr-2 h-4 w-4 text-yellow-600" />
                      Pending
                      <Badge className="ml-auto" variant="secondary">
                        {pendingCount}
                      </Badge>
                    </Button>
                    <Button
                      variant={statusFilter === "in-progress" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("in-progress")
                        setSelectedRequests([])
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4 text-blue-600" />
                      In Progress
                      <Badge className="ml-auto" variant="secondary">
                        {inProgressCount}
                      </Badge>
                    </Button>
                    <Button
                      variant={statusFilter === "completed" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("completed")
                        setSelectedRequests([])
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      Completed
                      <Badge className="ml-auto" variant="secondary">
                        {completedCount}
                      </Badge>
                    </Button>
                    <Button
                      variant={statusFilter === "rejected" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("rejected")
                        setSelectedRequests([])
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                      Rejected
                      <Badge className="ml-auto" variant="secondary">
                        {requests.filter((req) => req.status === "rejected").length}
                      </Badge>
                    </Button>
                    <Button
                      variant={statusFilter === "approved" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setStatusFilter("approved")
                        setSelectedRequests([])
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      Approved
                      <Badge className="ml-auto" variant="secondary">
                        {requests.filter((req) => req.status === "approved").length}
                      </Badge>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg font-medium">Priority Filter</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 px-1">
                    <Button
                      variant={priorityFilter === "all" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setPriorityFilter("all")}
                    >
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      All Priorities
                    </Button>
                    <Button
                      variant={priorityFilter === "urgent" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setPriorityFilter("urgent")}
                    >
                      <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                      Urgent
                      <Badge className="ml-auto" variant="secondary">
                        {requests.filter((req) => req.priority === "urgent").length}
                      </Badge>
                    </Button>
                    <Button
                      variant={priorityFilter === "high" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setPriorityFilter("high")}
                    >
                      <ArrowUpDown className="mr-2 h-4 w-4 text-red-600" />
                      High
                      <Badge className="ml-auto" variant="secondary">
                        {requests.filter((req) => req.priority === "high").length}
                      </Badge>
                    </Button>
                    <Button
                      variant={priorityFilter === "medium" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setPriorityFilter("medium")}
                    >
                      <ArrowUpDown className="mr-2 h-4 w-4 text-orange-600" />
                      Medium
                      <Badge className="ml-auto" variant="secondary">
                        {requests.filter((req) => req.priority === "medium").length}
                      </Badge>
                    </Button>
                    <Button
                      variant={priorityFilter === "low" ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setPriorityFilter("low")}
                    >
                      <ArrowUpDown className="mr-2 h-4 w-4 text-green-600" />
                      Low
                      <Badge className="ml-auto" variant="secondary">
                        {requests.filter((req) => req.priority === "low").length}
                      </Badge>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/request-management/assign-due">
                      <Calendar className="mr-2 h-4 w-4" />
                      Assign Due Dates
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="flex-1">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {statusFilter === "all"
                        ? "All Requests"
                        : statusFilter === "pending"
                          ? "Pending Requests"
                          : statusFilter === "in-progress"
                            ? "In Progress Requests"
                            : statusFilter === "completed"
                              ? "Completed Requests"
                              : statusFilter === "rejected"
                                ? "Rejected Requests"
                                : statusFilter === "approved"
                                  ? "Approved Requests"
                                  : "Requests"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search requests..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="list" value={activeView} onValueChange={setActiveView} className="w-full">
                    <div className="flex justify-between items-center px-6 py-2 border-b">
                      <TabsList className="grid w-[200px] grid-cols-2">
                        <TabsTrigger value="list">List</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                      </TabsList>
                      <Select defaultValue="all" onValueChange={(value) => setActiveTab(value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Request Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Request Type</SelectLabel>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="ntr">NTR</SelectItem>
                            <SelectItem value="asr">ASR</SelectItem>
                            <SelectItem value="er">ER</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <TabsContent value="list" className="m-0">
                      {/* Batch action buttons - only show when filtering by pending, in-progress, or completed */}
                      {showCheckboxes && selectedRequests.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-muted/10 border-b">
                          <div className="text-sm">
                            <span className="font-medium">{selectedRequests.length}</span> requests selected
                          </div>
                          <div className="flex gap-2">
                            {statusFilter === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={handleReceiveAll}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Receive All
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={handleApproveAll}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve All
                                </Button>
                              </>
                            )}
                            {statusFilter === "in-progress" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={handleCompleteAll}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Complete All
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={handleApproveAll}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve All
                                </Button>
                              </>
                            )}
                            {statusFilter === "completed" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={handleApproveAll}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve All
                                </Button>
                              </>
                            )}
                            {(statusFilter === "pending" ||
                              statusFilter === "in-progress" ||
                              statusFilter === "completed") && (
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleRejectAll}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject All
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequests([])}>
                              Clear Selection
                            </Button>
                          </div>
                        </div>
                      )}

                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            {showCheckboxes && (
                              <TableHead className="w-[40px]">
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    checked={
                                      selectedRequests.length === displayRequests.length && displayRequests.length > 0
                                    }
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all requests"
                                  />
                                </div>
                              </TableHead>
                            )}
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Capability</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayRequests.length > 0 ? (
                            displayRequests.map((request) => (
                              <TableRow
                                key={request.id}
                                className="hover:bg-muted/30 cursor-pointer"
                                onClick={() => handleOpenRequestSummary(request)}
                              >
                                {showCheckboxes && (
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={selectedRequests.includes(request.id)}
                                        onCheckedChange={() => toggleSelectRequest(request.id)}
                                        aria-label={`Select request ${request.id}`}
                                      />
                                    </div>
                                  </TableCell>
                                )}
                                <TableCell className="font-medium">{request.id}</TableCell>
                                <TableCell>
                                  <div className="font-medium">{request.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {request.requester} • {request.department}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{request.type}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CapabilityIcon capability={request.capability} />
                                    {request.capability}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={request.status} />
                                </TableCell>
                                <TableCell>
                                  <PriorityBadge priority={request.priority} />
                                </TableCell>
                                <TableCell>{request.dueDate}</TableCell>
                                <TableCell>
                                  <div className="w-full flex items-center gap-2">
                                    <Progress value={request.progress} className="h-2 w-20" />
                                    <span className="text-xs">{request.progress}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Status-specific action buttons */}
                                    {request.status === "pending" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        title="Start Processing"
                                      >
                                        <Clock className="h-4 w-4" />
                                        <span className="sr-only">Start Processing</span>
                                      </Button>
                                    )}
                                    {request.status === "in-progress" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                        title="Update Progress"
                                      >
                                        <BarChart3 className="h-4 w-4" />
                                        <span className="sr-only">Update Progress</span>
                                      </Button>
                                    )}
                                    {request.status === "completed" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                                        title="View Results"
                                      >
                                        <FileText className="h-4 w-4" />
                                        <span className="sr-only">View Results</span>
                                      </Button>
                                    )}
                                    {request.status === "rejected" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                        title="Resubmit"
                                      >
                                        <ArrowUpDown className="h-4 w-4" />
                                        <span className="sr-only">Resubmit</span>
                                      </Button>
                                    )}
                                    {request.status === "approved" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                        title="Schedule"
                                      >
                                        <Calendar className="h-4 w-4" />
                                        <span className="sr-only">Schedule</span>
                                      </Button>
                                    )}

                                    {/* Pass/Fail buttons */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title="Pass"
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">Pass</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Fail"
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Fail</span>
                                    </Button>

                                    {/* More actions dropdown */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 p-0 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Open menu</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Request Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleOpenRequestSummary(request)
                                          }}
                                        >
                                          <FileText className="mr-2 h-4 w-4" />
                                          <span>View Details</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <MessageSquare className="mr-2 h-4 w-4" />
                                          <span>Contact Requester</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Testing Status</DropdownMenuLabel>
                                        <DropdownMenuItem>
                                          <Clock3 className="mr-2 h-4 w-4 text-yellow-600" />
                                          <span>Mark as Pending</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Clock className="mr-2 h-4 w-4 text-blue-600" />
                                          <span>Start Testing</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                          <span>Mark as Completed</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <AlertCircle className="mr-2 h-4 w-4 text-orange-600" />
                                          <span>Flag for Review</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Assignment</DropdownMenuLabel>
                                        <DropdownMenuItem>
                                          <Users className="mr-2 h-4 w-4" />
                                          <span>Assign Staff</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <Clock className="mr-2 h-4 w-4" />
                                          <span>Update Due Date</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <ArrowUpDown className="mr-2 h-4 w-4" />
                                          <span>Change Priority</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
                                          <XCircle className="mr-2 h-4 w-4" />
                                          <span>Cancel Request</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={showCheckboxes ? 10 : 9}
                                className="text-center py-6 text-muted-foreground"
                              >
                                No requests found for the selected filters.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    <TabsContent value="calendar" className="m-0">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                              <ChevronLeft className="h-4 w-4" />
                              <span className="sr-only">Previous month</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={goToNextMonth}>
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">Next month</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={goToToday}>
                              Today
                            </Button>
                            <h3 className="text-lg font-semibold ml-2">
                              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
                              <span className="text-xs">Pending</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                              <span className="text-xs">In Progress</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-green-300"></div>
                              <span className="text-xs">Completed</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-300"></div>
                              <span className="text-xs">Rejected</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div key={day} className="text-center font-medium text-sm py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {calendarWeeks.map((week, weekIndex) => (
                            <React.Fragment key={weekIndex}>
                              {week.map((day, dayIndex) => (
                                <div
                                  key={`${weekIndex}-${dayIndex}`}
                                  className={`min-h-[120px] border rounded-md p-1 ${
                                    day.day === null
                                      ? "bg-gray-50 opacity-50"
                                      : day.isToday
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-white"
                                  }`}
                                >
                                  {day.day !== null && (
                                    <>
                                      <div className="text-right text-sm font-medium mb-1">{day.day}</div>
                                      <div className="space-y-1 overflow-y-auto max-h-[90px]">
                                        {day.requests &&
                                          day.requests.map((request) => (
                                            <div
                                              key={request.id}
                                              className={`text-xs p-1 rounded border ${getStatusColor(
                                                request.status,
                                              )} ${getPriorityColor(request.priority)} cursor-pointer hover:shadow-sm`}
                                              onClick={() => handleOpenRequestSummary(request)}
                                            >
                                              <div className="font-medium truncate">{request.title}</div>
                                              <div className="flex items-center justify-between">
                                                <span>{request.id}</span>
                                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                  {request.type}
                                                </Badge>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {displayRequests.length} of {requests.length} requests
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={displayRequests.length === 0}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={displayRequests.length === 0}>
                      Next
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Request Summary Dialog */}
      <RequestSummaryDialog
        request={selectedRequest}
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}

