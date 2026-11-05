<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Sign in' }} — SMS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/admin-auth.css') }}">
</head>
<body class="pos-auth ci-auth">
    <div class="ci-bg" aria-hidden="true">
        <div class="ci-bg-aurora"></div>
        <div class="ci-bg-grid"></div>
        <div class="ci-bg-hex"></div>
        <div class="ci-bg-orb ci-bg-orb--1"></div>
        <div class="ci-bg-orb ci-bg-orb--2"></div>
        <div class="ci-bg-orb ci-bg-orb--3"></div>
        <div class="ci-bg-beams"></div>
        <canvas id="ci-neural-canvas"></canvas>
    </div>
    {{ $slot }}
    <script src="{{ asset('js/admin-neural.js') }}"></script>
</body>
</html>
