<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 28px 32px; }
        * { margin: 0; padding: 0; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.45;
        }
        .brand-bar {
            background-color: #0f766e;
            color: #ffffff;
            padding: 16px 18px;
        }
        .brand-table { width: 100%; border-collapse: collapse; }
        .brand-table td { vertical-align: middle; color: #ffffff; }
        .school-name {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 0.3px;
        }
        .school-meta {
            font-size: 9px;
            color: #ccfbf1;
            margin-top: 4px;
        }
        .doc-label {
            text-align: right;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #99f6e4;
        }
        .doc-number {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            color: #ffffff;
            margin-top: 2px;
        }
        .accent-line {
            height: 4px;
            background-color: #14b8a6;
        }
        .section {
            margin-top: 18px;
        }
        .section-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #0f766e;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid #99f6e4;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            vertical-align: top;
            width: 50%;
            padding: 0;
        }
        .info-box {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 10px 12px;
            min-height: 90px;
        }
        .info-box-right {
            margin-left: 8px;
        }
        .info-box-left {
            margin-right: 8px;
        }
        .info-box .box-heading {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #64748b;
            margin-bottom: 6px;
        }
        .kv { width: 100%; border-collapse: collapse; }
        .kv td {
            padding: 2px 0;
            font-size: 10.5px;
            vertical-align: top;
        }
        .kv .label {
            width: 34%;
            color: #64748b;
        }
        .kv .value {
            width: 66%;
            color: #0f172a;
            font-weight: bold;
        }
        .items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .items th {
            background-color: #0f766e;
            color: #ffffff;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            text-align: left;
            border: 1px solid #0f766e;
        }
        .items th.num,
        .items td.num {
            text-align: right;
        }
        .items td {
            padding: 9px 10px;
            border: 1px solid #e2e8f0;
            font-size: 10.5px;
            vertical-align: middle;
        }
        .items tr.alt td {
            background-color: #f8fafc;
        }
        .bottom-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
        }
        .bottom-table td {
            vertical-align: top;
        }
        .notes {
            width: 52%;
            padding-right: 14px;
        }
        .notes-box {
            border: 1px dashed #cbd5e1;
            background: #f8fafc;
            padding: 10px 12px;
            font-size: 9.5px;
            color: #475569;
        }
        .notes-box strong {
            display: block;
            color: #0f766e;
            margin-bottom: 4px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .totals-wrap {
            width: 48%;
        }
        .totals {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e2e8f0;
        }
        .totals td {
            padding: 7px 10px;
            font-size: 10.5px;
            border-bottom: 1px solid #e2e8f0;
        }
        .totals td.lbl { color: #64748b; width: 55%; }
        .totals td.val { text-align: right; font-weight: bold; color: #0f172a; }
        .totals tr.grand td {
            background-color: #0f766e;
            color: #ffffff;
            font-size: 12px;
            border-bottom: none;
            padding: 10px;
        }
        .totals tr.grand td.lbl { color: #ccfbf1; }
        .totals tr.grand td.val { color: #ffffff; }
        .status-row td {
            background-color: #fff7ed;
        }
        .status-unpaid { color: #c2410c; font-weight: bold; }
        .status-paid { color: #047857; font-weight: bold; }
        .status-partially_paid { color: #b45309; font-weight: bold; }
        .status-default { color: #334155; font-weight: bold; }
        .footer {
            margin-top: 28px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
        }
        .footer .thanks {
            color: #0f766e;
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 3px;
        }
    </style>
</head>
<body>
@php
    $student = $invoice->studentEnrollment?->student;
    $studentName = trim(($student->first_name ?? '').' '.($student->last_name ?? ''));
    $currency = $school?->currency ?? 'USD';
    $status = (string) ($invoice->status ?? 'unpaid');
    $statusClass = match ($status) {
        'paid' => 'status-paid',
        'unpaid' => 'status-unpaid',
        'partially_paid' => 'status-partially_paid',
        default => 'status-default',
    };
    $statusLabel = str_replace('_', ' ', ucfirst($status));
    $contactBits = array_filter([
        $school?->address,
        $school?->city,
        $school?->phone ? 'Tel: '.$school->phone : null,
        $school?->email,
    ]);
@endphp

<div class="brand-bar">
    <table class="brand-table">
        <tr>
            <td width="62%">
                <div class="school-name">{{ $school?->school_name ?? config('app.name') }}</div>
                @if(count($contactBits))
                    <div class="school-meta">{{ implode(' · ', $contactBits) }}</div>
                @endif
            </td>
            <td width="38%">
                <div class="doc-label">Fee Invoice</div>
                <div class="doc-number">{{ $invoice->invoice_number }}</div>
            </td>
        </tr>
    </table>
</div>
<div class="accent-line"></div>

<div class="section">
    <table class="info-table">
        <tr>
            <td>
                <div class="info-box info-box-left">
                    <div class="box-heading">Invoice details</div>
                    <table class="kv">
                        <tr>
                            <td class="label">Invoice #</td>
                            <td class="value">{{ $invoice->invoice_number }}</td>
                        </tr>
                        <tr>
                            <td class="label">Invoice date</td>
                            <td class="value">{{ $invoice->invoice_date?->format('d M Y') ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Due date</td>
                            <td class="value">{{ $invoice->due_date?->format('d M Y') ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Billing period</td>
                            <td class="value">{{ $invoice->billing_period ?: '—' }}</td>
                        </tr>
                    </table>
                </div>
            </td>
            <td>
                <div class="info-box info-box-right">
                    <div class="box-heading">Bill to</div>
                    <table class="kv">
                        <tr>
                            <td class="label">Student</td>
                            <td class="value">{{ $studentName !== '' ? $studentName : '—' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Admission #</td>
                            <td class="value">{{ $student?->admission_number ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Class</td>
                            <td class="value">{{ $invoice->studentEnrollment?->section?->schoolClass?->name ?? '—' }}</td>
                        </tr>
                        <tr>
                            <td class="label">Session</td>
                            <td class="value">{{ $invoice->studentEnrollment?->academicSession?->name ?? '—' }}</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">Fee breakdown</div>
    <table class="items">
        <thead>
            <tr>
                <th width="46%">Description</th>
                <th class="num" width="18%">Amount</th>
                <th class="num" width="18%">Discount</th>
                <th class="num" width="18%">Net</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoice->items as $index => $item)
                <tr class="{{ $index % 2 === 1 ? 'alt' : '' }}">
                    <td>{{ $item->description }}</td>
                    <td class="num">{{ number_format((float) $item->amount, 2) }}</td>
                    <td class="num">{{ number_format((float) $item->discount_amount, 2) }}</td>
                    <td class="num">{{ number_format((float) $item->net_amount, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align:center;color:#64748b;">No line items</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>

<table class="bottom-table">
    <tr>
        <td class="notes">
            <div class="notes-box">
                <strong>Payment note</strong>
                Please pay the outstanding amount before the due date.
                Keep this invoice for your records. For queries, contact the school accounts office.
            </div>
        </td>
        <td class="totals-wrap">
            <table class="totals">
                <tr>
                    <td class="lbl">Subtotal</td>
                    <td class="val">{{ $currency }} {{ number_format((float) $invoice->subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td class="lbl">Discount</td>
                    <td class="val">{{ $currency }} {{ number_format((float) $invoice->discount_total, 2) }}</td>
                </tr>
                <tr class="grand">
                    <td class="lbl">Total due</td>
                    <td class="val">{{ $currency }} {{ number_format((float) $invoice->total_amount, 2) }}</td>
                </tr>
                <tr class="status-row">
                    <td class="lbl">Status</td>
                    <td class="val {{ $statusClass }}">{{ $statusLabel }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<div class="footer">
    <div class="thanks">Thank you for your payment cooperation</div>
    Generated on {{ now()->format('d M Y H:i') }}
    @if($school?->school_code)
        · School code {{ $school->school_code }}
    @endif
</div>
</body>
</html>
