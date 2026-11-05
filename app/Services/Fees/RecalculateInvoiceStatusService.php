<?php

namespace App\Services\Fees;

use App\Models\FeeInvoice;

class RecalculateInvoiceStatusService
{
    public function recalculate(FeeInvoice $invoice): void
    {
        $invoice->loadSum('paymentAllocations as paid_total', 'allocated_amount');

        $paid = round((float) ($invoice->paid_total ?? 0), 2);
        $total = round((float) $invoice->total_amount, 2);

        if ($paid <= 0) {
            $status = 'unpaid';
        } elseif ($paid >= $total) {
            $status = 'paid';
        } else {
            $status = 'partially_paid';
        }

        if ($invoice->status !== $status) {
            $invoice->update(['status' => $status]);
        }
    }
}
