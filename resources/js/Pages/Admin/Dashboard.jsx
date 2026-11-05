import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export default function Dashboard({ stats = {}, charts = {} }) {
    const cards = [
        { label: 'Active Students', value: stats.active_students ?? 0 },
        { label: 'Teachers', value: stats.teachers ?? 0 },
        { label: 'Classes', value: stats.classes ?? 0 },
        { label: "Today's Attendance %", value: stats.today_attendance ?? '—' },
        { label: 'Month Fee Collection', value: stats.month_fee_collection ?? '0.00' },
        { label: 'Outstanding Fees', value: stats.outstanding_fees ?? '0.00' },
        { label: 'Pending Admissions', value: stats.pending_admissions ?? 0 },
        { label: 'Upcoming Exams', value: stats.upcoming_exams ?? 0 },
    ];

    const monthlyFeeCollection = charts.monthlyFeeCollection ?? [];
    const attendanceTrend = charts.attendanceTrend ?? [];

    return (
        <AdminLayout title="Dashboard">
            <PageHeader
                title="Dashboard Overview"
                breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.label} className="shadow-sm ring-1 ring-slate-200/70">
                        <CardHeader className="border-0 pb-0">
                            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                {card.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tracking-tight text-ink-900">
                                {card.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-sm ring-1 ring-slate-200/70">
                    <CardHeader>
                        <CardTitle>Fee collection (6 months)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyFeeCollection}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar
                                    dataKey="total"
                                    fill="#0f766e"
                                    name="Collected"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-sm ring-1 ring-slate-200/70">
                    <CardHeader>
                        <CardTitle>Attendance trend (14 days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={attendanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => (v == null ? '—' : `${v}%`)} />
                                <Line
                                    type="monotone"
                                    dataKey="pct"
                                    stroke="#16a34a"
                                    name="Present %"
                                    connectNulls={false}
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
