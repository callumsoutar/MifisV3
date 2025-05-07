import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/types/invoicing";
import clsx from "clsx";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const isPaid = status === 'paid';
  return (
    <span
      className={clsx(
        'inline-flex items-center px-4 py-1 rounded-full font-semibold text-sm transition-colors',
        isPaid
          ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm'
          : status === 'overdue'
          ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm'
          : status === 'pending'
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm'
          : status === 'draft'
          ? 'bg-gray-100 text-gray-700 border border-gray-200'
          : 'bg-slate-100 text-slate-700 border border-slate-200'
      )}
      style={{ fontSize: '1rem', minWidth: '90px', justifyContent: 'center' }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
} 