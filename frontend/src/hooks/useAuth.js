import { useState, useEffect } from "react";
import { checkAuthStatus } from "../APIs/auth-api";

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await checkAuthStatus();
                console.log(response)
                setUser(response.data.user);
            } catch (error) {
                console.error("Not authenticated", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, isAuthenticated: !!user, loading };
};

export default useAuth;
