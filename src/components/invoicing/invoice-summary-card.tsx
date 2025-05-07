import { format } from "date-fns";
import { FileText, CalendarDays, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InvoiceSummaryCardProps {
  invoiceNumber: string;
  createdAt: string;
  dueDate: string;
  className?: string;
}

export function InvoiceSummaryCard({
  invoiceNumber,
  createdAt,
  dueDate,
  className,
}: InvoiceSummaryCardProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Invoice Summary</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <FileText className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-gray-500">Invoice Number</p>
            <p className="font-medium">{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-gray-500">Issue Date</p>
            <p className="font-medium">
              {format(new Date(createdAt), 'PP')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-gray-500">Due Date</p>
            <p className="font-medium">
              {format(new Date(dueDate), 'PP')}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
} 