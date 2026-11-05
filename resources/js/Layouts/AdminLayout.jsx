import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    CalendarRange,
    ChevronDown,
    GraduationCap,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { navigation } from '@/Config/navigation';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { SideDrawer } from '@/Components/ui/SideDrawer';
import { cn } from '@/lib/utils';

function can(permissions, permission) {
    if (!permission) return true;
    if (!permissions?.length) return false;
    return permissions.includes(permission) || permissions.includes('*');
}

/**
 * Exact match, or prefix match only when no longer/more-specific nav href also matches.
 * Prevents /admin/attendance highlighting while on /admin/attendance/reports.
 */
function isNavItemActive(path, href, allHrefs = []) {
    if (path === href) {
        return true;
    }
    if (href === '/admin' || !path.startsWith(`${href}/`)) {
        return false;
    }
    return !allHrefs.some(
        (other) =>
            other !== href &&
            other.length > href.length &&
            (other === href || other.startsWith(`${href}/`)) &&
            (path === other || path.startsWith(`${other}/`)),
    );
}

export default function AdminLayout({ children, title }) {
    const page = usePage();
    const { auth, flash, currentAcademicSession, schoolName } = page.props;
    const permissions = auth?.user?.permissions || [];
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState({});
    const [profileOpen, setProfileOpen] = useState(false);
    const path = String(page.url || '').split('?')[0];

    const profileForm = useForm({
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const filteredNav = useMemo(
        () =>
            navigation
                .map((group) => ({
                    ...group,
                    items: group.items.filter((item) => can(permissions, item.permission)),
                }))
                .filter((group) => group.items.length > 0),
        [permissions],
    );

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const allNavHrefs = useMemo(
        () => filteredNav.flatMap((group) => group.items.map((item) => item.href)),
        [filteredNav],
    );

    useEffect(() => {
        const next = {};
        filteredNav.forEach((group) => {
            if (group.items.some((item) => isNavItemActive(path, item.href, allNavHrefs))) {
                next[group.title] = true;
            }
        });
        setOpenGroups((prev) => ({ ...prev, ...next }));
    }, [filteredNav, path, allNavHrefs]);

    const toggleGroup = (groupTitle) => {
        setOpenGroups((prev) => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
    };

    const logout = (e) => {
        e.preventDefault();
        router.post('/admin/logout');
    };

    const openProfile = () => {
        profileForm.clearErrors();
        profileForm.setData({
            name: auth?.user?.name || '',
            email: auth?.user?.email || '',
            current_password: '',
            password: '',
            password_confirmation: '',
        });
        setProfileOpen(true);
    };

    const closeProfile = () => {
        setProfileOpen(false);
        profileForm.reset('current_password', 'password', 'password_confirmation');
        profileForm.clearErrors();
    };

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.put('/admin/profile', {
            preserveScroll: true,
            onSuccess: () => closeProfile(),
        });
    };

    const initials = (auth?.user?.name || 'A')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="min-h-screen bg-edu-mesh">
            <Toaster richColors position="top-right" closeButton />

            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close menu overlay"
                    className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col bg-ink-900 text-slate-200 shadow-soft transition-transform duration-300 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
                    <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-teal-400/15 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-white shadow-lg shadow-teal-900/40">
                                <GraduationCap className="h-6 w-6" strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                                <p className="font-display text-lg leading-none tracking-tight text-white">Campus</p>
                                <p className="mt-1 truncate text-xs text-slate-400">{schoolName || 'School Admin'}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
                    {filteredNav.map((group) => {
                        const isCollapsible = group.collapsible !== false && group.items.length > 1;
                        const isOpen = ! isCollapsible || (openGroups[group.title] ?? false);

                        const renderItem = (item) => {
                            const active = isNavItemActive(path, item.href, allNavHrefs);
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                                            active
                                                ? 'bg-gradient-to-r from-teal-500/25 to-sky-500/10 text-white shadow-inner ring-1 ring-teal-400/30'
                                                : 'text-slate-300 hover:bg-white/5 hover:text-white',
                                        )}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-8 w-8 items-center justify-center rounded-lg transition',
                                                active
                                                    ? 'bg-teal-400/20 text-teal-200'
                                                    : 'bg-white/5 text-slate-400 group-hover:text-teal-200',
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        };

                        return (
                            <div key={group.title} className="mb-4">
                                {isCollapsible ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.title)}
                                            className="mb-1.5 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-300"
                                        >
                                            {group.title}
                                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                                        </button>
                                        {isOpen && <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>}
                                    </>
                                ) : (
                                    <ul className="space-y-0.5">{group.items.map(renderItem)}</ul>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <CalendarRange className="h-3.5 w-3.5 text-teal-300" />
                            Academic session
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-white">
                            {currentAcademicSession?.name || 'Not configured'}
                        </p>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-[17.5rem]">
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
                    <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 sm:px-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm lg:hidden"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-teal-700">
                                    <BookOpen className="hidden h-4 w-4 sm:block" />
                                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em]">
                                        Administration
                                    </p>
                                </div>
                                <h1 className="truncate font-display text-xl font-semibold tracking-tight text-ink-900">
                                    {title || 'Dashboard'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={openProfile}
                                title="Update profile"
                                className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40 md:flex"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-xs font-bold text-white">
                                    {initials}
                                </div>
                                <div className="pr-1 text-left">
                                    <p className="text-sm font-semibold leading-tight text-slate-800">
                                        {auth?.user?.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        {auth?.user?.roles?.[0] || 'Staff'}
                                    </p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={openProfile}
                                title="Update profile"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-xs font-bold text-white shadow-sm md:hidden"
                            >
                                {initials}
                            </button>
                            <button
                                type="button"
                                onClick={logout}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="edu-page px-4 py-6 sm:px-6 sm:py-8">{children}</main>
            </div>

            <SideDrawer
                open={profileOpen}
                onClose={closeProfile}
                title="My profile"
                description="Update your name, email, or password."
                size="md"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={closeProfile}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="admin-profile-form"
                            disabled={profileForm.processing}
                        >
                            {profileForm.processing ? 'Saving…' : 'Save changes'}
                        </Button>
                    </div>
                }
            >
                <form
                    id="admin-profile-form"
                    noValidate
                    onSubmit={submitProfile}
                    className="space-y-4"
                >
                    <div>
                        <Label required>Name</Label>
                        <Input
                            value={profileForm.data.name}
                            onChange={(e) => profileForm.setData('name', e.target.value)}
                        />
                        {profileForm.errors.name ? (
                            <p className="mt-1 text-sm text-rose-600">{profileForm.errors.name}</p>
                        ) : null}
                    </div>
                    <div>
                        <Label required>Email</Label>
                        <Input
                            type="email"
                            value={profileForm.data.email}
                            onChange={(e) => profileForm.setData('email', e.target.value)}
                        />
                        {profileForm.errors.email ? (
                            <p className="mt-1 text-sm text-rose-600">{profileForm.errors.email}</p>
                        ) : null}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Change password
                        </p>
                        <div className="space-y-3">
                            <div>
                                <Label>Current password</Label>
                                <Input
                                    type="password"
                                    value={profileForm.data.current_password}
                                    onChange={(e) =>
                                        profileForm.setData('current_password', e.target.value)
                                    }
                                    autoComplete="current-password"
                                />
                                {profileForm.errors.current_password ? (
                                    <p className="mt-1 text-sm text-rose-600">
                                        {profileForm.errors.current_password}
                                    </p>
                                ) : null}
                            </div>
                            <div>
                                <Label>New password</Label>
                                <Input
                                    type="password"
                                    value={profileForm.data.password}
                                    onChange={(e) =>
                                        profileForm.setData('password', e.target.value)
                                    }
                                    autoComplete="new-password"
                                />
                                {profileForm.errors.password ? (
                                    <p className="mt-1 text-sm text-rose-600">
                                        {profileForm.errors.password}
                                    </p>
                                ) : null}
                            </div>
                            <div>
                                <Label>Confirm new password</Label>
                                <Input
                                    type="password"
                                    value={profileForm.data.password_confirmation}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </SideDrawer>
        </div>
    );
}
