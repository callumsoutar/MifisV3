import { AccountSummaryCard } from "./account-summary-card";
import { InvoicesTable } from "./invoices-table";

interface MemberAccountTabProps {
  memberId: string;
}

export function MemberAccountTab({ memberId }: MemberAccountTabProps) {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 mt-6">
      <AccountSummaryCard memberId={memberId} />
      <InvoicesTable memberId={memberId} />
    </div>
  );
} 