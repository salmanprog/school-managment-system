@php
    $modules = dynamic_sidebar();
    $currentRoute = request()->route()?->getName();
@endphp

<aside class="pos-sidebar" id="posSidebar">
    <a href="{{ route('admin.dashboard') }}" class="pos-brand">
        <span class="pos-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
        </span>
        <span>
            <span class="pos-brand-text">SMS</span>
        </span>
    </a>

    <div class="pos-nav-label">Menu</div>

    <nav class="pos-nav" aria-label="Admin">
        <ul class="pos-nav-list">
            @forelse ($modules as $module)
                @php
                    $hasChildren = $module->children && $module->children->count() > 0;
                    $childActive = $hasChildren && $module->children->contains(fn ($child) => $child->route_name === $currentRoute);
                    $isActive = (!$hasChildren && $module->route_name === $currentRoute) || $childActive;
                    $href = $hasChildren
                        ? '#'
                        : (Route::has($module->route_name) ? route($module->route_name) : '#');
                @endphp

                <li class="pos-nav-item {{ $childActive ? 'is-open' : '' }}">
                    @if ($hasChildren)
                        <button type="button" class="pos-nav-link {{ $isActive ? 'is-active' : '' }}" data-submenu-toggle>
                            <i class="{{ $module->icon }}"></i>
                            <span class="label">{{ $module->name }}</span>
                            <i class="fa-solid fa-chevron-right chevron"></i>
                        </button>
                        <ul class="pos-submenu">
                            @foreach ($module->children as $child)
                                <li>
                                    <a
                                        href="{{ Route::has($child->route_name) ? route($child->route_name) : '#' }}"
                                        class="{{ $child->route_name === $currentRoute ? 'is-active' : '' }}"
                                    >
                                        {{ $child->name }}
                                    </a>
                                </li>
                            @endforeach
                        </ul>
                    @else
                        <a href="{{ $href }}" class="pos-nav-link {{ $isActive ? 'is-active' : '' }}">
                            <i class="{{ $module->icon }}"></i>
                            <span class="label">{{ $module->name }}</span>
                        </a>
                    @endif
                </li>
            @empty
                <li class="pos-nav-item">
                    <a href="{{ route('admin.dashboard') }}" class="pos-nav-link is-active">
                        <i class="fa-solid fa-gauge-high"></i>
                        <span class="label">Dashboard</span>
                    </a>
                </li>
            @endforelse
        </ul>
    </nav>

    <div class="pos-sidebar-foot">
        <p>SMS admin workspace</p>
    </div>
</aside>
