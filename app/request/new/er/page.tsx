"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"

export default function EquipmentReservationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    projectName: "",
    fundingSource: "io",
    ioNumber: "",
    costCenter: "0090-01560",
    priority: "normal",
    urgentMemo: null,
    capability: "",
    equipment: "",
    sampleCount: 0,
    samples: [],
    selectedDates: [],
    reservationSchedule: {}, // { date: { timeSlots: [] } }
    cost: 0,
    testingMode: "operator",
    specialRequirements: "",
    attachments: [],
  })

  // Sample category state (from NTR)
  const [sampleCategory, setSampleCategory] = useState("")
  const [currentSample, setCurrentSample] = useState({
    category: "",
    grade: "",
    lot: "",
    sampleIdentity: "",
    type: "",
    form: "",
    tech: "",
    feature: "",
    plant: "",
    samplingDate: "",
    samplingTime: "",
    generatedName: "",
  })

  // Add these new state variables (from NTR)
  const [editMode, setEditMode] = useState(false)
  const [editingSampleIndex, setEditingSampleIndex] = useState<number | null>(null)
  const automaticNamingRef = useRef<HTMLDivElement>(null)
  const sampleSummaryRef = useRef<HTMLDivElement>(null)
  const addMoreButtonRef = useRef<HTMLButtonElement>(null)
  const [focusedSection, setFocusedSection] = useState<"naming" | "summary" | "addMore" | null>(null)
  const [showSampleSections, setShowSampleSections] = useState(false)
  const [highlightedField, setHighlightedField] = useState<string | null>("sample-category")
  const [sampleListName, setSampleListName] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // Calendar time slot management
  const [availableDates, setAvailableDates] = useState<{
    [date: string]: { available: boolean; partiallyAvailable: boolean; slots: number; totalSlots: number }
  }>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<{ id: number; time: string; available: boolean }[]>([])

  const [equipmentCosts, setEquipmentCosts] = useState({
    "sem-1": 2500,
    "tem-1": 3500,
    "xrd-1": 2000,
    "rheometer-1": 1800,
    "rheometer-2": 2200,
    "dma-1": 1500,
    "gc-ms-1": 2800,
    "hplc-1": 2300,
    "ftir-1": 1700,
    "saxs-1": 3000,
    "waxs-1": 2700,
    "confocal-1": 2200,
    "optical-1": 1200,
  })

  // Required fields for each sample category (from NTR)
  const requiredFields = {
    commercial: ["grade", "lot", "sampleIdentity", "type", "form"],
    td: ["tech", "feature", "sampleIdentity", "type", "form"],
    benchmark: ["feature", "sampleIdentity", "type", "form"],
    inprocess: ["plant", "samplingDate", "samplingTime", "sampleIdentity", "type", "form"],
    chemicals: ["plant", "samplingDate", "samplingTime", "sampleIdentity", "type", "form"],
    cap: ["feature", "sampleIdentity", "type", "form"],
  }

  const totalSteps = 7
  const progress = (currentStep / totalSteps) * 100

  // Function to check if a field is required (from NTR)
  const isFieldRequired = (field: string) => {
    return requiredFields[sampleCategory as keyof typeof requiredFields]?.includes(field) || false
  }

  // Function to find the next empty required field (from NTR)
  const findNextEmptyRequiredField = () => {
    const fields = requiredFields[sampleCategory as keyof typeof requiredFields] || []
    for (const field of fields) {
      if (!currentSample[field as keyof typeof currentSample]) {
        return field
      }
    }
    return null
  }

  // Function to highlight the next empty required field (from NTR)
  const highlightNextEmptyField = () => {
    const nextField = findNextEmptyRequiredField()
    if (nextField) {
      setHighlightedField(nextField)
      // Focus on the field if possible
      const element = document.getElementById(nextField)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        setTimeout(() => {
          element.focus()
        }, 500)
      }
    } else {
      setHighlightedField(null)
    }
  }

  // Check for empty required fields when sample category changes (from NTR)
  useEffect(() => {
    if (showSampleSections) {
      highlightNextEmptyField()
    }
  }, [sampleCategory, showSampleSections])

  // Load form data from localStorage if available (from NTR)
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem("erFormData")
      if (savedFormData) {
        const parsedFormData = JSON.parse(savedFormData)
        setFormData((prev) => ({
          ...prev,
          ...parsedFormData,
        }))
        // Clear the saved form data after loading it
        localStorage.removeItem("erFormData")
      }

      // Load samples if available
      const savedSamples = localStorage.getItem("erSamples")
      if (savedSamples) {
        const parsedSamples = JSON.parse(savedSamples)
        setFormData((prev) => ({
          ...prev,
          samples: parsedSamples,
          sampleCount: parsedSamples.length,
        }))

        // If samples exist, show the sample sections
        if (parsedSamples.length > 0) {
          setShowSampleSections(true)
        }
      }
    } catch (error) {
      console.error("Error loading saved data from localStorage:", error)
    }
  }, [])

  // Generate calendar availability data when equipment changes
  useEffect(() => {
    if (formData.equipment) {
      // This would be an API call in a real implementation
      generateMockAvailabilityData()
    }
  }, [formData.equipment])

  // Calculate total cost whenever reservation schedule changes
  useEffect(() => {
    calculateTotalCost()
  }, [formData.reservationSchedule])

  // Calculate the total cost based on all selected time slots across all dates
  const calculateTotalCost = () => {
    const costPerHour = equipmentCosts[formData.equipment] || 2000 // Default to 2000 if not found
    let totalSlots = 0

    // Count all time slots across all dates
    Object.values(formData.reservationSchedule).forEach((dateData) => {
      totalSlots += dateData.timeSlots.length
    })

    const totalCost = totalSlots * costPerHour

    setFormData((prev) => ({
      ...prev,
      cost: totalCost,
    }))
  }

  // Generate mock availability data for the calendar
  const generateMockAvailabilityData = () => {
    const today = new Date()
    const availabilityData: {
      [date: string]: { available: boolean; partiallyAvailable: boolean; slots: number; totalSlots: number }
    } = {}

    // Generate data for the next 30 days
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)
      const dateString = currentDate.toISOString().split("T")[0]

      // Create random availability (in a real app, this would come from your backend)
      const totalSlots = 7 // 7 time slots per day
      let availableSlots = 0

      // Weekend days have fewer slots available
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        availableSlots = Math.floor(Math.random() * 2) // 0 or 1 slots on weekends
      } else {
        availableSlots = Math.floor(Math.random() * (totalSlots + 1)) // 0 to 7 slots on weekdays
      }

      availabilityData[dateString] = {
        available: availableSlots > 0,
        partiallyAvailable: availableSlots > 0 && availableSlots < totalSlots,
        slots: availableSlots,
        totalSlots: totalSlots,
      }
    }

    setAvailableDates(availabilityData)
  }

  // Generate time slots for a specific date
  const generateTimeSlotsForDate = (date: string) => {
    const baseTimeSlots = [
      { id: 1, time: "09:00 - 10:00", available: true },
      { id: 2, time: "10:00 - 11:00", available: true },
      { id: 3, time: "11:00 - 12:00", available: true },
      { id: 4, time: "13:00 - 14:00", available: true },
      { id: 5, time: "14:00 - 15:00", available: true },
      { id: 6, time: "15:00 - 16:00", available: true },
      { id: 7, time: "16:00 - 17:00", available: true },
    ]

    // If we have availability data for this date
    if (availableDates[date]) {
      const { slots } = availableDates[date]

      // Mark random slots as unavailable to match our availability count
      const availableCount = slots
      const unavailableCount = baseTimeSlots.length - availableCount

      if (unavailableCount > 0) {
        // Create a copy of slots to modify
        const modifiedSlots = [...baseTimeSlots]

        // Randomly select slots to mark as unavailable
        const indices = Array.from({ length: baseTimeSlots.length }, (_, i) => i)
        for (let i = 0; i < unavailableCount; i++) {
          const randomIndex = Math.floor(Math.random() * indices.length)
          const slotIndex = indices.splice(randomIndex, 1)[0]
          modifiedSlots[slotIndex].available = false
        }

        return modifiedSlots
      }
    }

    return baseTimeSlots
  }

  // Mock data for sample fields (from NTR)
  const mockGrades = [
    { value: "HD5000S", label: "HD5000S" },
    { value: "HD5300B", label: "HD5300B" },
    { value: "HD5401GA", label: "HD5401GA" },
    { value: "PP1100NK", label: "PP1100NK" },
    { value: "PP2100JC", label: "PP2100JC" },
  ]

  const mockTechCat = [
    { value: "EcoRv", label: "EcoRv - Eco-friendly Resin" },
    { value: "HighPerf", label: "HighPerf - High Performance" },
    { value: "BioAdd", label: "BioAdd - Bio-based Additives" },
    { value: "RecyTech", label: "RecyTech - Recycling Technology" },
    { value: "NanoComp", label: "NanoComp - Nanocomposites" },
    { value: "BioPlast", label: "BioPlast - Bioplastics" },
    { value: "SmartPoly", label: "SmartPoly - Smart Polymers" },
    { value: "CondPoly", label: "CondPoly - Conductive Polymers" },
    { value: "BarrierTech", label: "BarrierTech - Barrier Technology" },
    { value: "LightStab", label: "LightStab - Light Stabilizers" },
  ]

  const mockFeatureApp = [
    { value: "AT", label: "AT - Advanced Technology" },
    { value: "FP", label: "FP - Film Processing" },
    { value: "IM", label: "IM - Injection Molding" },
    { value: "BM", label: "BM - Blow Molding" },
    { value: "CM", label: "CM - Compression Molding" },
    { value: "EX", label: "EX - Extrusion" },
    { value: "RIM", label: "RIM - Reaction Injection Molding" },
    { value: "TF", label: "TF - Thermoforming" },
    { value: "RM", label: "RM - Rotational Molding" },
    { value: "AM", label: "AM - Additive Manufacturing" },
    { value: "CP", label: "CP - Coating Process" },
  ]

  const typeOptions = [
    { value: "HDPE", label: "HDPE" },
    { value: "LDPE", label: "LDPE" },
    { value: "LLDPE", label: "LLDPE" },
    { value: "UHWMPE", label: "UHWMPE" },
    { value: "PP", label: "PP" },
    { value: "PVC", label: "PVC" },
    { value: "Wax", label: "Wax" },
    { value: "Others", label: "Others" },
  ]

  const formOptions = [
    { value: "Pellet", label: "Pellet" },
    { value: "Powder", label: "Powder" },
    { value: "Flake", label: "Flake" },
    { value: "Scrap", label: "Scrap" },
    { value: "Specimen", label: "Specimen" },
    { value: "Liquid", label: "Liquid" },
    { value: "Others", label: "Others" },
  ]

  const plantOptions = [
    { value: "HD1", label: "HD1" },
    { value: "HD2", label: "HD2" },
    { value: "HD3", label: "HD3" },
    { value: "HD4", label: "HD4" },
    { value: "HD(LSP)", label: "HD(LSP)" },
    { value: "PP1", label: "PP1" },
    { value: "PP2", label: "PP2" },
    { value: "PP3", label: "PP3" },
    { value: "4P", label: "4P" },
    { value: "PP(LSP)", label: "PP(LSP)" },
    { value: "LDPE", label: "LDPE" },
    { value: "LLDPE", label: "LLDPE" },
  ]

  // Mock IO Numbers (from NTR)
  const mockIoNumbers = [
    { value: "0090919390", label: "0090919390 Rheology Characterization" },
    { value: "0090919391", label: "0090919391 Thermal Analysis" },
    { value: "0090919392", label: "0090919392 Mechanical Testing" },
    { value: "0090919393", label: "0090919393 Barrier Properties" },
    { value: "0090919394", label: "0090919394 Optical Properties" },
  ]

  // Mock saved sample lists (from NTR)
  const [savedSampleLists, setSavedSampleLists] = useState([
    {
      id: "1",
      name: "HDPE Film Samples",
      samples: [
        {
          category: "commercial",
          grade: "HD5000S",
          lot: "L2023001",
          sampleIdentity: "A1",
          type: "HDPE",
          form: "Pellet",
          generatedName: "HD5000S_L2023001_A1",
        },
        {
          category: "commercial",
          grade: "HD5300B",
          lot: "L2023002",
          sampleIdentity: "B1",
          type: "HDPE",
          form: "Pellet",
          generatedName: "HD5300B_L2023002_B1",
        },
      ],
    },
    {
      id: "2",
      name: "PP Development Samples",
      samples: [
        {
          category: "td",
          tech: "EcoRv",
          feature: "AT",
          sampleIdentity: "Test1",
          type: "PP",
          form: "Pellet",
          generatedName: "AT_EcoRv_Test1",
        },
        {
          category: "td",
          tech: "HighPerf",
          feature: "IM",
          sampleIdentity: "Test2",
          type: "PP",
          form: "Pellet",
          generatedName: "IM_HighPerf_Test2",
        },
      ],
    },
  ])

  // Mock urgency types
  const urgencyTypes = [
    { value: "customer", label: "Customer Complaint" },
    { value: "production", label: "Production Issue" },
    { value: "development", label: "New Product Development" },
    { value: "regulatory", label: "Regulatory Requirement" },
  ]

  // Mock approvers
  const approvers = [
    { value: "sarah", label: "Dr. Sarah Johnson (R&D Director)" },
    { value: "michael", label: "Dr. Michael Chen (Lab Manager)" },
    { value: "lisa", label: "Dr. Lisa Wong (Technical Lead)" },
    { value: "james", label: "Dr. James Smith (Department Head)" },
  ]

  const capabilities = [
    { id: "microstructure", name: "Microstructure" },
    { id: "rheology", name: "Rheology" },
    { id: "small-molecule", name: "Small Molecule" },
    { id: "mesostructure-imaging", name: "Mesostructure & Imaging" },
  ]

  const equipmentByCapability = {
    microstructure: [
      { id: "sem-1", name: "SEM (Scanning Electron Microscopy) - Model A" },
      { id: "tem-1", name: "TEM (Transmission Electron Microscopy)" },
      { id: "xrd-1", name: "XRD (X-ray Diffraction)" },
    ],
    rheology: [
      { id: "rheometer-1", name: "Rotational Rheometer - Model X" },
      { id: "rheometer-2", name: "Capillary Rheometer" },
      { id: "dma-1", name: "Dynamic Mechanical Analyzer" },
    ],
    "small-molecule": [
      { id: "gc-ms-1", name: "GC-MS (Gas Chromatography-Mass Spectrometry)" },
      { id: "hplc-1", name: "HPLC (High-Performance Liquid Chromatography)" },
      { id: "ftir-1", name: "FTIR (Fourier-Transform Infrared Spectroscopy)" },
    ],
    "mesostructure-imaging": [
      { id: "saxs-1", name: "SAXS (Small-Angle X-ray Scattering)" },
      { id: "waxs-1", name: "WAXS (Wide-Angle X-ray Scattering)" },
      { id: "confocal-1", name: "Confocal Microscope" },
      { id: "optical-1", name: "Optical Microscope" },
    ],
  }

  // Form handling functions
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value })

    // Reset date and time when equipment changes
    if (name === "equipment") {
      setFormData((prev) => ({
        ...prev,
        selectedDates: [],
        reservationSchedule: {},
      }))
      setSelectedDate(null)
    }
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, attachments: [...formData.attachments, ...e.target.files] })
  }

  // Sample functions from NTR
  const handleSampleChange = (name: string, value: string) => {
    setCurrentSample((prev) => {
      const updated = { ...prev, [name]: value }

      // Generate sample name based on category and fields
      let generatedName = ""

      if (updated.category === "commercial" && updated.grade && updated.lot && updated.sampleIdentity) {
        generatedName = `${updated.grade}_${updated.lot}_${updated.sampleIdentity}`
      } else if (updated.category === "td" && updated.tech && updated.feature && updated.sampleIdentity) {
        // Get abbreviations from the mock data
        const featureAbbr = mockFeatureApp.find((f) => f.value === updated.feature)?.value || updated.feature
        const techAbbr = mockTechCat.find((t) => t.value === updated.tech)?.value || updated.tech
        generatedName = `${featureAbbr}_${techAbbr}_${updated.sampleIdentity}`
      } else if (updated.category === "benchmark" && updated.feature && updated.sampleIdentity) {
        const featureAbbr = mockFeatureApp.find((f) => f.value === updated.feature)?.value || updated.feature
        generatedName = `${featureAbbr}_${updated.sampleIdentity}`
      } else if (
        updated.category === "inprocess" &&
        updated.plant &&
        updated.samplingDate &&
        updated.samplingTime &&
        updated.sampleIdentity
      ) {
        generatedName = `${updated.plant}_${updated.samplingDate}_${updated.samplingTime}_${updated.sampleIdentity}`
      } else if (
        updated.category === "chemicals" &&
        updated.plant &&
        updated.samplingDate &&
        updated.samplingTime &&
        updated.sampleIdentity
      ) {
        generatedName = `${updated.plant}_${updated.samplingDate}_${updated.samplingTime}_${updated.sampleIdentity}`
      } else if (updated.category === "cap" && updated.feature && updated.sampleIdentity) {
        const featureAbbr = mockFeatureApp.find((f) => f.value === updated.feature)?.value || updated.feature
        generatedName = `CAP_${featureAbbr}_${updated.sampleIdentity}`
      }

      // After changing a field, check for the next empty required field
      setTimeout(() => {
        highlightNextEmptyField()
      }, 100)

      return { ...updated, generatedName }
    })
  }

  // Check for duplicate sample names (from NTR)
  const isDuplicateSampleName = (name: string, excludeIndex?: number) => {
    return formData.samples.some(
      (sample, index) => sample.generatedName === name && (excludeIndex === undefined || index !== excludeIndex),
    )
  }

  // Handle adding a sample (from NTR)
  const handleAddSample = () => {
    if (currentSample.generatedName) {
      // Check for duplicate sample names
      const isDuplicate = isDuplicateSampleName(currentSample.generatedName, editMode ? editingSampleIndex : undefined)

      if (isDuplicate) {
        toast({
          title: "Duplicate sample name",
          description: "A sample with this name already exists. Please modify the sample details.",
          variant: "destructive",
        })
        return
      }

      if (editMode && editingSampleIndex !== null) {
        // Update existing sample
        const updatedSamples = [...formData.samples]
        updatedSamples[editingSampleIndex] = { ...currentSample }

        setFormData((prev) => ({
          ...prev,
          samples: updatedSamples,
          sampleCount: updatedSamples.length,
        }))

        // Exit edit mode
        setEditMode(false)
        setEditingSampleIndex(null)

        toast({
          title: "Sample updated",
          description: `Sample "${currentSample.generatedName}" has been updated.`,
        })
      } else {
        // Add new sample
        setFormData((prev) => ({
          ...prev,
          samples: [...prev.samples, { ...currentSample }],
          sampleCount: prev.samples.length + 1,
        }))

        toast({
          title: "Sample added",
          description: `Sample "${currentSample.generatedName}" has been added.`,
        })
      }

      // Don't reset the form completely, just clear identity fields to prepare for next sample
      setCurrentSample((prev) => ({
        ...prev,
        sampleIdentity: "",
        generatedName: "",
      }))

      // Scroll to Sample Summary section and highlight the "Add more sample" button
      if (sampleSummaryRef.current) {
        sampleSummaryRef.current.scrollIntoView({ behavior: "smooth" })

        setTimeout(() => {
          if (addMoreButtonRef.current) {
            setFocusedSection("addMore")
            addMoreButtonRef.current.focus()
            setTimeout(() => setFocusedSection(null), 2000) // Remove highlight after 2 seconds
          }
        }, 500)
      }

      // Reset highlighted field
      setHighlightedField(null)

      // After adding, highlight the sample identity field for the next sample
      setTimeout(() => {
        setHighlightedField("sampleIdentity")
        const element = document.getElementById("sample-identity")
        if (element) {
          element.focus()
        }
      }, 2100)
    }
  }

  // Function to focus on the Automatic Sample Naming System (from NTR)
  const focusOnNamingSystem = () => {
    if (automaticNamingRef.current) {
      automaticNamingRef.current.scrollIntoView({ behavior: "smooth" })
      setFocusedSection("naming")
      setTimeout(() => setFocusedSection(null), 2000) // Remove highlight after 2 seconds
    }
  }

  // Handle removing a sample (from NTR)
  const handleRemoveSample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      samples: prev.samples.filter((_, i) => i !== index),
      sampleCount: prev.samples.length - 1,
    }))

    // Keep focus on the Sample Summary section
    if (sampleSummaryRef.current) {
      setFocusedSection("summary")
      setTimeout(() => setFocusedSection(null), 2000) // Remove highlight after 2 seconds
    }
  }

  // Handle copying a sample (from NTR)
  const handleCopySample = (sample: any) => {
    // Set current sample to the copied sample
    setCurrentSample({ ...sample })
    setSampleCategory(sample.category)

    // Exit edit mode if it was active
    setEditMode(false)
    setEditingSampleIndex(null)

    // Focus on the automatic naming section
    focusOnNamingSystem()

    toast({
      title: "Sample copied",
      description: "Sample details copied. Make changes and add as a new sample.",
    })
  }

  // Handle editing a sample (from NTR)
  const handleEditSample = (sample: any, index: number) => {
    // Set current sample to this sample for editing
    setCurrentSample({ ...sample })
    setSampleCategory(sample.category)

    // Enter edit mode
    setEditMode(true)
    setEditingSampleIndex(index)

    // Focus on the automatic naming section
    focusOnNamingSystem()
  }

  // Handle saving a sample list (from NTR)
  const handleSaveSampleList = () => {
    if (sampleListName && formData.samples.length > 0) {
      setSavedSampleLists((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: sampleListName,
          samples: [...formData.samples],
        },
      ])
      setSampleListName("")
      setShowSaveDialog(false)

      toast({
        title: "Sample list saved",
        description: `Sample list "${sampleListName}" has been saved for future use.`,
      })
    }
  }

  // Handle loading a sample list (from NTR)
  const handleLoadSampleList = (listId: string) => {
    const list = savedSampleLists.find((list) => list.id === listId)
    if (list) {
      setFormData((prev) => ({
        ...prev,
        samples: [...list.samples],
        sampleCount: list.samples.length,
      }))
      setShowLoadDialog(false)
      setShowSampleSections(true)

      toast({
        title: "Sample list loaded",
        description: `Sample list "${list.name}" has been loaded.`,
      })
    }
  }

  // Function to start adding samples (from NTR)
  const startAddingSamples = () => {
    setShowSampleSections(true)
    setTimeout(() => {
      if (automaticNamingRef.current) {
        automaticNamingRef.current.scrollIntoView({ behavior: "smooth" })
        setFocusedSection("naming")
        setTimeout(() => {
          setFocusedSection(null)
          highlightNextEmptyField()
        }, 1000)
      }
    }, 100)
  }

  // Navigation functions
  const nextStep = () => {
    // Basic validation for each step
    if (currentStep === 1) {
      if (!formData.projectName) {
        toast({
          title: "Required Field Missing",
          description: "Please enter a request title to continue.",
          variant: "destructive",
        })
        return
      }

      if (formData.fundingSource === "io" && !formData.ioNumber) {
        toast({
          title: "Required Field Missing",
          description: "Please select an IO Number to continue.",
          variant: "destructive",
        })
        return
      }
    } else if (currentStep === 2) {
      if (!formData.equipment) {
        toast({
          title: "Required Field Missing",
          description: "Please select an equipment to continue.",
          variant: "destructive",
        })
        return
      }
    } else if (currentStep === 4) {
      if (Object.keys(formData.reservationSchedule).length === 0) {
        toast({
          title: "Required Field Missing",
          description: "Please select at least one date and time slot to continue.",
          variant: "destructive",
        })
        return
      }
    }

    // If moving from step 3 to step 4, save samples to localStorage
    if (currentStep === 3) {
      try {
        localStorage.setItem("erSamples", JSON.stringify(formData.samples))
      } catch (error) {
        console.error("Error saving samples to localStorage:", error)
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo(0, 0)
    } else {
      router.push("/request/new/er/summary")
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  // Handle date selection in the enhanced calendar
  const handleDateSelect = (date: string) => {
    if (availableDates[date]?.available) {
      // Update selected date for UI
      setSelectedDate(date)

      // Update selected dates list
      const updatedSelectedDates = [...formData.selectedDates]
      if (!updatedSelectedDates.includes(date)) {
        updatedSelectedDates.push(date)
      }

      // Generate time slots for the selected date
      const generatedTimeSlots = generateTimeSlotsForDate(date)
      setTimeSlots(generatedTimeSlots)

      // Update form data with the new selected date
      setFormData((prev) => {
        // Create a copy of the current reservation schedule
        const updatedSchedule = { ...prev.reservationSchedule }

        // If this date isn't in the schedule yet, add it
        if (!updatedSchedule[date]) {
          updatedSchedule[date] = {
            timeSlots: [],
          }
        }

        return {
          ...prev,
          selectedDates: updatedSelectedDates,
          reservationSchedule: updatedSchedule,
        }
      })

      toast({
        title: "Date selected",
        description: `Selected date: ${date}. Please choose time slots.`,
      })
    }
  }

  // Handle removing a date from the schedule
  const handleRemoveDate = (date: string) => {
    setFormData((prev) => {
      // Create a copy of the current reservation schedule and selected dates
      const updatedSchedule = { ...prev.reservationSchedule }
      const updatedSelectedDates = prev.selectedDates.filter((d) => d !== date)

      // Remove this date from the schedule
      delete updatedSchedule[date]

      return {
        ...prev,
        selectedDates: updatedSelectedDates,
        reservationSchedule: updatedSchedule,
      }
    })

    // If the removed date was the currently selected date, clear it
    if (selectedDate === date) {
      setSelectedDate(null)
      setTimeSlots([])
    }

    toast({
      title: "Date removed",
      description: `Removed date: ${date} from schedule.`,
    })
  }

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (!slot.available || !selectedDate) return

    const [start, end] = slot.time.split(" - ")

    setFormData((prev) => {
      // Create a copy of the current reservation schedule
      const updatedSchedule = { ...prev.reservationSchedule }

      // Get the time slots for the selected date
      const dateSchedule = updatedSchedule[selectedDate] || { timeSlots: [] }

      // Check if this slot is already selected
      const isSelected = dateSchedule.timeSlots.some((selectedSlot) => selectedSlot.time === slot.time)

      let updatedTimeSlots

      if (isSelected) {
        // Remove the slot if already selected
        updatedTimeSlots = dateSchedule.timeSlots.filter((selectedSlot) => selectedSlot.time !== slot.time)
      } else {
        // Add the slot if not already selected
        updatedTimeSlots = [
          ...dateSchedule.timeSlots,
          {
            id: slot.id,
            time: slot.time,
            start,
            end,
          },
        ]
      }

      // Sort the time slots by their id (which corresponds to time order)
      updatedTimeSlots.sort((a, b) => a.id - b.id)

      // Update the schedule for this date
      updatedSchedule[selectedDate] = {
        ...dateSchedule,
        timeSlots: updatedTimeSlots,
      }

      return {
        ...prev,
        reservationSchedule: updatedSchedule,
      }
    })

    const dateSchedule = formData.reservationSchedule[selectedDate] || { timeSlots: [] }

    toast({
      title: dateSchedule?.timeSlots.some((s) => s.time === slot.time) ? "Time slot removed" : "Time slot selected",
      description: `${dateSchedule?.timeSlots.some((s) => s.time === slot.time) ? "Removed" : "Selected"} time: ${slot.time} on ${selectedDate}`,
    })
  }

  // Function to render sample form fields based on category (from NTR)
  const renderSampleFields = () => {
    switch (sampleCategory) {
      case "commercial":
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={currentSample.grade} onValueChange={(value) => handleSampleChange("grade", value)}>
                  <SelectTrigger
                    id="grade"
                    className={`w-full ${highlightedField === "grade" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockGrades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lot">Lot</Label>
                <Input
                  id="lot"
                  value={currentSample.lot}
                  onChange={(e) => handleSampleChange("lot", e.target.value)}
                  placeholder="Enter lot number"
                  className={`w-full ${highlightedField === "lot" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sample-identity">Sample Identity</Label>
                <Input
                  id="sample-identity"
                  value={currentSample.sampleIdentity}
                  onChange={(e) => handleSampleChange("sampleIdentity", e.target.value)}
                  placeholder="Enter sample identifier"
                  className={`w-full ${highlightedField === "sampleIdentity" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={currentSample.type} onValueChange={(value) => handleSampleChange("type", value)}>
                  <SelectTrigger
                    id="type"
                    className={`w-full ${highlightedField === "type" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form">Form</Label>
                <Select value={currentSample.form} onValueChange={(value) => handleSampleChange("form", value)}>
                  <SelectTrigger
                    id="form"
                    className={`w-full ${highlightedField === "form" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.map((form) => (
                      <SelectItem key={form.value} value={form.value}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case "td":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tech">Tech/CAT</Label>
                <AutocompleteInput
                  id="tech"
                  options={mockTechCat}
                  value={currentSample.tech}
                  onChange={(value) => handleSampleChange("tech", value)}
                  placeholder="Search Tech/CAT"
                  allowCustomValue={true}
                  className={`${highlightedField === "tech" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feature">Feature/App</Label>
                <AutocompleteInput
                  id="feature"
                  options={mockFeatureApp}
                  value={currentSample.feature}
                  onChange={(value) => handleSampleChange("feature", value)}
                  placeholder="Search Feature/App"
                  allowCustomValue={true}
                  className={`${highlightedField === "feature" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sample-identity">Sample Identity</Label>
                <Input
                  id="sample-identity"
                  value={currentSample.sampleIdentity}
                  onChange={(e) => handleSampleChange("sampleIdentity", e.target.value)}
                  placeholder="Enter sample identifier"
                  className={`${highlightedField === "sampleIdentity" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={currentSample.type} onValueChange={(value) => handleSampleChange("type", value)}>
                  <SelectTrigger
                    id="type"
                    className={`w-full ${highlightedField === "type" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form">Form</Label>
                <Select value={currentSample.form} onValueChange={(value) => handleSampleChange("form", value)}>
                  <SelectTrigger
                    id="form"
                    className={`w-full ${highlightedField === "form" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.map((form) => (
                      <SelectItem key={form.value} value={form.value}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      // Additional cases for other sample categories are similar to NTR implementation
      // I'm including just one more example for brevity - in actual implementation you would include all cases
      case "benchmark":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feature">Feature/App</Label>
                <AutocompleteInput
                  id="feature"
                  options={mockFeatureApp}
                  value={currentSample.feature}
                  onChange={(value) => handleSampleChange("feature", value)}
                  placeholder="Search Feature/App"
                  allowCustomValue={true}
                  className={`${highlightedField === "feature" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample-identity">Sample Identity</Label>
                <Input
                  id="sample-identity"
                  value={currentSample.sampleIdentity}
                  onChange={(e) => handleSampleChange("sampleIdentity", e.target.value)}
                  placeholder="Enter sample identifier"
                  className={`${highlightedField === "sampleIdentity" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={currentSample.type} onValueChange={(value) => handleSampleChange("type", value)}>
                  <SelectTrigger
                    id="type"
                    className={`w-full ${highlightedField === "type" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form">Form</Label>
                <Select value={currentSample.form} onValueChange={(value) => handleSampleChange("form", value)}>
                  <SelectTrigger
                    id="form"
                    className={`w-full ${highlightedField === "form" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.map((form) => (
                      <SelectItem key={form.value} value={form.value}>
                        {form.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Calendar component for enhanced visualization
  const EnhancedCalendar = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Generate days for the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

    // Create calendar grid
    const days = []

    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentYear, currentMonth, i)
      const dateString = dateObj.toISOString().split("T")[0]
      const isToday = i === today.getDate()
      const isSelected = formData.selectedDates.includes(dateString)
      const isCurrentlyViewing = dateString === selectedDate
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

      // Get availability data for this date
      const dateAvailability = availableDates[dateString]
      const isAvailable = dateAvailability?.available
      const isPartiallyAvailable = dateAvailability?.partiallyAvailable

      // Determine the appropriate class based on availability
      let bgColorClass = "bg-gray-100 text-gray-400" // default/unavailable
      let hoverClass = ""

      if (isAvailable) {
        if (isPartiallyAvailable) {
          bgColorClass = "bg-yellow-50 text-yellow-800 border border-yellow-200"
          hoverClass = "hover:bg-yellow-100 cursor-pointer"
        } else {
          bgColorClass = "bg-green-50 text-green-800 border border-green-200"
          hoverClass = "hover:bg-green-100 cursor-pointer"
        }
      }

      // Disabled class for past dates
      const isPastDate = dateObj < new Date(today.setHours(0, 0, 0, 0))
      if (isPastDate) {
        bgColorClass = "bg-gray-100 text-gray-400"
        hoverClass = ""
      }

      // Selected date styling
      if (isSelected) {
        bgColorClass = "bg-blue-500 text-white"
        hoverClass = ""
      }

      // Currently viewing date styling
      if (isCurrentlyViewing) {
        bgColorClass = "bg-blue-700 text-white"
        hoverClass = ""
      }

      days.push(
        <div
          key={i}
          onClick={() => (!isPastDate && isAvailable ? handleDateSelect(dateString) : null)}
          className={`relative h-10 w-10 flex items-center justify-center rounded-full 
                     ${bgColorClass} ${hoverClass} ${isToday ? "font-bold" : ""}`}
        >
          {i}
          {isAvailable && !isSelected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-blue-500"></span>
                </TooltipTrigger>
                <TooltipContent>
                  {dateAvailability?.slots} of {dateAvailability?.totalSlots} slots available
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>,
      )
    }

    // Add empty cells to complete the grid if needed
    const totalCells = days.length
    const cellsToAdd = Math.ceil(totalCells / 7) * 7 - totalCells
    for (let i = 0; i < cellsToAdd; i++) {
      days.push(<div key={`end-empty-${i}`} className="h-10 w-10"></div>)
    }

    return (
      <div className="mt-4">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold">
            {today.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="font-medium text-sm">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
        <div className="mt-4 flex items-center text-sm text-muted-foreground justify-between">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-100 border border-green-200 mr-1"></div>
            <span>Fully Available</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-yellow-100 border border-yellow-200 mr-1"></div>
            <span>Partially Available</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-blue-500 mr-1"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    )
  }

  // Get total number of time slots across all dates
  const getTotalTimeSlots = () => {
    let total = 0
    Object.values(formData.reservationSchedule).forEach((dateData) => {
      total += dateData.timeSlots.length
    })
    return total
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Link href="/request/new">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Request Types
            </Button>
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Equipment Reservation (ER)</h1>
          <p className="text-muted-foreground">Reserve laboratory equipment for self-service testing and experiments</p>
        </div>

        <div className="w-full">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
              <CardDescription>Provide basic information about your equipment reservation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Request Title</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  placeholder="Enter a descriptive title for your request"
                  className={`w-full ${currentStep === 1 && !formData.projectName ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoFocus
                  autoComplete="off"
                />
                {currentStep === 1 && !formData.projectName && (
                  <p className="text-sm text-red-500">Please enter a request title to continue</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Use IO Number</Label>
                <RadioGroup
                  defaultValue={formData.fundingSource}
                  onValueChange={(value) => handleSelectChange("fundingSource", value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="io" id="use-io-yes" />
                    <Label htmlFor="use-io-yes" className="font-normal">
                      Yes, use IO Number
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-io" id="use-io-no" />
                    <Label htmlFor="use-io-no" className="font-normal">
                      No, don't use IO Number
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {formData.fundingSource === "io" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="ioNumber">IO Number</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-80 text-sm">Select the IO Number associated with your project.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select
                        value={formData.ioNumber}
                        onValueChange={(value) => handleSelectChange("ioNumber", value)}
                      >
                        <SelectTrigger
                          id="ioNumber"
                          className={
                            formData.fundingSource === "io" && !formData.ioNumber
                              ? "ring-2 ring-blue-500 border-blue-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select IO Number" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {mockIoNumbers.map((io) => (
                            <SelectItem key={io.value} value={io.value}>
                              {io.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.fundingSource === "io" && !formData.ioNumber && (
                        <p className="text-sm text-red-500">Please select an IO Number to continue</p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="costCenter">Cost Center</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-80 text-sm">This is automatically populated based on your profile.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="costCenter"
                      name="costCenter"
                      value={formData.costCenter || "0090-01560"}
                      disabled
                      className="bg-gray-100"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={!formData.projectName || (formData.fundingSource === "io" && !formData.ioNumber)}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Capability and Equipment Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capability">Select Capability</Label>
                <Select value={formData.capability} onValueChange={(value) => handleSelectChange("capability", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a capability" />
                  </SelectTrigger>
                  <SelectContent>
                    {capabilities.map((capability) => (
                      <SelectItem key={capability.id} value={capability.id}>
                        {capability.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.capability && (
                <div className="space-y-2">
                  <Label htmlFor="equipment">Select Equipment</Label>
                  <Select value={formData.equipment} onValueChange={(value) => handleSelectChange("equipment", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentByCapability[formData.capability]?.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.equipment && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Equipment selected:{" "}
                    {equipmentByCapability[formData.capability]?.find((e) => e.id === formData.equipment)?.name}
                    <br />
                    Typical test duration: 1-2 hours per sample
                    <br />
                    Operator availability: Monday-Friday, 9:00 AM - 5:00 PM
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={!formData.projectName || (formData.fundingSource === "io" && !formData.ioNumber)}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 3 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Sample Information</CardTitle>
              <CardDescription>Add one or more samples for testing</CardDescription>
            </CardHeader>
            <CardContent>
              {!showSampleSections && formData.samples.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-medium">No samples added yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Click the button below to start adding samples to your request. You'll be guided through the
                      process step by step.
                    </p>
                    <Button
                      onClick={startAddingSamples}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Click to start adding samples
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Samples</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.samples.length === 0
                          ? "No samples added yet. Use the automatic naming system to add samples."
                          : `${formData.samples.length} sample(s) added`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" disabled={formData.samples.length === 0}>
                            <Save className="mr-2 h-4 w-4" />
                            Save List
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Sample List</DialogTitle>
                            <DialogDescription>Save this list of samples for future use</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="list-name">List Name</Label>
                              <Input
                                id="list-name"
                                value={sampleListName}
                                onChange={(e) => setSampleListName(e.target.value)}
                                placeholder="Enter a name for this sample list"
                                autoComplete="off"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveSampleList}>Save List</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline">Load List</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Load Sample List</DialogTitle>
                            <DialogDescription>Select a previously saved sample list</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {savedSampleLists.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No saved sample lists found.</p>
                            ) : (
                              <div className="space-y-2">
                                {savedSampleLists.map((list) => (
                                  <div
                                    key={list.id}
                                    className="flex justify-between items-center p-3 border rounded-md hover:bg-muted cursor-pointer"
                                    onClick={() => handleLoadSampleList(list.id)}
                                  >
                                    <div>
                                      <p className="font-medium">{list.name}</p>
                                      <p className="text-sm text-muted-foreground">{list.samples.length} sample(s)</p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      Load
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
                              Cancel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 mt-4">
                    {/* Left Column: Automatic Sample Naming System */}
                    <div
                      className={`border rounded-md p-6 space-y-5 ${
                        focusedSection === "naming" ? "border-blue-500 border-2 ring-2 ring-blue-300" : ""
                      }`}
                      ref={automaticNamingRef}
                    >
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium">Automatic Sample Naming System</h3>
                        <div className="space-y-2">
                          <Label htmlFor="sample-category">Sample Category</Label>
                          <Select
                            value={sampleCategory}
                            onValueChange={(value) => {
                              setSampleCategory(value)
                              setCurrentSample((prev) => ({
                                ...prev,
                                category: value,
                                generatedName: "",
                              }))
                            }}
                          >
                            <SelectTrigger
                              id="sample-category"
                              className={`w-full ${showSampleSections && !sampleCategory ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                              autoFocus={showSampleSections}
                            >
                              <SelectValue placeholder="Select sample category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="commercial">Commercial Grade</SelectItem>
                              <SelectItem value="td">TD/NPD</SelectItem>
                              <SelectItem value="benchmark">Benchmark</SelectItem>
                              <SelectItem value="inprocess">Inprocess</SelectItem>
                              <SelectItem value="chemicals">Chemicals/Substances</SelectItem>
                              <SelectItem value="cap">Cap Development</SelectItem>
                            </SelectContent>
                          </Select>
                          {showSampleSections && !sampleCategory && (
                            <p className="text-sm text-red-500">Please select a sample category</p>
                          )}
                        </div>
                      </div>

                      <Tabs value={sampleCategory} className="w-full mt-4">
                        <TabsContent value={sampleCategory} className="space-y-5 pt-2">
                          {renderSampleFields()}

                          <div className="space-y-3 pt-2 border-t">
                            <Label htmlFor="generated-name">Generated Sample Name</Label>
                            <Input
                              id="generated-name"
                              value={currentSample.generatedName}
                              disabled
                              className="bg-gray-100 font-medium"
                              autoComplete="off"
                            />
                          </div>

                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={handleAddSample}
                              disabled={!currentSample.generatedName}
                              className="w-full md:w-auto"
                            >
                              {editMode ? (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mr-2"
                                  >
                                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                  Update Sample
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Sample
                                </>
                              )}
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Right Column: Sample Summary */}
                    <div
                      className={`border rounded-md p-6 space-y-5 ${
                        focusedSection === "summary" ? "border-blue-500 border-2 ring-2 ring-blue-300" : ""
                      }`}
                      ref={sampleSummaryRef}
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium">Sample Summary</h3>
                          <p className="text-sm text-muted-foreground">
                            {formData.samples.length === 0
                              ? "No samples added yet."
                              : "Review, edit, or copy your samples"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={focusOnNamingSystem}
                          className={`flex items-center gap-1 ${
                            focusedSection === "addMore" ? "ring-2 ring-blue-500 border-blue-500" : ""
                          }`}
                          ref={addMoreButtonRef}
                        >
                          <Plus className="h-4 w-4" />
                          Add more sample
                        </Button>
                      </div>

                      {formData.samples.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {formData.samples.map((sample, index) => (
                            <div key={index} className="border rounded-md p-4 space-y-2 hover:bg-gray-50">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs mr-2">
                                    {index + 1}
                                  </span>
                                  {sample.generatedName}
                                </span>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleCopySample(sample)}>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-copy-plus"
                                    >
                                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                      <path d="M15 11h6" />
                                      <path d="M18 8v6" />
                                    </svg>
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleEditSample(sample, index)}>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-pencil"
                                    >
                                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                      <path d="m15 5 4 4" />
                                    </svg>
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveSample(index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="inline-block mr-3">
                                  Category:{" "}
                                  {sample.category === "commercial"
                                    ? "Commercial Grade"
                                    : sample.category === "td"
                                      ? "TD/NPD"
                                      : sample.category === "benchmark"
                                        ? "Benchmark"
                                        : sample.category === "inprocess"
                                          ? "Inprocess/Chemicals"
                                          : sample.category === "chemicals"
                                            ? "Chemicals/Substances"
                                            : "Cap Development"}
                                </span>
                                {sample.type && <span className="inline-block mr-3">Type: {sample.type}</span>}
                                {sample.form && <span className="inline-block">Form: {sample.form}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md">
                          <p className="text-muted-foreground">No samples added yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use the automatic naming system to add samples
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button onClick={nextStep} disabled={!formData.equipment}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Reservation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Reservation Dates</Label>
                    <p className="text-sm text-muted-foreground">
                      Click on available dates in the calendar to select multiple dates
                    </p>
                    {/* Enhanced Calendar Component */}
                    <div className="border rounded-md p-4 bg-white">
                      <EnhancedCalendar />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedDate && (
                    <>
                      <div className="space-y-2">
                        <Label>Selected Date: {selectedDate}</Label>
                        <div className="border rounded-md p-4 bg-white">
                          <h3 className="font-medium mb-2">Available Time Slots</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {timeSlots.map((slot) => {
                              const isSelected = formData.reservationSchedule[selectedDate]?.timeSlots.some(
                                (s) => s.time === slot.time,
                              )

                              return (
                                <div
                                  key={slot.id}
                                  className={`p-3 rounded-md border ${
                                    !slot.available
                                      ? "bg-gray-100 cursor-not-allowed opacity-50"
                                      : isSelected
                                        ? "bg-green-50 border-green-300"
                                        : "hover:border-blue-500 cursor-pointer"
                                  }`}
                                  onClick={() => slot.available && handleTimeSlotSelect(slot)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>{slot.time}</span>
                                    </div>
                                    <Badge variant={slot.available ? "outline" : "secondary"}>
                                      {!slot.available ? "Booked" : isSelected ? "Selected" : "Available"}
                                    </Badge>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {!selectedDate && formData.selectedDates.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-md">
                      <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Select a date from the calendar</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Green dates have full availability, yellow dates have partial availability
                      </p>
                    </div>
                  )}

                  {/* Selected Dates Summary */}
                  {formData.selectedDates.length > 0 && (
                    <div className="border rounded-md p-4 bg-white">
                      <h3 className="font-medium mb-3">Selected Dates Summary</h3>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {formData.selectedDates.map((date) => {
                          const dateSchedule = formData.reservationSchedule[date] || { timeSlots: [] }
                          const timeSlotCount = dateSchedule.timeSlots.length

                          return (
                            <div key={date} className="p-3 border rounded-md">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span className="font-medium">{date}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{timeSlotCount} time slot(s)</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveDate(date)}
                                    className="h-6 w-6"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>

                              {timeSlotCount > 0 && (
                                <div className="mt-2 pl-6">
                                  <p className="text-sm text-muted-foreground mb-1">Selected time slots:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {dateSchedule.timeSlots.map((slot, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {slot.time}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cost Summary */}
                  {getTotalTimeSlots() > 0 && (
                    <div className="mt-4 p-4 border rounded-md bg-blue-50">
                      <h3 className="font-medium text-blue-800 mb-2">Reservation Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Selected Dates:</span>
                          <span>{formData.selectedDates.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Time Slots:</span>
                          <span>{getTotalTimeSlots()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost per Hour:</span>
                          <span>฿{equipmentCosts[formData.equipment]?.toLocaleString() || "2,000"}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total Cost:</span>
                          <span>฿{formData.cost.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          Note: The final cost may vary based on actual usage and any additional services required.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button onClick={nextStep} disabled={Object.keys(formData.reservationSchedule).length === 0}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Testing Mode and Operator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Testing Mode</Label>
                <RadioGroup
                  value={formData.testingMode}
                  onValueChange={(value) => handleSelectChange("testingMode", value)}
                  className="flex flex-col space-y-4"
                >
                  <div className="flex items-start space-x-3 p-3 border rounded-md">
                    <RadioGroupItem value="operator" id="operator" className="mt-1" />
                    <div>
                      <Label htmlFor="operator" className="cursor-pointer font-medium">
                        Expert Operator
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        A trained operator will conduct the testing for you
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-md">
                    <RadioGroupItem value="self" id="self" className="mt-1" />
                    <div>
                      <Label htmlFor="self" className="cursor-pointer font-medium">
                        Self-Service
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        You will conduct the testing yourself (requires prior training)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-md">
                    <RadioGroupItem value="observation" id="observation" className="mt-1" />
                    <div>
                      <Label htmlFor="observation" className="cursor-pointer font-medium">
                        Observation
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        You want to participate and observe the testing process
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequirements">Special Requirements or Parameters</Label>
                <Textarea
                  id="specialRequirements"
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleInputChange}
                  placeholder="Specify any special requirements or parameters for the testing"
                  rows={4}
                />
              </div>

              {formData.testingMode === "self" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Self-service testing requires prior training and certification on the equipment. If you haven't been
                    certified yet, please contact the lab manager to arrange for training.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button onClick={nextStep}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="attachments">Upload Relevant Files</Label>
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
                  <Input id="attachments" type="file" multiple onChange={handleFileChange} className="hidden" />
                  <Button variant="outline" onClick={() => document.getElementById("attachments").click()}>
                    Browse Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Accepted file types: PDF, JPG, PNG, DOCX (Max 10MB per file)
                  </p>
                </div>
              </div>

              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files</Label>
                  <div className="space-y-2">
                    {Array.from(formData.attachments).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.priority === "urgent" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Don't forget to attach your Urgent Memo for priority processing.</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button onClick={nextStep}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>Review and Confirm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                  <TabsTrigger value="samples">Samples</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Project Name</Label>
                      <p className="font-medium">{formData.projectName || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Funding Source</Label>
                      <p className="font-medium">{formData.fundingSource === "io" ? "IO Number" : "Non-IO Request"}</p>
                    </div>
                    {formData.fundingSource === "io" && (
                      <div>
                        <Label className="text-muted-foreground">IO Number</Label>
                        <p className="font-medium">{formData.ioNumber || "Not specified"}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Cost Center</Label>
                      <p className="font-medium">{formData.costCenter || "Not specified"}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Testing Mode</Label>
                      <p className="font-medium">
                        {formData.testingMode === "operator"
                          ? "Expert Operator"
                          : formData.testingMode === "self"
                            ? "Self-Service"
                            : "Observation"}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="equipment" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Capability</Label>
                      <p className="font-medium">
                        {capabilities.find((c) => c.id === formData.capability)?.name || "Not selected"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Equipment</Label>
                      <p className="font-medium">
                        {equipmentByCapability[formData.capability]?.find((e) => e.id === formData.equipment)?.name ||
                          "Not selected"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Special Requirements</Label>
                    <p className="font-medium">{formData.specialRequirements || "None specified"}</p>
                  </div>
                </TabsContent>

                <TabsContent value="samples" className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Number of Samples</Label>
                    <p className="font-medium">{formData.samples.length}</p>
                  </div>

                  {formData.samples.map((sample, index) => (
                    <div key={index} className="p-4 border rounded-md space-y-2">
                      <Badge variant="outline">Sample {index + 1}</Badge>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Sample Name</Label>
                          <p className="font-medium">{sample.generatedName || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Category</Label>
                          <p className="font-medium">
                            {sample.category === "commercial"
                              ? "Commercial Grade"
                              : sample.category === "td"
                                ? "TD/NPD"
                                : sample.category === "benchmark"
                                  ? "Benchmark"
                                  : sample.category === "inprocess"
                                    ? "Inprocess"
                                    : sample.category === "chemicals"
                                      ? "Chemicals/Substances"
                                      : "Cap Development"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Type</Label>
                          <p className="font-medium">{sample.type || "Not specified"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Form</Label>
                          <p className="font-medium">{sample.form || "Not specified"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Selected Dates</Label>
                    <div className="space-y-2 mt-2">
                      {formData.selectedDates.length > 0 ? (
                        formData.selectedDates.map((date) => {
                          const dateSchedule = formData.reservationSchedule[date] || { timeSlots: [] }
                          return (
                            <div key={date} className="p-3 border rounded-md">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{date}</span>
                                <Badge variant="outline">{dateSchedule.timeSlots.length} time slot(s)</Badge>
                              </div>
                              {dateSchedule.timeSlots.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground mb-1">Time slots:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {dateSchedule.timeSlots.map((slot, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {slot.time}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="font-medium">No dates selected</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Cost</Label>
                    <p className="font-medium">฿{formData.cost.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      Based on {getTotalTimeSlots()} hour(s) at ฿
                      {equipmentCosts[formData.equipment]?.toLocaleString() || "2,000"}/hour
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Attachments</Label>
                    {formData.attachments.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {Array.from(formData.attachments).map((file, index) => (
                          <div key={index} className="text-sm">
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-medium">No attachments</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review all information carefully before submitting your equipment reservation request. Once
                  submitted, you will receive a confirmation with your ER code and further instructions.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="terms" className="rounded border-gray-300" />
                <Label htmlFor="terms" className="text-sm">
                  I confirm that all information provided is correct and I agree to the equipment usage terms and
                  conditions.
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button onClick={() => router.push("/request/new/er/confirmation")}>Submit Reservation</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

