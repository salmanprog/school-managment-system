@php
    $schoolName = $card['school_name'] ?? config('app.name', 'Campus School');
    $initial = mb_strtoupper(mb_substr($schoolName, 0, 1));
    $studentInitial = mb_strtoupper(mb_substr($card['student_name'] ?? '?', 0, 1));
    $subjectCount = max(1, count($card['subject_marks'] ?? []));
    $markRowPadding = $subjectCount <= 3 ? 14 : ($subjectCount <= 6 ? 10 : 7);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Grade Card — {{ $card['student_name'] ?? 'Student' }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 7mm;
        }
        * { margin: 0; padding: 0; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #0f172a;
            line-height: 1.35;
        }
        .sheet {
            position: relative;
            width: 100%;
            height: 273mm;
            border: 2px solid #0f172a;
            overflow: hidden;
        }
        .watermark {
            position: absolute;
            top: 105mm;
            left: 0;
            width: 100%;
            text-align: center;
            opacity: 0.12;
            z-index: 0;
        }
        .watermark img {
            width: 160px;
            height: 160px;
        }
        .watermark-fallback {
            width: 140px;
            height: 140px;
            line-height: 140px;
            margin: 0 auto;
            border: 4px solid #334155;
            border-radius: 70px;
            font-size: 48px;
            font-weight: bold;
            color: #334155;
        }
        .watermark-name {
            margin-top: 6px;
            font-size: 26px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #1e293b;
        }
        .content {
            position: relative;
            z-index: 1;
            padding-bottom: 58mm;
        }
        .footer {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2;
            border-top: 2px solid #0f172a;
            background: #ffffff;
        }
        .top-bar {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f172a;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .top-bar td { padding: 6px 9px; }
        .top-bar .right {
            text-align: right;
            border-left: 2px solid #0f172a;
            width: 50%;
        }
        .brand {
            border-bottom: 2px solid #0f172a;
            padding: 10px 12px;
            text-align: center;
        }
        .brand-table { width: 100%; border-collapse: collapse; }
        .brand-table td { vertical-align: middle; }
        .brand-logo {
            width: 54px;
            height: 54px;
            border: 1px solid #cbd5e1;
            border-radius: 27px;
        }
        .brand-logo-fallback {
            width: 54px;
            height: 54px;
            line-height: 54px;
            text-align: center;
            border: 2px solid #0f172a;
            border-radius: 27px;
            font-size: 18px;
            font-weight: bold;
        }
        .school-name {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .session-line {
            font-size: 10px;
            color: #475569;
            margin-top: 2px;
        }
        .grade-label {
            display: inline-block;
            margin-top: 6px;
            border: 1px solid #0f172a;
            padding: 2px 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .info {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f172a;
        }
        .info td {
            border: 1px solid #94a3b8;
            padding: 7px 8px;
            vertical-align: middle;
            font-size: 11px;
        }
        .info .label {
            width: 16%;
            background: #f8fafc;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #475569;
        }
        .info .value {
            width: 26%;
            font-weight: bold;
            text-transform: capitalize;
        }
        .info .photo-cell {
            width: 16%;
            text-align: center;
            background: #f8fafc;
        }
        .photo {
            width: 70px;
            height: 88px;
            border: 1px solid #64748b;
        }
        .photo-fallback {
            width: 70px;
            height: 88px;
            line-height: 88px;
            margin: 0 auto;
            border: 1px dashed #64748b;
            background: #fff;
            font-size: 22px;
            font-weight: bold;
            color: #94a3b8;
        }
        .photo-caption {
            margin-top: 3px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
        }
        .marks {
            width: 100%;
            border-collapse: collapse;
        }
        .marks th,
        .marks td {
            border: 1px solid #cbd5e1;
            padding: {{ $markRowPadding }}px 7px;
            font-size: 11px;
        }
        .marks th {
            background: #f1f5f9;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-bottom: 2px solid #0f172a;
            padding: 8px 7px;
        }
        .marks .c { text-align: center; }
        .marks .l { text-align: left; }
        .summary {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f172a;
        }
        .summary > tbody > tr > td {
            border: 1px solid #94a3b8;
            vertical-align: top;
            width: 50%;
            padding: 0;
        }
        .summary .head {
            background: #f1f5f9;
            border-bottom: 1px solid #0f172a;
            padding: 7px 8px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .kpi {
            width: 100%;
            border-collapse: collapse;
        }
        .kpi td {
            border: none;
            border-right: 1px solid #cbd5e1;
            padding: 12px 6px;
            text-align: center;
            width: 33.33%;
        }
        .kpi td:last-child { border-right: none; }
        .kpi .k {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
        }
        .kpi .v {
            margin-top: 2px;
            font-size: 14px;
            font-weight: bold;
        }
        .sign {
            width: 100%;
            border-collapse: collapse;
        }
        .sign td {
            width: 50%;
            padding: 14px 10px;
            vertical-align: bottom;
            font-size: 11px;
            border: none;
            border-right: 2px solid #0f172a;
        }
        .sign td:last-child {
            border-right: none;
            text-align: right;
        }
        .sign .muted {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #64748b;
        }
        .sign-line {
            display: inline-block;
            width: 150px;
            border-bottom: 1px dashed #94a3b8;
            margin-bottom: 6px;
            height: 30px;
        }
        .sign-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .mono { font-family: DejaVu Sans Mono, DejaVu Sans, monospace; }
    </style>
</head>
<body>
<div class="sheet">
    <div class="watermark">
        @if(! empty($card['logo_path']) && is_file($card['logo_path']))
            <img src="{{ $card['logo_path'] }}" alt="">
        @else
            <div class="watermark-fallback">{{ $initial }}</div>
        @endif
        <div class="watermark-name">{{ $schoolName }}</div>
    </div>

    <div class="content">
        <table class="top-bar">
            <tr>
                <td>
                    Admission No:
                    <span class="mono" style="text-transform:none;letter-spacing:0;">{{ $card['admission_number'] ?? '—' }}</span>
                </td>
                <td class="right">
                    Roll No:
                    <span style="text-transform:none;letter-spacing:0;">{{ $card['roll_number'] ?? '—' }}</span>
                </td>
            </tr>
        </table>

        <div class="brand">
            <table class="brand-table">
                <tr>
                    <td style="width:66px;">
                        @if(! empty($card['logo_path']) && is_file($card['logo_path']))
                            <img class="brand-logo" src="{{ $card['logo_path'] }}" alt="">
                        @else
                            <div class="brand-logo-fallback">{{ $initial }}</div>
                        @endif
                    </td>
                    <td>
                        <div class="school-name">{{ $schoolName }}</div>
                        <div class="session-line">Academic Session {{ $card['session_name'] ?? '—' }}</div>
                        <div class="grade-label">Grade Card</div>
                    </td>
                    <td style="width:66px;"></td>
                </tr>
            </table>
        </div>

        <table class="info">
            <tr>
                <td class="label">Name of Examination</td>
                <td class="value">{{ $card['exam_name'] ?? '—' }}</td>
                <td class="label">Class / Section</td>
                <td class="value">
                    {{ $card['class_name'] ?? '—' }}{{ ! empty($card['section_name']) ? ' · '.$card['section_name'] : '' }}
                </td>
                <td class="photo-cell" rowspan="4">
                    @if(! empty($card['photo_path']) && is_file($card['photo_path']))
                        <img class="photo" src="{{ $card['photo_path'] }}" alt="">
                    @else
                        <div class="photo-fallback">{{ $studentInitial }}</div>
                    @endif
                    <div class="photo-caption">Photo</div>
                </td>
            </tr>
            <tr>
                <td class="label">Student Name</td>
                <td class="value">{{ $card['student_name'] ?? '—' }}</td>
                <td class="label">Gender</td>
                <td class="value">{{ $card['gender'] ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Guardian</td>
                <td class="value">
                    @if(! empty($card['guardian_name']))
                        {{ $card['guardian_name'] }}{{ ! empty($card['guardian_relationship']) ? ' ('.$card['guardian_relationship'].')' : '' }}
                    @else
                        —
                    @endif
                </td>
                <td class="label">Date of Birth</td>
                <td class="value" style="text-transform:none;">{{ $card['date_of_birth'] ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Registration No.</td>
                <td class="value" style="text-transform:none;">{{ $card['admission_number'] ?? '—' }}</td>
                <td class="label">Session</td>
                <td class="value" style="text-transform:none;">{{ $card['session_name'] ?? '—' }}</td>
            </tr>
        </table>

        <table class="marks">
            <thead>
                <tr>
                    <th class="c" style="width:36px;">#</th>
                    <th class="c" style="width:70px;">Code</th>
                    <th class="l">Subject</th>
                    <th class="c" style="width:60px;">Max</th>
                    <th class="c" style="width:60px;">Pass</th>
                    <th class="c" style="width:70px;">Obtained</th>
                </tr>
            </thead>
            <tbody>
                @forelse($card['subject_marks'] as $index => $item)
                    <tr>
                        <td class="c">{{ $index + 1 }}</td>
                        <td class="c mono">{{ $item['subject_code'] ?: '—' }}</td>
                        <td class="l">{{ $item['subject_name'] }}</td>
                        <td class="c">{{ $item['total_marks'] }}</td>
                        <td class="c">{{ $item['passing_marks'] }}</td>
                        <td class="c" style="font-weight:bold;">
                            @if($item['absent'])
                                AB
                            @elseif($item['obtained_marks'] !== null)
                                {{ $item['obtained_marks'] }}
                            @else
                                —
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="c" style="padding:18px;color:#64748b;">
                            No subject marks found for this student.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">
        <table class="summary">
            <tr>
                <td>
                    <div class="head">Current Exam Performance</div>
                    <table class="kpi">
                        <tr>
                            <td>
                                <div class="k">Total</div>
                                <div class="v">{{ $card['total_marks'] !== null ? number_format($card['total_marks'], 0) : '—' }}</div>
                            </td>
                            <td>
                                <div class="k">Obtained</div>
                                <div class="v">{{ $card['obtained_marks'] !== null ? number_format($card['obtained_marks'], 0) : '—' }}</div>
                            </td>
                            <td>
                                <div class="k">%</div>
                                <div class="v">{{ $card['percentage'] !== null ? number_format($card['percentage'], 2) : '—' }}</div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td>
                    <div class="head">Result Summary</div>
                    <table class="kpi">
                        <tr>
                            <td style="width:50%;">
                                <div class="k">Grade</div>
                                <div class="v">{{ $card['grade'] ?? '—' }}</div>
                            </td>
                            <td style="width:50%;">
                                <div class="k">Status</div>
                                <div class="v" style="text-transform:uppercase;">{{ $card['result_status'] ?? '—' }}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <table class="sign">
            <tr>
                <td>
                    <div><span class="muted">Date of Result:</span> {{ $card['published_at'] ?? '—' }}</div>
                    <div style="margin-top:8px;"><span class="muted">Verified by:</span> Examination Office</div>
                </td>
                <td>
                    <div class="sign-line"></div>
                    <div class="sign-title">Controller of Examinations</div>
                </td>
            </tr>
        </table>
    </div>
</div>
</body>
</html>
