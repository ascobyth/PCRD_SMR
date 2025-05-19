"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, HelpCircle, Plus, Upload, Paperclip, Calendar } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ASRPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    requestTitle: "",
    priority: "normal",
    useIONumber: "yes",
    ioNumber: "",
    costCenter: "0090-01560",
    problemSource: "",
    testObjective: "",
    expectedResults: "",
    desiredCompletionDate: "",
    samples: [],
    selectedCapabilities: [],
    additionalRequirements: "",
    attachments: [],
  })

  // Sample category state - reusing from NTR
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

  // Add these new state variables after the existing state declarations
  const [editMode, setEditMode] = useState(false)
  const [editingSampleIndex, setEditingSampleIndex] = useState<number | null>(null)
  const automaticNamingRef = useRef<HTMLDivElement>(null)
  const sampleSummaryRef = useRef<HTMLDivElement>(null)
  const addMoreButtonRef = useRef<HTMLButtonElement>(null)
  const [focusedSection, setFocusedSection] = useState<"naming" | "summary" | "addMore" | null>(null)
  const [showSampleSections, setShowSampleSections] = useState(false)
  const [highlightedField, setHighlightedField] = useState<string | null>("sample-category")
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false)

  // Required fields for each sample category - reusing from NTR
  const requiredFields = {
    commercial: ["grade", "lot", "sampleIdentity", "type", "form"],
    td: ["tech", "feature", "sampleIdentity", "type", "form"],
    benchmark: ["feature", "sampleIdentity", "type", "form"],
    inprocess: ["plant", "samplingDate", "samplingTime", "sampleIdentity", "type", "form"],
    chemicals: ["plant", "samplingDate", "samplingTime", "sampleIdentity", "type", "form"],
    cap: ["feature", "sampleIdentity", "type", "form"],
  }

  // Function to check if a field is required
  const isFieldRequired = (field: string) => {
    return requiredFields[sampleCategory as keyof typeof requiredFields]?.includes(field) || false
  }

  // Function to find the next empty required field
  const findNextEmptyRequiredField = () => {
    const fields = requiredFields[sampleCategory as keyof typeof requiredFields] || []
    for (const field of fields) {
      if (!currentSample[field as keyof typeof currentSample]) {
        return field
      }
    }
    return null
  }

  // Function to highlight the next empty required field
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

  // Check for empty required fields when sample category changes
  useEffect(() => {
    if (showSampleSections) {
      highlightNextEmptyField()
    }
  }, [sampleCategory, showSampleSections])

  // Add this useEffect after the existing useEffect hooks
  useEffect(() => {
    // Load form data from localStorage if available
    try {
      const savedFormData = localStorage.getItem("asrFormData")
      if (savedFormData) {
        const parsedFormData = JSON.parse(savedFormData)
        setFormData((prev) => ({
          ...prev,
          ...parsedFormData,
        }))
        // Clear the saved form data after loading it
        localStorage.removeItem("asrFormData")
      }

      // Load samples if available
      const savedSamples = localStorage.getItem("asrSamples")
      if (savedSamples) {
        const parsedSamples = JSON.parse(savedSamples)
        setFormData((prev) => ({
          ...prev,
          samples: parsedSamples,
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

  // Mock data for sample fields - reusing from NTR
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

  // Mock IO Numbers with the new format
  const mockIoNumbers = [
    { value: "0090919390", label: "0090919390 Rheology Characterization" },
    { value: "0090919391", label: "0090919391 Thermal Analysis" },
    { value: "0090919392", label: "0090919392 Mechanical Testing" },
    { value: "0090919393", label: "0090919393 Barrier Properties" },
    { value: "0090919394", label: "0090919394 Optical Properties" },
  ]

  // Mock problem sources
  const problemSources = [
    { value: "customer", label: "Customer Complaint" },
    { value: "production", label: "Production Issue" },
    { value: "development", label: "New Product Development" },
    { value: "research", label: "Research Project" },
    { value: "quality", label: "Quality Control" },
    { value: "other", label: "Other" },
  ]

  // Mock capabilities
  const capabilities = [
    {
      id: "microstructure",
      name: "Microstructure",
      description: "Analysis of material structure at microscopic level",
    },
    { id: "rheology", name: "Rheology", description: "Study of flow and deformation of materials" },
    { id: "small-molecule", name: "Small Molecule", description: "Analysis of small molecular compounds" },
    { id: "mesostructure", name: "Mesostructure & Imaging", description: "Imaging and analysis at mesoscopic scale" },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      }))

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles],
      }))

      toast({
        title: "Files added",
        description: `${newFiles.length} file(s) added successfully.`,
      })
    }
  }

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleCapabilityToggle = (capabilityId: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedCapabilities.includes(capabilityId)

      if (isSelected) {
        return {
          ...prev,
          selectedCapabilities: prev.selectedCapabilities.filter((id) => id !== capabilityId),
        }
      } else {
        return {
          ...prev,
          selectedCapabilities: [...prev.selectedCapabilities, capabilityId],
        }
      }
    })
  }

  // Check for duplicate sample names
  const isDuplicateSampleName = (name: string, excludeIndex?: number) => {
    return formData.samples.some(
      (sample, index) => sample.generatedName === name && (excludeIndex === undefined || index !== excludeIndex),
    )
  }

  // Modify the handleAddSample function to retain form data and check for duplicates
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

      setSampleDialogOpen(false)

      // Reset highlighted field
      setHighlightedField(null)

    }
  }

  const openAddSampleDialog = () => {
    setEditMode(false)
    setEditingSampleIndex(null)
    setCurrentSample({
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
    setSampleCategory("")
    setShowSampleSections(true)
    setSampleDialogOpen(true)
    setTimeout(() => {
      highlightNextEmptyField()
    }, 100)
  }

  const openEditSampleDialog = (sample: any, index: number) => {
    setCurrentSample({ ...sample })
    setSampleCategory(sample.category)
    setEditMode(true)
    setEditingSampleIndex(index)
    setSampleDialogOpen(true)
  }

  // Update the handleRemoveSample function
  const handleRemoveSample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      samples: prev.samples.filter((_, i) => i !== index),
    }))

    // Keep focus on the Sample Summary section
    if (sampleSummaryRef.current) {
      setFocusedSection("summary")
      setTimeout(() => setFocusedSection(null), 2000) // Remove highlight after 2 seconds
    }
  }

  // Update the handleCopySample function
  const handleCopySample = (sample: any) => {
    setCurrentSample({ ...sample })
    setSampleCategory(sample.category)
    setEditMode(false)
    setEditingSampleIndex(null)
    setSampleDialogOpen(true)

    toast({
      title: "Sample copied",
      description: "Sample details copied. Make changes and add as a new sample.",
    })
  }

  // Update the handleEditSample function
  const handleEditSample = (sample: any, index: number) => {
    openEditSampleDialog(sample, index)
  }

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate Request Information
      if (!formData.requestTitle) {
        toast({
          title: "Required Field Missing",
          description: "Please enter a request title to continue.",
        })
        return
      }

      if (formData.useIONumber === "yes" && !formData.ioNumber) {
        toast({
          title: "Required Field Missing",
          description: "Please select an IO Number to continue.",
        })
        return
      }
    } else if (currentStep === 2) {
      // Validate Problem Description
      if (!formData.problemSource) {
        toast({
          title: "Required Field Missing",
          description: "Please select a problem source to continue.",
        })
        return
      }

      if (!formData.testObjective) {
        toast({
          title: "Required Field Missing",
          description: "Please enter test objectives to continue.",
        })
        return
      }
    } else if (currentStep === 3) {
      // Validate Samples
      if (formData.samples.length === 0) {
        toast({
          title: "Required Field Missing",
          description: "Please add at least one sample to continue.",
        })
        return
      }
    } else if (currentStep === 4) {
      // Validate Expected Results and Timeline
      if (!formData.expectedResults) {
        toast({
          title: "Required Field Missing",
          description: "Please enter expected results to continue.",
        })
        return
      }

      if (!formData.desiredCompletionDate) {
        toast({
          title: "Required Field Missing",
          description: "Please select a desired completion date to continue.",
        })
        return
      }
    } else if (currentStep === 5) {
      // Validate Capability Selection
      if (formData.selectedCapabilities.length === 0) {
        toast({
          title: "Required Field Missing",
          description: "Please select at least one capability to continue.",
        })
        return
      }
    }

    // If moving from step 3 to step 4, save samples to localStorage
    if (currentStep === 3) {
      try {
        localStorage.setItem("asrSamples", JSON.stringify(formData.samples))
      } catch (error) {
        console.error("Error saving samples to localStorage:", error)
      }
    }

    setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleReviewAndSubmit = () => {
    try {
      localStorage.setItem("asrFormData", JSON.stringify(formData))
      localStorage.setItem("asrSamples", JSON.stringify(formData.samples))
    } catch (error) {
      console.error("Error saving form data:", error)
    }
    router.push("/request/new/asr/summary")
  }

  // Function to start adding samples
  const startAddingSamples = () => {
    openAddSampleDialog()
  }

  // Function to render sample form fields based on category
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

      case "inprocess":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="plant">Plant</Label>
                <Select value={currentSample.plant} onValueChange={(value) => handleSampleChange("plant", value)}>
                  <SelectTrigger
                    id="plant"
                    className={`w-full ${highlightedField === "plant" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select plant" />
                  </SelectTrigger>
                  <SelectContent>
                    {plantOptions.map((plant) => (
                      <SelectItem key={plant.value} value={plant.value}>
                        {plant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampling-date">Sampling Date</Label>
                <Input
                  id="sampling-date"
                  type="date"
                  value={currentSample.samplingDate}
                  onChange={(e) => handleSampleChange("samplingDate", e.target.value)}
                  className={`${highlightedField === "samplingDate" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampling-time">Sampling Time</Label>
                <Input
                  id="sampling-time"
                  type="time"
                  value={currentSample.samplingTime}
                  onChange={(e) => handleSampleChange("samplingTime", e.target.value)}
                  className={`${highlightedField === "samplingTime" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
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

      case "chemicals":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="plant">Plant</Label>
                <Select value={currentSample.plant} onValueChange={(value) => handleSampleChange("plant", value)}>
                  <SelectTrigger
                    id="plant"
                    className={`w-full ${highlightedField === "plant" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  >
                    <SelectValue placeholder="Select plant" />
                  </SelectTrigger>
                  <SelectContent>
                    {plantOptions.map((plant) => (
                      <SelectItem key={plant.value} value={plant.value}>
                        {plant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampling-date">Sampling Date</Label>
                <Input
                  id="sampling-date"
                  type="date"
                  value={currentSample.samplingDate}
                  onChange={(e) => handleSampleChange("samplingDate", e.target.value)}
                  className={`${highlightedField === "samplingDate" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampling-time">Sampling Time</Label>
                <Input
                  id="sampling-time"
                  type="time"
                  value={currentSample.samplingTime}
                  onChange={(e) => handleSampleChange("samplingTime", e.target.value)}
                  className={`${highlightedField === "samplingTime" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                  autoComplete="off"
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

      case "cap":
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
          <h1 className="text-3xl font-bold tracking-tight">Create Analysis Solution Request (ASR)</h1>
          <p className="text-muted-foreground">
            Request custom analysis solutions for complex polymer characterization problems
          </p>
        </div>

        <div className="flex justify-between border-b pb-4">
          <div className="flex space-x-4">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep >= 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep >= 2 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep >= 3 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              3
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep >= 4 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              4
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep >= 5 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              5
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep >= 6 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              6
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Information</CardTitle>
                  <CardDescription>Provide basic information about your analysis request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="request-title">Request Title</Label>
                    <Input
                      id="request-title"
                      name="requestTitle"
                      value={formData.requestTitle}
                      onChange={handleChange}
                      placeholder="Enter a descriptive title for your request"
                      className={`w-full ${currentStep === 1 && !formData.requestTitle ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                      autoFocus
                      autoComplete="off"
                    />
                    {currentStep === 1 && !formData.requestTitle && (
                      <p className="text-sm text-red-500">Please enter a request title to continue</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <RadioGroup
                      defaultValue={formData.priority}
                      onValueChange={(value) => handleSelectChange("priority", value)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="normal" id="priority-normal" />
                        <Label htmlFor="priority-normal" className="font-normal">
                          Normal (Approximately 14 working days)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="urgent" id="priority-urgent" />
                        <Label htmlFor="priority-urgent" className="font-normal">
                          Urgent (Min. 5 days, higher cost)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Use IO Number</Label>
                    <RadioGroup
                      defaultValue={formData.useIONumber}
                      onValueChange={(value) => handleSelectChange("useIONumber", value)}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="use-io-yes" />
                        <Label htmlFor="use-io-yes" className="font-normal">
                          Yes, use IO Number
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="use-io-no" />
                        <Label htmlFor="use-io-no" className="font-normal">
                          No, don't use IO Number
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {formData.useIONumber === "yes" && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="io-number">IO Number</Label>
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
                              id="io-number"
                              className={
                                formData.useIONumber === "yes" && !formData.ioNumber
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
                          {formData.useIONumber === "yes" && !formData.ioNumber && (
                            <p className="text-sm text-red-500">Please select an IO Number to continue</p>
                          )}
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="cost-center">Cost Center</Label>
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
                          id="cost-center"
                          name="costCenter"
                          value={formData.costCenter}
                          disabled
                          className="bg-gray-100"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                  <CardDescription>Describe the problem or challenge you need help with</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="problem-source">Problem Source</Label>
                    <Select
                      value={formData.problemSource}
                      onValueChange={(value) => handleSelectChange("problemSource", value)}
                    >
                      <SelectTrigger
                        id="problem-source"
                        className={`w-full ${!formData.problemSource ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                      >
                        <SelectValue placeholder="Select problem source" />
                      </SelectTrigger>
                      <SelectContent>
                        {problemSources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formData.problemSource && (
                      <p className="text-sm text-red-500">Please select a problem source to continue</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-objective">Test Objectives</Label>
                    <Textarea
                      id="test-objective"
                      name="testObjective"
                      value={formData.testObjective}
                      onChange={handleChange}
                      placeholder="Describe what you want to achieve with this analysis"
                      className={`min-h-[120px] ${!formData.testObjective ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                    />
                    {!formData.testObjective && (
                      <p className="text-sm text-red-500">Please enter test objectives to continue</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

              {currentStep === 3 && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Sample Information</CardTitle>
                  <CardDescription>Add one or more samples for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  {formData.samples.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-medium">No samples added yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Click the button below to start adding samples to your request. You'll be guided through the
                          process step by step.
                        </p>
                        <Button
                          onClick={openAddSampleDialog}
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Sample
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium">Samples</h3>
                          <p className="text-sm text-muted-foreground">{`${formData.samples.length} sample(s) added`}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openAddSampleDialog}
                          className="flex items-center gap-1"
                          ref={addMoreButtonRef}
                        >
                          <Plus className="h-4 w-4" />
                          Add New Sample
                        </Button>
                      </div>

                      <div className="border rounded-md p-6 space-y-5" ref={sampleSummaryRef}>
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
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy-plus"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /><path d="M15 11h6" /><path d="M18 8v6" /></svg>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditSample(sample, index)}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSample(index)}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
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
                            <p className="text-xs text-muted-foreground mt-1">Use the Add New Sample button to add samples</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Expected Results and Timeline</CardTitle>
                  <CardDescription>Specify what results you expect and when you need them</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected-results">Expected Results</Label>
                    <Textarea
                      id="expected-results"
                      name="expectedResults"
                      value={formData.expectedResults}
                      onChange={handleChange}
                      placeholder="Describe what results or insights you expect to gain from this analysis"
                      className={`min-h-[120px] ${!formData.expectedResults ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                    />
                    {!formData.expectedResults && (
                      <p className="text-sm text-red-500">Please enter expected results to continue</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="desired-completion-date">Desired Completion Date</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-80 text-sm">
                              Select the date by which you need the results. Note that complex analyses may require more
                              time.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="desired-completion-date"
                        name="desiredCompletionDate"
                        type="date"
                        value={formData.desiredCompletionDate}
                        onChange={handleChange}
                        className={`${!formData.desiredCompletionDate ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                      />
                    </div>
                    {!formData.desiredCompletionDate && (
                      <p className="text-sm text-red-500">Please select a desired completion date to continue</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Capability Selection</CardTitle>
                  <CardDescription>Select the capabilities you need for your analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Capabilities</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose one or more capabilities that you believe are needed for your analysis. Our experts will
                      review your selection.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {capabilities.map((capability) => (
                        <div
                          key={capability.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            formData.selectedCapabilities.includes(capability.id)
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => handleCapabilityToggle(capability.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id={`capability-${capability.id}`}
                              checked={formData.selectedCapabilities.includes(capability.id)}
                              onCheckedChange={() => handleCapabilityToggle(capability.id)}
                              className="mt-1"
                            />
                            <div>
                              <Label
                                htmlFor={`capability-${capability.id}`}
                                className="text-base font-medium cursor-pointer"
                              >
                                {capability.name}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">{capability.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {formData.selectedCapabilities.length === 0 && (
                      <p className="text-sm text-red-500 mt-2">Please select at least one capability to continue</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Provide any additional details or attachments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="additional-requirements">Additional Requirements or Comments</Label>
                    <Textarea
                      id="additional-requirements"
                      name="additionalRequirements"
                      value={formData.additionalRequirements}
                      onChange={handleChange}
                      placeholder="Any additional information that might help with the analysis"
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload relevant files such as sample images, previous test results, or specifications
                    </p>

                    <div className="flex items-center space-x-2">
                      <Input id="file-upload" type="file" className="hidden" multiple onChange={handleFileChange} />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("file-upload")?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Files
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        {formData.attachments.length > 0
                          ? `${formData.attachments.length} file(s) attached`
                          : "No files attached"}
                      </p>
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                        {formData.attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center space-x-2">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="text-red-500 h-8 w-8 p-0"
                            >
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
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 flex justify-between">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              {currentStep < 6 ? (
                <Button
                  className="ml-auto bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  onClick={nextStep}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="ml-auto bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  onClick={handleReviewAndSubmit}
                >
                  Review and Submit
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            {/* Summary card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Request Title</p>
                    <p className="font-medium">{formData.requestTitle || "Not specified"}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{formData.priority}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IO Number</p>
                    <p className="font-medium">
                      {formData.useIONumber === "yes" ? formData.ioNumber || "Not selected" : "Not using IO Number"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Samples</p>
                    <p className="text-2xl font-bold">{formData.samples.length}</p>
                  </div>

                  {formData.selectedCapabilities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Selected Capabilities</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.selectedCapabilities.map((capId) => {
                          const cap = capabilities.find((c) => c.id === capId)
                          return cap ? (
                            <span key={capId} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {cap.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}

                  {formData.desiredCompletionDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Desired Completion</p>
                      <p className="font-medium">{formData.desiredCompletionDate}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">About ASR Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 text-sm mb-4">
                  Analysis Solution Requests (ASR) are designed for complex analytical problems that require expert
                  consultation and customized testing approaches.
                </p>
                <p className="text-blue-700 text-sm">
                  Your request will be reviewed by capability experts who will work with you to develop the best
                  analytical approach for your needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={sampleDialogOpen} onOpenChange={setSampleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Sample" : "Add New Sample"}</DialogTitle>
            <DialogDescription>
              {editMode
                ? "Modify the sample details below"
                : "Fill out the sample details to add a new sample to your request"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="sample-category">Sample Category</Label>
              <Select
                value={sampleCategory}
                onValueChange={(value) => {
                  setSampleCategory(value)
                  setCurrentSample((prev) => ({
                    ...prev,
                    category: value,
                  }))
                }}
              >
                <SelectTrigger id="sample-category" className={highlightedField === "sample-category" ? "ring-2 ring-blue-500 border-blue-500" : ""}>
                  <SelectValue placeholder="Select category" />
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
            </div>

            {sampleCategory && (
              <div className="space-y-6">
                {renderSampleFields()}
                <div className="space-y-2">
                  <Label htmlFor="generated-name">Generated Sample Name</Label>
                  <Input id="generated-name" value={currentSample.generatedName || ""} disabled className="bg-gray-100 font-medium" autoComplete="off" />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSampleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSample} disabled={!currentSample.generatedName} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
              {editMode ? "Update Sample" : "Add Sample"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

