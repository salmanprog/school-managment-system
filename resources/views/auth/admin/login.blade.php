<x-admin-auth-layout title="Admin Sign in">
    <div class="pos-auth-shell school-auth-shell">
        <section class="school-auth-frame" data-auth-frame>
            <aside class="school-auth-visual">
                <div class="school-auth-photo-wrap">
                    <img
                        src="{{ asset('images/auth/school-login-hero.jpg') }}"
                        alt="Students learning together in a classroom"
                        class="school-auth-photo"
                    >
                </div>

                <div class="school-auth-visual-overlay">
                    <div class="school-auth-badge school-anim" style="--d: 0.15s">
                        <span class="school-auth-badge-dot"></span>
                        Live campus operations
                    </div>

                    <p class="school-auth-eyebrow school-anim" style="--d: 0.28s">Education first</p>
                    <h2 class="school-anim" style="--d: 0.4s">Shape brighter futures, one classroom at a time.</h2>
                    <p class="school-anim" style="--d: 0.52s">Manage admissions, attendance, staff, and academics from one secure admin workspace.</p>

                    <ul class="school-auth-points school-anim" style="--d: 0.68s">
                        <li>Students</li>
                        <li>Teachers</li>
                        <li>Classes</li>
                        <li>Attendance</li>
                    </ul>
                </div>
            </aside>

            <div class="pos-auth-card school-auth-card">
                <a href="{{ url('/') }}" class="pos-mark school-anim" style="--d: 0.2s">
                    <span class="pos-mark-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                    </span>
                    <span>
                        <span class="pos-mark-text">SMS</span>
                        <span class="pos-mark-sub">Admin workspace</span>
                    </span>
                </a>

                <div class="pos-auth-copy school-anim" style="--d: 0.34s">
                    <h1>Welcome back</h1>
                    <p>Sign in with your administrator credentials to continue.</p>
                </div>

                <x-auth-session-status class="pos-status school-anim" style="--d: 0.4s" :status="session('status')" />

                <form
                    method="POST"
                    action="{{ route('admin.login.submit') }}"
                    class="pos-auth-form admin-validate"
                    data-validate
                    data-auth-form
                    novalidate
                >
                    @csrf

                    <div class="pos-field school-anim" data-field style="--d: 0.46s">
                        <label for="email">{{ __('Email') }}</label>
                        <div class="school-input-wrap">
                            <span class="school-input-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z"></path><path d="m4 7 8 6 8-6"></path></svg>
                            </span>
                            <input
                                id="email"
                                type="text"
                                name="email"
                                value="{{ old('email') }}"
                                placeholder="admin@school.com"
                                autofocus
                                autocomplete="username"
                                inputmode="email"
                                class="@error('email') is-invalid @enderror"
                                data-rules="required|email"
                                data-msg-required="Please enter your email address."
                                data-msg-email="Please enter a valid email address."
                            >
                        </div>
                        <div class="pos-error" data-error @if (! $errors->has('email')) hidden @endif>
                            @error('email'){{ $message }}@enderror
                        </div>
                    </div>

                    <div class="pos-field school-anim" data-field style="--d: 0.58s">
                        <label for="password">{{ __('Password') }}</label>
                        <div class="pos-password school-input-wrap">
                            <span class="school-input-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>
                            </span>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                autocomplete="current-password"
                                class="@error('password') is-invalid @enderror"
                                data-rules="required"
                                data-msg-required="Please enter your password."
                            >
                            <button type="button" class="pos-password-toggle" data-password-toggle aria-label="Show password">Show</button>
                        </div>
                        <div class="pos-error" data-error @if (! $errors->has('password')) hidden @endif>
                            @error('password'){{ $message }}@enderror
                        </div>
                    </div>

                    <div class="pos-row school-anim" style="--d: 0.68s">
                        <label for="remember_me" class="pos-remember">
                            <input id="remember_me" type="checkbox" name="remember" value="1">
                            <span>{{ __('Remember me') }}</span>
                        </label>
                    </div>

                    <button type="submit" class="pos-submit school-anim" style="--d: 0.78s">
                        <span class="pos-submit-label">{{ __('Sign in') }}</span>
                        <span class="pos-submit-shine" aria-hidden="true"></span>
                    </button>
                </form>

                <p class="pos-auth-footnote school-anim" style="--d: 0.9s">
                    Secured admin access · Authorized staff only
                </p>
            </div>
        </section>
    </div>

    <script src="{{ asset('js/admin-validation.js') }}"></script>
    <script>
        (function () {
            var frame = document.querySelector('[data-auth-frame]');
            if (frame) {
                requestAnimationFrame(function () {
                    frame.classList.add('is-ready');
                });
            }

            var toggle = document.querySelector('[data-password-toggle]');
            var input = document.getElementById('password');
            if (! toggle || ! input) return;

            toggle.addEventListener('click', function () {
                var show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                toggle.textContent = show ? 'Hide' : 'Show';
                toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            });
        })();
    </script>
</x-admin-auth-layout>
