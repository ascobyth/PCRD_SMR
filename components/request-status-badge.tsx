import { Badge } from "@/components/ui/badge"

interface RequestStatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "in-progress" | "completed"
}

export default function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          variant: "outline" as const,
          className: "border-yellow-500 text-yellow-700 bg-yellow-50",
        }
      case "approved":
        return {
          label: "Approved",
          variant: "outline" as const,
          className: "border-green-500 text-green-700 bg-green-50",
        }
      case "rejected":
        return { label: "Rejected", variant: "outline" as const, className: "border-red-500 text-red-700 bg-red-50" }
      case "in-progress":
        return {
          label: "In Progress",
          variant: "outline" as const,
          className: "border-blue-500 text-blue-700 bg-blue-50",
        }
      case "completed":
        return {
          label: "Completed",
          variant: "outline" as const,
          className: "border-purple-500 text-purple-700 bg-purple-50",
        }
      default:
        return { label: "Unknown", variant: "outline" as const, className: "" }
    }
  }

  const { label, variant, className } = getStatusConfig()

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

