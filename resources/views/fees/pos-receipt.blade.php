<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt {{ $payment->payment_number }}</title>
    <style>
        :root {
            --slip: 80mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background: #e8eef3;
            color: #111;
            font-family: "Courier New", Courier, monospace;
            font-size: 13px;
            line-height: 1.35;
            min-height: 100vh;
            padding: 24px 12px 40px;
        }

        .toolbar {
            display: flex;
            gap: 8px;
            justify-content: center;
            margin: 0 auto 16px;
            max-width: var(--slip);
            width: 100%;
        }

        .toolbar button {
            background: #0f766e;
            border: 0;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            font-weight: 600;
            padding: 10px 16px;
        }

        .toolbar button.secondary {
            background: #334155;
        }

        .slip {
            background: #fff;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
            margin: 0 auto;
            max-width: var(--slip);
            padding: 14px 12px 18px;
            width: 100%;
        }

        .center { text-align: center; }
        .muted { color: #444; font-size: 11px; }
        .strong { font-weight: 700; }
        .big { font-size: 16px; font-weight: 700; letter-spacing: 0.02em; }

        .rule {
            border-top: 1px dashed #111;
            margin: 10px 0;
        }

        .rule-double {
            border-top: 3px double #111;
            margin: 10px 0;
        }

        .row {
            display: flex;
            gap: 8px;
            justify-content: space-between;
            margin: 3px 0;
        }

        .row span:last-child {
            text-align: right;
            word-break: break-word;
        }

        .items {
            margin: 6px 0;
        }

        .items .row {
            font-size: 12px;
        }

        .total-row {
            font-size: 15px;
            font-weight: 700;
            margin-top: 4px;
        }

        .footer-note {
            font-size: 11px;
            margin-top: 12px;
            text-align: center;
        }

        @media print {
            @page {
                margin: 4mm;
                size: 80mm auto;
            }

            body {
                background: #fff;
                padding: 0;
            }

            .toolbar {
                display: none !important;
            }

            .slip {
                box-shadow: none;
                max-width: none;
                padding: 0;
                width: 72mm;
            }
        }
    </style>
</head>
<body>
    @php
        $schoolName = $school?->school_name ?? config('app.name');
        $currency = $school->currency ?? '';
        $studentName = trim(($payment->student->first_name ?? '').' '.($payment->student->last_name ?? ''));
        $method = ucfirst(str_replace('_', ' ', (string) $payment->payment_method));
        $amount = number_format((float) $payment->amount, 2);
    @endphp

    <div class="toolbar">
        <button type="button" onclick="window.print()">Print receipt</button>
        <button type="button" class="secondary" onclick="closeReceipt()">Close</button>
    </div>

    <div class="slip">
        <div class="center">
            <div class="big">{{ $schoolName }}</div>
            @if(! empty($school?->address))
                <div class="muted">{{ $school->address }}</div>
            @endif
            @if(! empty($school?->phone))
                <div class="muted">Tel: {{ $school->phone }}</div>
            @endif
            <div class="strong" style="margin-top:8px;">FEE RECEIPT</div>
        </div>

        <div class="rule"></div>

        <div class="row"><span>Receipt</span><span class="strong">{{ $payment->payment_number }}</span></div>
        <div class="row"><span>Date</span><span>{{ $payment->payment_date?->format('d M Y') }}</span></div>
        <div class="row"><span>Time</span><span>{{ $payment->created_at?->format('h:i A') ?? now()->format('h:i A') }}</span></div>

        <div class="rule"></div>

        <div class="row"><span>Student</span><span class="strong">{{ $studentName !== '' ? $studentName : '—' }}</span></div>
        <div class="row"><span>Adm #</span><span>{{ $payment->student->admission_number ?? '—' }}</span></div>
        @if(! empty($className))
            <div class="row"><span>Class</span><span>{{ $className }}</span></div>
        @endif

        <div class="rule"></div>

        <div class="items">
            @forelse($payment->allocations as $allocation)
                @php
                    $invoice = $allocation->feeInvoice;
                    $label = $invoice?->invoice_number ?? 'Fee';
                    $itemDesc = $invoice?->items?->pluck('description')->filter()->unique()->implode(', ');
                    if ($itemDesc) {
                        $label = $itemDesc;
                    }
                @endphp
                <div class="row">
                    <span>{{ $label }}</span>
                    <span>{{ number_format((float) $allocation->allocated_amount, 2) }}</span>
                </div>
            @empty
                <div class="row">
                    <span>Fee payment</span>
                    <span>{{ $amount }}</span>
                </div>
            @endforelse
        </div>

        <div class="rule-double"></div>

        <div class="row total-row">
            <span>TOTAL</span>
            <span>{{ trim($currency.' '.$amount) }}</span>
        </div>

        <div class="row"><span>Paid by</span><span>{{ $method }}</span></div>
        @if($payment->transaction_reference)
            <div class="row"><span>Ref</span><span>{{ $payment->transaction_reference }}</span></div>
        @endif
        <div class="row"><span>Cashier</span><span>{{ $payment->receivedByUser?->name ?? '—' }}</span></div>

        <div class="rule"></div>

        <div class="footer-note">
            Thank you<br>
            Please keep this receipt
        </div>
    </div>

    <script>
        function closeReceipt() {
            window.close();

            // Fallback if the browser blocked window.close().
            setTimeout(function () {
                if (!window.closed) {
                    window.location.href = @json(route('admin.fees.collect'));
                }
            }, 150);
        }

        window.addEventListener('load', function () {
            setTimeout(function () {
                window.print();
            }, 250);
        });
    </script>
</body>
</html>
