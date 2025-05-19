"use client"

import { Plus, Search, Filter, ChevronRight, MoreVertical, Star, FileText, Copy, ThumbsUp, Calendar, Clock, BarChart4, CreditCard, DollarSign, CalendarDays, CalendarRange, CalendarCheck } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RequestStatusBadge from "@/components/request-status-badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  // Sample data for demonstration with expanded samples and equipment
  const recentRequests = [
    {
      id: "NTR-2023-0123",
      title: "HDPE Film Tensile Strength Analysis",
      type: "NTR",
      status: "in-progress" as const,
      priority: "high",
      submittedDate: "2023-10-15",
      dueDate: "2023-10-20",
      capability: "Mechanical Testing",
      progress: 65,
      samples: ["Sample A-123", "Sample B-456", "Sample C-789", "Sample D-101", "Sample E-112", "Sample F-131"],
      equipment: ["Instron 5567", "MTS Criterion", "Zwick/Roell Z010", "Tinius Olsen H25KT", "Lloyd Instruments LR5K"],
      evaluated: true,
      completedDate: "2023-10-18",
    },
    {
      id: "ASR-2023-0089",
      title: "PP Degradation Investigation",
      type: "ASR",
      status: "pending" as const,
      priority: "normal",
      submittedDate: "2023-10-14",
      dueDate: "2023-10-25",
      capability: "Thermal Analysis",
      progress: 10,
      samples: ["Sample D-234", "Sample E-567", "Sample F-890", "Sample G-123", "Sample H-456"],
      equipment: ["DSC 214 Polyma", "TGA 209 F1 Libra", "DSC 3500 Sirius", "TGA 5500 IR"],
      evaluated: false,
    },
    {
      id: "ER-2023-0056",
      title: "SEM Equipment Reservation",
      type: "ER",
      status: "approved" as const,
      priority: "normal",
      submittedDate: "2023-10-13",
      dueDate: "2023-10-18",
      capability: "Microscopy",
      progress: 40,
      samples: ["Sample F-890", "Sample G-901", "Sample H-012", "Sample I-123"],
      equipment: ["JEOL JSM-7800F", "Phenom XL", "Zeiss EVO MA10", "Hitachi SU3500", "FEI Quanta 250"],
      evaluated: false,
    },
    {
      id: "NTR-2023-0122",
      title: "LDPE Film Permeability Test",
      type: "NTR",
      status: "completed" as const,
      priority: "normal",
      submittedDate: "2023-10-10",
      dueDate: "2023-10-17",
      capability: "Barrier Properties",
      progress: 100,
      samples: ["Sample G-123", "Sample H-456", "Sample I-789", "Sample J-012", "Sample K-345", "Sample L-678"],
      equipment: ["Mocon Ox-Tran 2/22", "Mocon Permatran-W 3/34", "Systech Illinois 8001", "Labthink VAC-V1"],
      evaluated: false,
      completedDate: "2023-10-16",
    },
    {
      id: "ASR-2023-0088",
      title: "PET Crystallinity Analysis",
      type: "ASR",
      status: "pending" as const,
      priority: "high",
      submittedDate: "2023-10-09",
      dueDate: "2023-10-16",
      capability: "Thermal Analysis",
      progress: 30,
      samples: ["Sample I-789", "Sample J-012", "Sample K-345", "Sample L-678", "Sample M-901"],
      equipment: ["DSC 214 Polyma", "XRD D8 Advance", "DSC 3500 Sirius", "Bruker D2 Phaser"],
      evaluated: false,
    },
    {
      id: "NTR-2023-0087",
      title: "BOPP Film Surface Treatment",
      type: "NTR",
      status: "rejected" as const,
      priority: "normal",
      submittedDate: "2023-10-08",
      dueDate: "2023-10-15",
      capability: "Surface Analysis",
      progress: 20,
      samples: ["Sample K-345", "Sample L-678", "Sample M-901", "Sample N-234", "Sample O-567"],
      equipment: ["Contact Angle System OCA", "AFM Dimension Icon", "XPS Thermo K-Alpha", "Bruker Contour GT-K"],
      evaluated: false,
      completedDate: "2023-10-12",
    },
  ]

  const notifications = [
    {
      id: 1,
      message: "Your request NTR-2023-0123 has been assigned to an operator",
      timestamp: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      message: "Results for NTR-2023-0120 are now available",
      timestamp: "1 day ago",
      read: false,
    },
    {
      id: 3,
      message: "Your ASR-2023-0087 has been approved by the capability head",
      timestamp: "2 days ago",
      read: true,
    },
  ]

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-500"
      case "in-progress":
        return "bg-yellow-500"
      case "completed":
        return "bg-green-500"
      case "delayed":
        return "bg-red-500"
      case "terminated":
        return "bg-gray-500"
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  // IO Numbers for filter
  const ioNumbers = [
    { id: "all", label: "Select all" },
    { id: "non-io", label: "Non-IO" },
    { id: "100060001234", label: "100060001234" },
    { id: "100060005678", label: "100060005678" },
  ]

  // Capabilities for filter
  const capabilities = [
    { id: "all", label: "All" },
    { id: "microstructure", label: "Microstructure" },
    { id: "rheology", label: "Rheology" },
    { id: "mechanical", label: "Mechanical Testing" },
    { id: "thermal", label: "Thermal Analysis" },
    { id: "microscopy", label: "Microscopy" },
    { id: "barrier", label: "Barrier Properties" },
    { id: "surface", label: "Surface Analysis" },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="text-lg font-medium">
            Point: <span className="font-bold">42</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3 space-y-4">
            {/* Filter Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* IO Filter Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center">
                  <div className="mr-2 p-1.5 rounded-full bg-blue-100">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-blue-800">My IO</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {ioNumbers.map((io) => (
                      <div
                        key={io.id}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                          io.id === "all"
                            ? "bg-blue-500 text-white"
                            : "bg-white hover:bg-blue-100 border border-blue-200"
                        } transition-colors cursor-pointer`}
                      >
                        <Checkbox
                          id={`io-${io.id}`}
                          defaultChecked={io.id === "all"}
                          className={io.id === "all" ? "text-white border-white" : ""}
                        />
                        <label
                          htmlFor={`io-${io.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {io.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Date Period Filter Card */}
              <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center">
                  <div className="mr-2 p-1.5 rounded-full bg-amber-100">
                    <CalendarRange className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-amber-800">Select Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-amber-200">
                        <CalendarDays className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">From</span>
                        <Input type="date" className="w-40 border-amber-200 focus-visible:ring-amber-400" />
                      </div>
                      <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-amber-200">
                        <CalendarCheck className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">To</span>
                        <Input type="date" className="w-40 border-amber-200 focus-visible:ring-amber-400" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900">
                        <Clock className="mr-2 h-4 w-4" />
                        Past 30 days
                      </Button>
                      <Button variant="outline" className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900">
                        <Calendar className="mr-2 h-4 w-4" />
                        Past 3 months
                      </Button>
                      <Button variant="outline" className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900">
                        <BarChart4 className="mr-2 h-4 w-4" />
                        This Year
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Request Summary */}
              <div className="md:col-span-4">
                <Card className="h-full bg-gradient-to-r from-green-50 to-teal-50 border-green-200 overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center">
                    <div className="mr-2 p-1.5 rounded-full bg-green-100">
                      <BarChart4 className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-green-800">My REQUEST SUMMARY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-white border border-green-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg font-medium text-green-800">YTD 2023</div>
                        <div className="text-3xl font-bold text-green-900">28</div>
                        <div className="text-sm text-green-700">฿ 125,000</div>
                      </div>
                      <div className="bg-white border border-yellow-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg font-medium text-yellow-800">In-progress</div>
                        <div className="text-3xl font-bold text-yellow-900">12</div>
                        <div className="text-sm text-yellow-700">฿ 45,000</div>
                      </div>
                      <div className="bg-white border border-blue-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg font-medium text-blue-800">Complete</div>
                        <div className="text-3xl font-bold text-blue-900">14</div>
                        <div className="text-sm text-blue-700">฿ 70,000</div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-lg font-medium text-gray-800">Terminate</div>
                        <div className="text-3xl font-bold text-gray-900">2</div>
                        <div className="text-sm text-gray-700">฿ 10,000</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expense Card */}
              <div className="md:col-span-1">
                <Card className="h-full bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center">
                    <div className="mr-2 p-1.5 rounded-full bg-purple-100">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-purple-800">EXPENSE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-3 bg-white p-3 rounded-lg border border-purple-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-700">Plan</div>
                        <div className="text-xl font-bold text-purple-900">
                          2.5 <span className="text-sm font-normal">MTHB</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-purple-700">Spending</div>
                        <div className="text-xl font-bold text-purple-900">
                          1.8 <span className="text-sm font-normal">MTHB</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <Progress value={72} className="h-3 w-full bg-purple-100" />
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs font-medium text-purple-700">0 MTHB</div>
                        <div className="text-xs font-medium text-purple-900">72% of budget used</div>
                        <div className="text-xs font-medium text-purple-700">2.5 MTHB</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <div className="md:w-2/3">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My REQUESTs</CardTitle>
                  <CardDescription>Track and manage your recent test requests</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Link href="/request/new">
                    <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                      <Plus className="mr-2 h-4 w-4" />
                      New Request
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search requests..." className="pl-10" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <Tabs defaultValue="all" className="w-auto">
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="ntr">NTR</TabsTrigger>
                      <TabsTrigger value="asr">ASR</TabsTrigger>
                      <TabsTrigger value="er">ER</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select capability" />
                    </SelectTrigger>
                    <SelectContent>
                      {capabilities.map((capability) => (
                        <SelectItem key={capability.id} value={capability.id}>
                          {capability.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div key={request.id} className="flex flex-col space-y-2 rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{request.id}</span>
                            <RequestStatusBadge status={request.status} />
                            {request.priority === "high" && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                High Priority
                              </span>
                            )}
                            {request.evaluated && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Evaluated</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <span className="text-sm font-medium">{request.title}</span>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {/* Improved Sample list with hover on entire section */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="flex flex-col items-start mt-2">
                                  <span className="text-xs font-medium text-muted-foreground mb-1">Samples</span>
                                  <div className="flex flex-wrap gap-1">
                                    {request.samples.slice(0, 3).map((sample, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                      >
                                        {sample}
                                      </span>
                                    ))}
                                    {request.samples.length > 3 && (
                                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        +{request.samples.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                {request.samples.length > 0 && (
                                  <TooltipContent className="bg-white p-2 shadow-lg rounded-md border">
                                    <div className="space-y-1 max-w-xs">
                                      <div className="font-medium text-sm border-b pb-1 mb-1">All Samples</div>
                                      {request.samples.map((sample, index) => (
                                        <div key={index} className="text-sm py-1 px-2 rounded hover:bg-gray-50">
                                          {sample}
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>

                            {/* Improved Equipment list with hover on entire section */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="flex flex-col items-start ml-4 mt-2">
                                  <span className="text-xs font-medium text-muted-foreground mb-1">Equipment</span>
                                  <div className="flex flex-wrap gap-1">
                                    {request.equipment.slice(0, 3).map((equipment, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10"
                                      >
                                        {equipment}
                                      </span>
                                    ))}
                                    {request.equipment.length > 3 && (
                                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        +{request.equipment.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                {request.equipment.length > 0 && (
                                  <TooltipContent className="bg-white p-2 shadow-lg rounded-md border">
                                    <div className="space-y-1 max-w-xs">
                                      <div className="font-medium text-sm border-b pb-1 mb-1">All Equipment</div>
                                      {request.equipment.map((equipment, index) => (
                                        <div key={index} className="text-sm py-1 px-2 rounded hover:bg-gray-50">
                                          {equipment}
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                            <span>Submitted: {request.submittedDate}</span>
                            <span>Due: {request.dueDate}</span>
                            {request.completedDate && <span>Completed: {request.completedDate}</span>}
                            <span>Capability: {request.capability}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!request.evaluated && request.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                              onClick={() => {
                                // Show evaluation form logic would go here
                                alert("You've earned 1 point for evaluating this request!")
                              }}
                            >
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Evaluate
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="mr-2 h-4 w-4" />
                                Set as a request template
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate Request
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Evaluation my Request
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-medium">Progress</span>
                          <span>{request.progress}%</span>
                        </div>
                        <Progress value={request.progress} className="h-2 w-full" />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center">
                    <Button variant="outline" className="mt-2">
                      View All Requests
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:w-1/3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Stay updated on your request status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-4 rounded-lg p-3 ${
                        notification.read ? "bg-background" : "bg-blue-50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-2 w-2 rounded-full ${notification.read ? "bg-transparent" : "bg-blue-500"}`}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>
                      {!notification.read && (
                        <Button variant="outline" size="sm" className="ml-auto">
                          Got It
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
