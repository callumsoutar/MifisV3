import { format } from "date-fns";
import { Receipt, CreditCard, Banknote, Wallet, ReceiptText, DollarSign, Landmark, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type PaymentMethod = "cash" | "credit_card" | "bank_transfer" | "direct_debit" | "cheque" | "other" | "account_credit";

interface Payment {
  id: string;
  amount: number;
  created_at: string;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  transaction: {
    user: {
      first_name: string | null;
      last_name: string | null;
    };
  };
}

interface PaymentHistoryCardProps {
  payments: Payment[];
  balance: number;
  onRecordPayment?: () => void;
  className?: string;
  availableCredit?: number;
  onSubmitPayment?: (data: any) => Promise<void>;
}

const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  payment_method: z.string(),
  payment_reference: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
});

export function PaymentHistoryCard({ 
  payments, 
  balance, 
  onRecordPayment,
  className,
  availableCredit = 0,
  onSubmitPayment,
}: PaymentHistoryCardProps) {
  const formatPaymentMethod = (method: PaymentMethod) => {
    return method.replace(/_/g, ' ').toUpperCase();
  };

  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balance,
      payment_method: "cash",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const paymentMethod = watch("payment_method");
  const amount = watch("amount");

  // Always update the amount field to the latest balance when modal opens or balance changes
  useEffect(() => {
    if (open) {
      form.reset({
        amount: balance,
        payment_method: "cash",
        date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
  }, [open, balance]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleFormSubmit = async (data: any) => {
    if (onSubmitPayment) {
      await onSubmitPayment(data);
      handleClose();
    }
  };

  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      setFormError(null);
      const res = await fetch(`/api/invoices/${data.invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      handleClose();
      form.reset();
    },
    onError: (err: any) => {
      setFormError(err?.error || "Failed to record payment");
    },
  });

  const paymentOptions = [
    { value: "cash", label: "Cash", icon: <DollarSign className="h-5 w-5" />, description: "Pay with cash" },
    { value: "credit_card", label: "Credit Card", icon: <CreditCard className="h-5 w-5" />, description: "Pay by credit card" },
    { value: "bank_transfer", label: "Bank Transfer", icon: <Landmark className="h-5 w-5" />, description: "Direct bank transfer" },
    { value: "direct_debit", label: "Direct Debit", icon: <Banknote className="h-5 w-5" />, description: "Automatic direct debit" },
    { value: "cheque", label: "Cheque", icon: <ReceiptText className="h-5 w-5" />, description: "Pay by cheque" },
    { value: "account_credit", label: "Account Credit", icon: <Wallet className="h-5 w-5" />, description: "Use available credit" },
    { value: "other", label: "Other", icon: <Gift className="h-5 w-5" />, description: "Other payment method" },
  ];

  return (
    <Card className={`p-4 bg-white border border-slate-100 shadow-none ${className}`}>
      <h3 className="text-lg font-medium mb-4">Payment History</h3>
      {payments.length > 0 ? (
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-row items-center justify-between bg-slate-50 rounded-lg shadow-sm px-4 py-3"
            >
              {/* Left: Amount, Method, Date */}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">${payment.amount.toFixed(2)}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    <CreditCard className="h-3 w-3 mr-1 text-blue-400" />
                    {formatPaymentMethod(payment.payment_method)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 mt-0.5">{format(new Date(payment.created_at), 'PP')}</span>
              </div>
              {/* Right: Processor */}
              <div className="flex flex-col items-end min-w-[120px]">
                <span className="text-[11px] text-gray-400">Processed by</span>
                <span className="text-xs font-medium text-gray-700 truncate">{payment.transaction.user.first_name} {payment.transaction.user.last_name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Receipt className="h-10 w-10 mb-2" />
          <p className="text-sm">No payments recorded yet</p>
        </div>
      )}

      {balance > 0 && (
        <>
          <Separator className="my-4" />
          <Button onClick={handleOpen} className="w-full gap-2">
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg w-full p-0 overflow-hidden">
              <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold mb-1">Add Payment</DialogTitle>
                  <p className="text-gray-500 text-xs mb-2">Select a payment method to continue</p>
                </DialogHeader>
                {paymentMethod === "account_credit" && (
                  <div className="mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-500">Available Credit</div>
                      <div className="text-blue-700 font-semibold text-lg">${availableCredit.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Amount Due</div>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={paymentMethod === 'account_credit' ? Math.min(balance, availableCredit) : balance}
                    {...register("amount", { valueAsNumber: true })}
                    className="text-xl font-bold px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    disabled={mutation.isLoading}
                  />
                  {errors.amount && <div className="text-xs text-red-500 mt-1">{errors.amount.message as string}</div>}
                </div>
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Payment Method</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {paymentOptions.map(opt => (
                      <button
                        type="button"
                        key={opt.value}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${paymentMethod === opt.value ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                        onClick={() => setValue("payment_method", opt.value)}
                        disabled={mutation.isLoading}
                        tabIndex={0}
                        aria-pressed={paymentMethod === opt.value}
                      >
                        <span className={`shrink-0 ${paymentMethod === opt.value ? 'text-blue-600' : 'text-gray-400'}`}>{opt.icon}</span>
                        <span>
                          <span className="block font-medium">{opt.label}</span>
                          <span className="block text-xs text-gray-500">{opt.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Reference (Optional)</label>
                    <Input type="text" {...register("payment_reference")} disabled={mutation.isLoading} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <Input type="date" {...register("date")} disabled={mutation.isLoading} />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-500 mb-1">Notes (Optional)</label>
                  <Textarea {...register("notes")} rows={2} disabled={mutation.isLoading} />
                </div>
                {(formError || mutation.error) && (
                  <div className="text-sm text-red-500 mb-2">{formError || (mutation.error as any)?.error}</div>
                )}
              </div>
              <DialogFooter className="flex flex-row gap-2 justify-end sticky bottom-0 bg-white p-3 border-t z-10">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={mutation.isLoading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" form="payment-form" disabled={mutation.isLoading}>
                  {mutation.isLoading ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
              <form
                id="payment-form"
                onSubmit={form.handleSubmit((data) => {
                  mutation.mutate({ ...data, invoiceId: balance > 0 ? (onSubmitPayment ? undefined : (typeof window !== 'undefined' && window.location.pathname.split('/').pop())) : undefined });
                })}
                className="hidden"
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </Card>
  );
} 