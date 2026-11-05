@extends('pdf.layout')

@section('title', 'Receipt '.$payment->payment_number)

@section('content')
    @php
        $currency = $school->currency ?? 'USD';
    @endphp
    <h2 style="margin-top:0;">Payment Receipt</h2>
    <div class="meta">
        <table>
            <tr>
                <td width="50%">
                    <strong>Receipt #:</strong> {{ $payment->payment_number }}<br>
                    <strong>Date:</strong> {{ $payment->payment_date?->format('d M Y') }}<br>
                    <strong>Method:</strong> {{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}<br>
                    @if($payment->transaction_reference)
                        <strong>Reference:</strong> {{ $payment->transaction_reference }}<br>
                    @endif
                </td>
                <td width="50%">
                    <strong>Student:</strong> {{ trim(($payment->student->first_name ?? '').' '.($payment->student->last_name ?? '')) }}<br>
                    <strong>Admission #:</strong> {{ $payment->student->admission_number ?? '—' }}<br>
                    <strong>Received by:</strong> {{ $payment->receivedByUser?->name ?? '—' }}
                </td>
            </tr>
        </table>
    </div>

    <p><strong>Amount received:</strong> {{ $currency }} {{ number_format((float) $payment->amount, 2) }}</p>

    <table class="items">
        <thead>
            <tr>
                <th>Invoice</th>
                <th class="text-right">Allocated</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payment->allocations as $allocation)
                <tr>
                    <td>{{ $allocation->feeInvoice?->invoice_number }}</td>
                    <td class="text-right">{{ number_format((float) $allocation->allocated_amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
