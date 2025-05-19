"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CheckCircle, Printer, Calendar, FileText, AlertTriangle } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function EquipmentReservationConfirmationPage() {
  const router = useRouter()

  // Mock data - in a real application, this would come from the form submission
  const [reservation, setReservation] = useState({
    id: "RE-ER-0323-00123",
    projectName: "Polymer Crystallization Study",
    capability: "Mesostructure & Imaging",
    equipment: "SAXS (Small-Angle X-ray Scattering)",
    date: "2023-03-25",
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

