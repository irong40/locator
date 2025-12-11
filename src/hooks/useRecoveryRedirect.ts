import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook that detects password recovery tokens in the URL hash
 * and redirects to the reset-password page while preserving the hash.
 */
export function useRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    const isRecoveryFlow = hash.includes('type=recovery');
    const isOnResetPage = location.pathname === '/reset-password';

    if (isRecoveryFlow && !isOnResetPage) {
      // Redirect to reset-password while preserving the hash
      // Use window.location to preserve the hash fragment
      window.location.href = `/reset-password${hash}`;
    }
  }, [location.pathname, navigate]);
}
