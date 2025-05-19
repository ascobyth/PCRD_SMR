"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, Printer, Home, Phone, Mail, ArrowRight, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock data for the confirmation page
const mockRequestData = {
  requestTitle: "HDPE Film Tensile Strength Analysis",
  submissionDate: "2023-10-16",
  requester: {
    name: "John Doe",
    department: "R&D",
    email: "john.doe@example.com",
    phone: "123-456-7890",
  },
  // Requests split by capability
  splitRequests: [
    {
      requestId: "NTR-MICRO-0124",
      capability: "Microstructure",
      methods: [
        {
          id: "TM-MICRO-001",
          name: "Tensile Strength (ASTM D638)",
          samples: ["HD5000S_L2023001_A1", "HD5300B_L2023002_B1"],
        },
        {
          id: "TM-MICRO-002",
          name: "Flexural Properties (ASTM D790)",
          samples: ["HD5000S_L2023001_A1"],
        },
      ],
      estimatedCompletion: "2023-10-23",
      capabilityInfo: {
        address: "Building 3, Floor 2, Lab 205, Research Center, 123 Science Park",
        contactPerson: "Dr. Sarah Johnson",
        contactEmail: "sarah.johnson@example.com",
        contactPhone: "123-456-7891",
      },
    },
    {
      requestId: "NTR-RHEO-0125",
      capability: "Rheology",
      methods: [
        {
          id: "TM-RHEO-001",
          name: "Melt Flow Rate (ASTM D1238)",
          samples: ["HD5000S_L2023001_A1", "HD5300B_L2023002_B1"],
        },
      ],
      estimatedCompletion: "2023-10-21",
      capabilityInfo: {
        address: "Building 2, Floor 1, Lab 103, Research Center, 123 Science Park",
        contactPerson: "Dr. Michael Chen",
        contactEmail: "michael.chen@example.com",
        contactPhone: "123-456-7892",
      },
    },
    {
      requestId: "NTR-MESO-0126",
      capability: "Mesostructure & Imaging",
      methods: [
        {
          id: "TM-MESO-001",
          name: "SEM Analysis",
          samples: ["HD5300B_L2023002_B1"],
        },
      ],
      estimatedCompletion: "2023-10-26",
      capabilityInfo: {
        address: "Building 4, Floor 3, Lab 312, Research Center, 123 Science Park",
        contactPerson: "Dr. Lisa Wong",
        contactEmail: "lisa.wong@example.com",
        contactPhone: "123-456-7893",
      },
    },
  ],
}

