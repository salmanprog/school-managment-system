import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import EducationLoader from '@/Components/EducationLoader';

export default function AppProviders({ children }) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const onStart = (event) => {
            if (event.detail.visit.showProgress === false) {
                return;
            }
            setLoading(true);
        };
        const onFinish = () => setLoading(false);
        const onError = () => setLoading(false);
        const onCancel = () => setLoading(false);

        const offStart = router.on('start', onStart);
        const offFinish = router.on('finish', onFinish);
        const offError = router.on('error', onError);
        const offCancel = router.on('cancel', onCancel);

        return () => {
            offStart();
            offFinish();
            offError();
            offCancel();
        };
    }, []);

    return (
        <>
            <EducationLoader show={loading} />
            {children}
        </>
    );
}
