import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InvoiceItem {
  id: string;
  quantity: number;
  rate: number;
  description: string;
  chargeable: {
    name: string;
    description: string | null;
  };
}

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  className?: string;
}

export function InvoiceItemsTable({ items, className }: InvoiceItemsTableProps) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50%]">Item</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div>
                {item.chargeable.name}
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>${item.rate.toFixed(2)}</TableCell>
            <TableCell className="text-right">
              ${(item.quantity * item.rate).toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 