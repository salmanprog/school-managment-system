<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>@yield('title', 'Document')</title>
    <style>
        * { margin: 0; padding: 0; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111111;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 18px;
            padding-bottom: 10px;
            border-bottom: 1px solid #cccccc;
        }
        .header h1 {
            margin: 0 0 4px 0;
            font-size: 18px;
        }
        .header .sub {
            font-size: 11px;
            color: #555555;
        }
        .meta {
            margin-bottom: 16px;
            width: 100%;
        }
        .meta td {
            vertical-align: top;
            padding: 2px 8px 2px 0;
            font-size: 12px;
        }
        h2 {
            margin: 0 0 12px 0;
            font-size: 15px;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        table.items th,
        table.items td {
            border: 1px solid #dddddd;
            padding: 6px 8px;
            text-align: left;
        }
        table.items th {
            background: #f3f4f6;
            font-size: 11px;
        }
        .text-right { text-align: right; }
        table.totals {
            width: 45%;
            margin-top: 14px;
            margin-left: 55%;
            border-collapse: collapse;
        }
        table.totals td {
            padding: 4px 0;
        }
        .footer {
            margin-top: 28px;
            padding-top: 8px;
            border-top: 1px solid #eeeeee;
            font-size: 10px;
            color: #666666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $school?->school_name ?? config('app.name') }}</h1>
        @if(! empty($school?->address))
            <div class="sub">{{ $school->address }}</div>
        @endif
    </div>
    @yield('content')
    <div class="footer">Generated on {{ now()->format('d M Y H:i') }}</div>
</body>
</html>