export default function RequestConfirmationPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showRequestTagDialog, setShowRequestTagDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  // State for the real request data
  const [requestData, setRequestData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Function to fetch request data from the API for multiple request numbers
    const fetchRequestsData = async (requestNumbers: string[]) => {
      try {
        console.log('Fetching request data for:', requestNumbers);
        // Use the multi-details API endpoint that accepts an array of request numbers
        const response = await fetch(`/api/requests/multi-details?requestNumbers=${encodeURIComponent(JSON.stringify(requestNumbers))}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `API request failed with status ${response.status}: ${errorData.error || response.statusText}`
          );
        }

        const result = await response.json();

        if (result.success) {
          console.log('Request data fetched successfully:', result.data);
          setRequestData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch request data');
        }
      } catch (error) {
        console.error('Error fetching request data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');

        // Fallback to mock data in case of error
        setRequestData({
          ...mockRequestData,
          requestId: localStorage.getItem('submittedRequestId') || 'unknown',
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Try to get multiple request numbers from localStorage
    let requestNumbers: string[] = [];

    try {
      const submittedRequestNumbers = localStorage.getItem('submittedRequestNumbers');
      if (submittedRequestNumbers) {
        requestNumbers = JSON.parse(submittedRequestNumbers);
      }
    } catch (error) {
      console.error('Error parsing submittedRequestNumbers:', error);
    }

    // Fallback to single request number if multiple not found
    if (requestNumbers.length === 0) {
      const submittedRequestNumber = localStorage.getItem('submittedRequestNumber');
      if (submittedRequestNumber) {
        requestNumbers = [submittedRequestNumber];
      }
    }

    if (requestNumbers.length > 0) {
      // Fetch the actual data from the API using the request numbers
      fetchRequestsData(requestNumbers);
    } else {
      // If no request numbers are found, use the mock data
      setRequestData(mockRequestData);
      setIsLoading(false);
    }
  }, [])

  const handlePrintTags = (request: any) => {
    setSelectedRequest(request)
    setShowPrintDialog(true)
  }

  const handlePrintRequestTag = (request: any) => {
    setSelectedRequest(request)
    setShowRequestTagDialog(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium">Processing your request...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Error Loading Request</h1>
          <p className="text-lg text-gray-600 mb-4">{error}</p>
          <p className="text-md text-gray-500 mb-6">We're showing you mock data instead.</p>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success message */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Request Submitted Successfully!</h1>
            <p className="text-lg text-gray-600">Your test request has been received and is being processed.</p>
          </div>

          {/* Request information card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
              <CardDescription>
                Your request has been split into multiple request IDs based on the capabilities required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submission Date</p>
                  <p className="font-medium">{requestData?.submissionDate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Request Title</p>
                  <p className="font-medium">{requestData?.requestTitle}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-medium mb-4">Your Request IDs</h3>

              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Requests</TabsTrigger>
                  {requestData?.splitRequests.map((request) => (
                    <TabsTrigger key={request.requestId} value={request.requestId}>
                      {request.capability}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {requestData?.splitRequests.map((request) => (
                    <RequestCard
                      key={request.requestId}
                      request={request}
                      onPrintTags={() => handlePrintTags(request)}
                      onPrintRequestTag={() => handlePrintRequestTag(request)}
                    />
                  ))}
                </TabsContent>

                {requestData?.splitRequests.map((request) => (
                  <TabsContent key={request.requestId} value={request.requestId}>
                    <RequestCard
                      request={request}
                      onPrintTags={() => handlePrintTags(request)}
                      onPrintRequestTag={() => handlePrintRequestTag(request)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Please follow these guidelines to ensure your samples are processed correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Each capability has different sample submission requirements. Please check the details for each
                    request.
                  </AlertDescription>
                </Alert>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>1. Print Sample Tags</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Print the sample tags for each request by clicking the "Print Sample Tags" button on each
                        request card.
                      </p>
                      <p className="mb-2">
                        Attach the printed tags securely to each sample to ensure proper identification during testing.
                      </p>
                      <p>Each tag contains a unique barcode that links the sample to your request in our system.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>2. Submit Your Samples</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Send your samples to the appropriate laboratory address listed for each capability.
                      </p>
                      <p className="mb-2">
                        Different capabilities may have different laboratory locations, so please check each request
                        carefully.
                      </p>
                      <p>Ensure samples are properly packaged to prevent damage during transport.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>3. Track Your Request</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        You can track the status of your requests at any time by logging into your account and checking
                        the "My Requests" section.
                      </p>
                      <p>
                        You will receive email notifications when your results are ready or if additional information is
                        needed.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-between">
            <Link href="/dashboard">
              <Button variant="outline">Return to Dashboard</Button>
            </Link>
            <div className="flex space-x-3">
              <Link href="/requests">
                <Button variant="outline" className="gap-2">
                  View My Requests
                </Button>
              </Link>
              <Link href="/request/new">
                <Button
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  onClick={() => {
                    // Clear all request-related data from localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem("ntrFormData");
                      localStorage.removeItem("ntrFormData_persistent");
                      localStorage.removeItem("ntrSamples");
                      localStorage.removeItem("ntrTestMethods");
                      localStorage.removeItem("smartAssistantRecommendations");
                      console.log("Cleared all request data from localStorage");
                    }
                  }}
                >
                  Create Another Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Print Tags Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Sample Tags</DialogTitle>
            <DialogDescription>Print tags for all samples in this request.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4">
              <h3 className="font-medium mb-2">Request: {selectedRequest.requestId}</h3>
              <p className="text-sm text-muted-foreground mb-4">Capability: {selectedRequest.capability}</p>

              <div className="border rounded-md p-4 mb-4">
                <h4 className="font-medium mb-2">Samples to Tag:</h4>
                <ul className="space-y-2">
                  {Array.from(new Set(selectedRequest.methods.flatMap((method: any) => method.samples))).map(
                    (sample: any, index: number) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span>{sample}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-800 mb-2">Submission Information:</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-start">
                    <Home className="h-4 w-4 mr-2 mt-0.5" />
                    <span>{selectedRequest.capabilityInfo.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{selectedRequest.capabilityInfo.contactPhone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{selectedRequest.capabilityInfo.contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Cancel
            </Button>
            <Button className="gap-2">
              <Printer className="h-4 w-4" />
              Print Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Tag Dialog */}
      <Dialog open={showRequestTagDialog} onOpenChange={setShowRequestTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Request Tag</DialogTitle>
            <DialogDescription>A summary tag for this capability.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4 text-sm">
              <p className="font-medium mb-2">{selectedRequest.requestId}</p>
              <p className="text-muted-foreground mb-4">{selectedRequest.capability}</p>
              <p>QR code will be generated here.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestTagDialog(false)}>
              Close
            </Button>
            <Button className="gap-2">
              <Printer className="h-4 w-4" />
              Print Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Request Card Component
function RequestCard({
  request,
  onPrintTags,
  onPrintRequestTag,
}: {
  request: any
  onPrintTags: () => void
  onPrintRequestTag: () => void
}) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">{request.requestId}</h3>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">{request.capability}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Estimated completion: {request.estimatedCompletion}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={onPrintRequestTag}>
            <Printer className="h-4 w-4" />
            Print Request Tag
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={onPrintTags}>
            <Printer className="h-4 w-4" />
            Print Sample Tags
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Test Methods:</h4>
        <div className="space-y-2">
          {request.methods.map((method: any) => (
            <div key={method.id} className="border rounded-md p-3 bg-gray-50">
              <p className="font-medium">{method.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <p className="text-xs text-muted-foreground">Samples:</p>
                {method.samples.map((sample: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-gray-100">
                    {sample}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Submission Information:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Address:</p>
            <p className="text-sm">{request.capabilityInfo.address}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contact Person:</p>
            <p className="text-sm">{request.capabilityInfo.contactPerson}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {request.capabilityInfo.contactEmail} | {request.capabilityInfo.contactPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

