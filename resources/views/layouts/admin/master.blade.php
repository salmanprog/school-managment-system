<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Dashboard') — SMS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-lite.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css">
    <link rel="stylesheet" href="{{ asset('css/admin-panel.css') }}">
    <link rel="stylesheet" href="{{ asset('css/admin-panel-theme.css') }}">
    @stack('styles')
</head>
<body class="pos-admin ci-admin">
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

    <div class="pos-overlay" data-sidebar-close></div>
    <div class="pos-loading" data-loading>
        <div class="pos-loading-card">
            <div class="pos-spinner" aria-hidden="true"></div>
            <p>Loading...</p>
        </div>
    </div>

    <div class="pos-shell">
        @include('layouts.admin.partials.sidebar')

        <div class="pos-main">
            @include('layouts.admin.partials.header')

            <main class="pos-content">
                @yield('content')
            </main>

            @include('layouts.admin.partials.footer')
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-lite.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="{{ asset('js/admin-panel.js') }}"></script>
    <script src="{{ asset('js/admin-validation.js') }}"></script>
    <script src="{{ asset('js/admin-neural.js') }}"></script>
    @stack('scripts')
</body>
</html>
