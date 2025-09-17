import { useAuth } from 'state/AuthContext';

/**
 * Custom hook to check authentication status and user roles
 * @returns {Object} Authentication status and helper functions
 */
const useAuthStatus = () => {
  const { user, isAuthenticated, loading } = useAuth();

  /**
   * Check if current user has admin role
   * @returns {boolean} True if user is admin
   */
  const isAdmin = () => {
    return !!(user && (user.role === 'admin' || user.isAdmin));
  };

  /**
   * Check if current user has a specific role
   * @param {string|string[]} roles - Role or array of roles to check
   * @returns {boolean} True if user has any of the specified roles
   */
  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    if (Array.isArray(roles)) {
      return roles.some(role => user.role === role || (role === 'admin' && isAdmin()));
    }
    return user.role === roles || (roles === 'admin' && isAdmin());
  };

  return {
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    hasRole,
    user,
    loading,
    // Alias for compatibility
    isLoggedIn: isAuthenticated(),
    // User info shortcuts
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email,
    userAvatar: user?.avatar
  };
};

export default useAuthStatus;
