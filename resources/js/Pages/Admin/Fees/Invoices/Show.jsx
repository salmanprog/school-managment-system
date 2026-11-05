import AdminLayout from '@/Layouts/AdminLayout';
import { PageHeader } from '@/Components/PageHeader';
import { StatusBadge } from '@/Components/PaginationLinks';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Link } from '@inertiajs/react';

export default function Show({ invoice }) {
    return (
        <AdminLayout title={`Invoice ${invoice.invoice_number}`}>
            <PageHeader
                title={invoice.invoice_number}
                breadcrumbs={[
                    { label: 'Admin', href: '/admin' },
                    { label: 'Invoices', href: '/admin/fees/invoices' },
                    { label: invoice.invoice_number },
                ]}
                action={{
                    label: 'Download PDF',
                    showPlus: false,
                    onClick: () => {
                        const url = `/admin/fees/invoices/${invoice.id}/pdf`;
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`);
                        document.body.appendChild(anchor);
                        anchor.click();
                        anchor.remove();
                    },
                }}
            />
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Student</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p>{invoice.student_name}</p>
                        <p className="text-muted-foreground">{invoice.admission_number}</p>
                        <p>
                            {invoice.class_name} · {invoice.session_name}
                        </p>
                        <p>
                            Period: {invoice.billing_period} · Due {invoice.due_date}
                        </p>
                        <StatusBadge status={invoice.status} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Totals</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p>Subtotal: {invoice.subtotal.toFixed(2)}</p>
                        <p>Discount: {invoice.discount_total.toFixed(2)}</p>
                        <p className="font-semibold text-lg">Total: {invoice.total_amount.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Line items</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="py-2">Description</th>
                                <th>Amount</th>
                                <th>Discount</th>
                                <th>Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, i) => (
                                <tr key={i} className="border-b">
                                    <td className="py-2">{item.description}</td>
                                    <td>{item.amount.toFixed(2)}</td>
                                    <td>{item.discount_amount.toFixed(2)}</td>
                                    <td>{item.net_amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            {invoice.payments.length > 0 && (
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm space-y-1">
                            {invoice.payments.map((p, i) => (
                                <li key={i}>
                                    {p.payment_number} — {p.payment_date} — {p.allocated_amount.toFixed(2)}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
            <div className="mt-4">
                <Link href="/admin/fees/invoices" className="text-sm text-primary">
                    ← Back to invoices
                </Link>
            </div>
        </AdminLayout>
    );
}
