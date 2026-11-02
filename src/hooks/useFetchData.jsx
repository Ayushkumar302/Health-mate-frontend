import { useContext, useEffect, useState } from 'react';
import { authContext } from '@/context/AuthContext';
import { reportSessionExpired } from '@/utils/session';

const useFetchData = (url) => {
    const { token } = useContext(authContext);
    const [data, setData] = useState(null); // Start with null to handle empty state properly
    const [error, setError] = useState(null); // Start with null for error
    const [loading, setLoading] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        // pass a falsy url to skip fetching (e.g. personal data when nobody is logged in)
        if (!url) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        const fetchData = async () => {
            try {
                // public endpoints (doctor list/details) work without a token
                const res = await fetch(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                const result = await res.json();

                if (!res.ok) {
                    // the login is no longer valid: log out once instead of showing an error
                    if (res.status === 401 && token) reportSessionExpired();
                    throw new Error(result.message);
                }

                setData(result.data); // Assuming result.data is the user profile data
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError(err.message); // shown on the page, nothing is logged to the console
            }
        };

        fetchData();
    }, [url, token, reloadKey]);

    // call after changing data (e.g. cancelling a booking) to load it again
    const refetch = () => setReloadKey(key => key + 1);

    return {
        data,
        error,
        loading,
        refetch
    };
};

export default useFetchData;
