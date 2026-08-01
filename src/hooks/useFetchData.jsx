import { useEffect, useState } from 'react';
import { token } from '@/config';

const useFetchData = (url) => {
    const [data, setData] = useState(null); // Start with null to handle empty state properly
    const [error, setError] = useState(null); // Start with null for error
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        
        const fetchData = async () => {
            try {
                if (!token) {
                    throw new Error('No token found. Please log in.'); // Handle missing token
                }

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const result = await res.json();
                // console.log(result);
                
                
                if (!res.ok) {
                    throw new Error(result.message + ' 🤢');
                }

                setData(result.data); // Assuming result.data is the user profile data
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError(err.message); // Set the error message to state
                console.error('Fetch error:', err); // Log the error for better debugging
            }
        };

        fetchData();
    }, [url]);

    return {
        data,
        error,
        loading
    };
};

export default useFetchData;
