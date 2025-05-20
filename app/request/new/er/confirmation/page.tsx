"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, CheckCircle, Printer, Calendar, FileText, AlertTriangle } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function EquipmentReservationConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestNumber = searchParams.get('requestNumber')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reservation, setReservation] = useState(null)

  useEffect(() => {
    // If no request number is provided, use mock data for development
    if (!requestNumber) {
      setReservation({
        id: "25-ER-2025-0001",
        projectName: "Polymer Crystallization Study",
        capability: "Mesostructure & Imaging",
        equipment: "SAXS (Small-Angle X-ray Scattering)",
        date: "2025-05-25",
        timeSlot: "10:00 - 12:00",
        samples: [
          { id: 1, name: "Sample A", description: "HDPE film, 2mm thickness" },
          { id: 2, name: "Sample B", description: "LDPE film, 1mm thickness" },
        ],
        testingMode: "Expert Operator",
        priority: "Normal",
        status: "Pending Confirmation",
        contactPerson: "Dr. Sarah Johnson",
        contactEmail: "sarah.johnson@pcrd.com",
        contactPhone: "+66 2 123 4567",
        labLocation: "Building 3, Room 405, PCRD Central Laboratory",
      })
      setLoading(false)
      return
    }

    // Fetch the request details from the API
    const fetchReservation = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/requests/details?requestNumber=${requestNumber}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch request details: ${response.statusText}`)
        }
        
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch request details')
        }
        
        // Transform API data to match the UI needs
        const requestData = data.data
        setReservation({
          id: requestData.requestNumber,
          projectName: requestData.requestTitle,
          capability: "Equipment Reservation",
          equipment: JSON.parse(requestData.jsonEquipmentList || '[]')
            .map(eq => eq.name)
            .join(', '),
          date: new Date(requestData.reservationStartDate).toLocaleDateString(),
          timeSlot: `${new Date(requestData.reservationStartDate).toLocaleTimeString()} - ${new Date(requestData.reservationEndDate).toLocaleTimeString()}`,
          priority: requestData.priority,
          status: requestData.requestStatus === 'submitted' ? 'Pending Confirmation' : requestData.requestStatus,
          contactPerson: "PCRD Lab Manager",
          contactEmail: "lab.manager@pcrd.com",
          contactPhone: "+66 2 123 4567",
          labLocation: "Building 3, Room 405, PCRD Central Laboratory",
        })
      } catch (error) {
        console.error('Error fetching reservation details:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReservation()
  }, [requestNumber])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Reservation Confirmation</h1>
            <p className="text-muted-foreground">Loading your equipment reservation details...</p>
          </div>
          
          <Card>
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <CardTitle>Loading Reservation Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Separator />
              <Skeleton className="h-60 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Reservation Confirmation</h1>
            <p className="text-muted-foreground">Error loading reservation details</p>
          </div>
          
          <Card>
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <CardTitle>Error Loading Reservation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertDescription>
                  {error}. Please try again or contact support.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button variant="default" onClick={() => router.push("/dashboard")}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Reservation Confirmation</h1>
          <p className="text-muted-foreground">Your equipment reservation has been submitted</p>
        </div>

        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle>Reservation Submitted Successfully</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Reservation ID</p>
                <h2 className="text-2xl font-bold">{reservation.id}</h2>
              </div>
              <Badge className="w-fit" variant={reservation.status === "Confirmed" ? "default" : "outline"}>
                {reservation.status}
              </Badge>
            </div>

            <Alert>
              <AlertDescription>
                <div className="flex items-start space-x-2">
                  <Calendar className="h-4 w-4 mt-0.5" />
                  <div>
                    <span className="font-medium">Reservation Date & Time:</span> {reservation.date},{" "}
                    {reservation.timeSlot}
                  </div>
                </div>
                <div className="flex items-start space-x-2 mt-2">
                  <FileText className="h-4 w-4 mt-0.5" />
                  <div>
                    <span className="font-medium">Equipment:</span> {reservation.equipment}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Important Information:</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Reservation Status</p>
                    <p className="text-sm text-muted-foreground">
                      Your reservation is currently pending confirmation by the lab manager. You will receive an email
                      notification once it is confirmed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Sample Preparation</p>
                    <p className="text-sm text-muted-foreground">
                      Please print and attach the sample tags to your samples. Ensure your samples are properly prepared
                      according to the equipment requirements.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 gap-1">
                      <Printer className="h-4 w-4" />
                      Print Sample Tags
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Lab Location</p>
                    <p className="text-sm text-muted-foreground">
                      Please deliver your samples to the following location at least 30 minutes before your scheduled
                      time:
                    </p>
                    <div className="mt-2 p-3 bg-muted/50 rounded-md">
                      <p className="font-medium">{reservation.labLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Contact Information</p>
                    <p className="text-sm text-muted-foreground">
                      If you have any questions or need to make changes to your reservation, please contact:
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Contact Person:</span> {reservation.contactPerson}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {reservation.contactEmail}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> {reservation.contactPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Cancellation Policy</p>
                <p className="text-sm">
                  Reservations must be cancelled at least 24 hours in advance to avoid charges. Late cancellations or
                  no-shows may result in full charges for the reserved time.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-1">
                <Printer className="h-4 w-4" />
                Print Confirmation
              </Button>
              <Button variant="default" className="gap-1">
                <FileText className="h-4 w-4" />
                View All Reservations
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
