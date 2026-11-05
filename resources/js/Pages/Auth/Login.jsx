import { useForm } from '@inertiajs/react';
import { BookOpenCheck, GraduationCap, ShieldCheck } from 'lucide-react';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            <aside className="edu-login-panel relative hidden overflow-hidden px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="pointer-events-none absolute inset-0 opacity-30" style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }} />
                <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-100">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Campus Admin
                    </div>
                    <h1 className="mt-8 max-w-md font-display text-4xl font-semibold leading-tight tracking-tight">
                        Lead every classroom from one calm workspace.
                    </h1>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-200/85">
                        Admissions, attendance, fees, and examinations — designed for schools that need clarity without clutter.
                    </p>
                </div>

                <ul className="relative space-y-3">
                    {[
                        { icon: BookOpenCheck, text: 'Academic sessions, classes, and subjects in sync' },
                        { icon: ShieldCheck, text: 'Role-based access for teachers and office staff' },
                    ].map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-400/20 text-teal-100">
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-sm text-slate-100">{text}</span>
                        </li>
                    ))}
                </ul>
            </aside>

            <section className="flex items-center justify-center bg-ink-50 px-4 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-display text-lg font-semibold text-ink-900">Campus</p>
                            <p className="text-xs text-slate-500">School Management System</p>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-panel sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Welcome back</p>
                        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900">Admin sign in</h2>
                        <p className="mt-2 text-sm text-slate-500">Use your staff credentials to continue.</p>

                        <form onSubmit={submit} className="mt-8 space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" required>Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    autoFocus
                                    placeholder="admin@school.edu"
                                />
                                {errors.email && <p className="text-sm text-rose-600">{errors.email}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password" required>Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="text-sm text-rose-600">{errors.password}</p>}
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                Keep me signed in
                            </label>
                            <Button type="submit" className="h-11 w-full" disabled={processing}>
                                {processing ? 'Signing in…' : 'Enter campus desk'}
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}
