<?php

namespace App\Support;

use App\Models\FeeInvoice;
use App\Models\FeePayment;

class FeeNumberGenerator
{
    public static function nextInvoiceNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "INV-{$year}-";

        $last = FeeInvoice::query()
            ->where('invoice_number', 'like', "{$prefix}%")
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        return $prefix.self::nextSequence($last);
    }

    public static function nextPaymentNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "PAY-{$year}-";

        $last = FeePayment::query()
            ->where('payment_number', 'like', "{$prefix}%")
            ->orderByDesc('payment_number')
            ->value('payment_number');

        return $prefix.self::nextSequence($last);
    }

    protected static function nextSequence(?string $last): string
    {
        $sequence = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $sequence = (int) $matches[1] + 1;
        }

        return str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }
}
