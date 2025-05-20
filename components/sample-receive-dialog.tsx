"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SampleStatusBadge } from "./sample-status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Beaker, CheckCircle2, PackageOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Sample {
  id: string
  sampleId: string
  name: string
  status: string
  description: string
}

interface SampleReceiveDialogProps {
  requestId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSamplesReceived?: (requestId: string, newStatus: string) => void
}

export function SampleReceiveDialog({
  requestId,
  open,
  onOpenChange,
  onSamplesReceived,
}: SampleReceiveDialogProps) {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSamples, setSelectedSamples] = useState<string[]>([])
  const [receiveLoading, setReceiveLoading] = useState(false)
  const [receivedCount, setReceivedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Load samples when dialog opens
  const loadSamples = async () => {
    if (!requestId || !open) return

    setLoading(true)
    try {
      console.log(`Loading samples for request ${requestId}`);
      const response = await fetch(`/api/requests/samples?requestId=${requestId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`Loaded ${data.data ? data.data.length : 0} samples`);
        const samplesData = data.data || [];
        setSamples(samplesData);
        
        // Count samples that are already received
        const received = samplesData.filter(
          (sample: Sample) => sample.status !== "Pending Receive" && sample.status !== "draft" && sample.status !== "submitted"
        ).length;
        
        setReceivedCount(received);
        setTotalCount(samplesData.length);
        
        // Pre-select samples that are pending receive
        setSelectedSamples(
          samplesData
            .filter((sample: Sample) => sample.status === "Pending Receive" || sample.status === "draft" || sample.status === "submitted")
            .map((sample: Sample) => sample.id)
        );
      } else {
        console.error("Failed to load samples:", data.error);
      }
    } catch (error) {
      console.error("Error loading samples:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle receiving selected samples
  const handleReceiveSelected = async () => {
    if (selectedSamples.length === 0) {
      toast.error("Please select at least one sample to receive")
      return
    }

    setReceiveLoading(true)
    try {
      const response = await fetch("/api/requests/samples/receive", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          samples: selectedSamples,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update the sample statuses locally
        setSamples(samples.map(sample => 
          selectedSamples.includes(sample.id) 
            ? { ...sample, status: "Received" } 
            : sample
        ))
        
        // Update counts
        setReceivedCount(data.data.receivedSamplesCount)
        setTotalCount(data.data.totalSamplesCount)
        
        // Clear selection
        setSelectedSamples([])
        
        // Notify parent component about status change if all samples received
        if (onSamplesReceived && data.data.allSamplesReceived) {
          onSamplesReceived(requestId, "in-progress")
        }
        
        toast.success(`Successfully received ${selectedSamples.length} sample(s)`)
        
        // If all samples have been received, close the dialog
        if (data.data.allSamplesReceived) {
          setTimeout(() => {
            onOpenChange(false)
          }, 1500)
        }
      } else {
        toast.error(data.error || "Failed to receive samples")
      }
    } catch (error) {
      console.error("Error receiving samples:", error)
      toast.error("An error occurred while receiving samples")
    } finally {
      setReceiveLoading(false)
    }
  }

  // Handle receiving all samples
  const handleReceiveAll = async () => {
    setReceiveLoading(true)
    try {
      const response = await fetch("/api/requests/samples/receive", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          receiveAll: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update all sample statuses locally
        setSamples(samples.map(sample => 
          sample.status === "Pending Receive" || sample.status === "draft" || sample.status === "submitted"
            ? { ...sample, status: "Received" } 
            : sample
        ))
        
        // Update counts
        setReceivedCount(data.data.receivedSamplesCount)
        setTotalCount(data.data.totalSamplesCount)
        
        // Clear selection
        setSelectedSamples([])
        
        // Notify parent component
        if (onSamplesReceived) {
          onSamplesReceived(requestId, "in-progress")
        }
        
        toast.success("Successfully received all samples")
        
        // Close the dialog
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else {
        toast.error(data.error || "Failed to receive samples")
      }
    } catch (error) {
      console.error("Error receiving samples:", error)
      toast.error("An error occurred while receiving samples")
    } finally {
      setReceiveLoading(false)
    }
  }

  // Toggle sample selection
  const toggleSampleSelection = (sampleId: string) => {
    setSelectedSamples(prev => 
      prev.includes(sampleId)
        ? prev.filter(id => id !== sampleId)
        : [...prev, sampleId]
    )
  }

  // Load samples when dialog opens
  useEffect(() => {
    if (open) {
      loadSamples()
    }
  }, [open, requestId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Samples for {requestId}</DialogTitle>
          <DialogDescription>
            Select samples to receive for this request ({receivedCount} of {totalCount} received)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : samples.length === 0 ? (
            <div className="text-center p-8">
              <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Samples Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                There are no samples associated with this request or they haven't been added to the system yet.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-muted/20 p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Sample Status:</span>
                  <span className="font-medium">{receivedCount} of {totalCount} received</span>
                </div>
                {receivedCount < totalCount && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleReceiveAll}
                    disabled={receiveLoading}
                  >
                    {receiveLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Receive All
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {samples.map((sample) => (
                  <Card key={sample.id} className={`overflow-hidden ${sample.status !== "Pending Receive" && sample.status !== "draft" && sample.status !== "submitted" ? "opacity-70" : ""}`}>
                    <CardContent className="p-0">
                      <div className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-3">
                          {(sample.status === "Pending Receive" || sample.status === "draft" || sample.status === "submitted") && (
                            <Checkbox
                              checked={selectedSamples.includes(sample.id)}
                              onCheckedChange={() => toggleSampleSelection(sample.id)}
                              disabled={sample.status !== "Pending Receive" && sample.status !== "draft" && sample.status !== "submitted" || receiveLoading}
                              id={`sample-${sample.id}`}
                            />
                          )}
                          {sample.status !== "Pending Receive" && sample.status !== "draft" && sample.status !== "submitted" && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <label
                              htmlFor={`sample-${sample.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {sample.name}
                            </label>
                            <p className="text-xs text-muted-foreground">ID: {sample.sampleId}</p>
                          </div>
                        </div>
                        <SampleStatusBadge status={sample.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center pt-2">
          <div>
            <span className="text-sm text-muted-foreground">
              {selectedSamples.length} samples selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReceiveSelected}
              disabled={selectedSamples.length === 0 || receiveLoading}
            >
              {receiveLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PackageOpen className="h-4 w-4 mr-2" />
              )}
              Receive Selected
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
