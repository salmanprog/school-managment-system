@php
    $user = auth()->user();
    $initials = collect(explode(' ', $user->name ?? 'A'))
        ->filter()
        ->take(2)
        ->map(fn ($part) => strtoupper(substr($part, 0, 1)))
        ->implode('');
@endphp

<header class="pos-topbar">
    <div class="pos-topbar-left">
        <button type="button" class="pos-menu-toggle" data-sidebar-toggle aria-label="Toggle menu">
            <i class="fa-solid fa-bars"></i>
        </button>
        <div class="pos-page-heading">
            <h1>@yield('page_title', 'Dashboard')</h1>
            <p class="pos-breadcrumb">@yield('page_breadcrumb', 'Admin / Dashboard')</p>
            @hasSection('page_subtitle')
                <p class="pos-page-subtitle">@yield('page_subtitle')</p>
            @endif
        </div>
    </div>

    <div class="pos-topbar-right">
        @hasSection('page_widgets')
            <div class="pos-topbar-widgets">
                @yield('page_widgets')
            </div>
        @endif

        <div class="pos-user" data-user-menu>
            <button type="button" class="pos-user-btn" data-user-toggle>
                <span class="pos-avatar">{{ $initials ?: 'A' }}</span>
                <span class="pos-user-meta">
                    <strong>{{ $user->name }}</strong>
                    <span>{{ formatRole($user->role) }}</span>
                </span>
            </button>

            <div class="pos-user-menu">
                <form method="POST" action="{{ route('admin.logout') }}">
                    @csrf
                    <button type="submit">Log out</button>
                </form>
            </div>
        </div>
    </div>
</header>
