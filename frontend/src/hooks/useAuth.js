import { useState, useEffect } from "react";
import { checkAuthStatus } from "../APIs/auth-api";

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await checkAuthStatus();
                console.log(response)
                setUser(response.data.user);
                if (response.data.user) {
                    setIsAdmin(response.data.user.isAdmin);
                }
            } catch (error) {
                console.error("Not authenticated", error);
                setUser(null);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, isAuthenticated: !!user, isAdmin, loading };
};

export default useAuth;
