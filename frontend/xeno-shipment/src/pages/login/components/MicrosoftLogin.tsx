import { useState, useEffect } from 'react';
import { Button } from "@heroui/react";
import { PublicClientApplication } from '@azure/msal-browser';
import { useNavigate } from 'react-router-dom';
import { msalConfig } from '../../../config/msalConfig';
import { useAuth } from '@context/AuthContext';

const pca = new PublicClientApplication(msalConfig);

export default function MicrosoftLogin() {
  const { login } = useAuth();
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await pca.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
        setError('Failed to initialize Microsoft authentication. Please refresh the page.');
      }
    };

    initializeMsal();
  }, []);

  const handleMicrosoftLogin = async () => {
    if (!isInitialized) {
      setError('Microsoft authentication is not ready. Please wait a moment and try again.');
      return;
    }

    setIsMicrosoftLoading(true);
    setError(null);

    try {
      const loginRequest = {
        scopes: ['User.Read'],
        prompt: 'select_account',
        loginHint: '@xenoptics.com'
      };

      const result = await pca.loginPopup(loginRequest);

      if (result.account) {
        const userEmail = result.account.username;

        // Check if user is from xenoptics.com domain
        if (!userEmail.endsWith('@xenoptics.com')) {
          setError('Access denied. Only @xenoptics.com email addresses are allowed.');
          await pca.logoutPopup();
          return;
        }

        // Get access token
        const tokenRequest = {
          scopes: ['User.Read'],
          account: result.account
        };

        const tokenResponse = await pca.acquireTokenSilent(tokenRequest);

        const userData = {
          email: result.account.username,
          name: result.account.name ?? "",
          id: result.account.localAccountId,
          accessToken: tokenResponse.accessToken
        };

        console.log('Login successful (client-side):', userData);
        login(userData);
        // navigate('/overview');
        navigate('/shipment');

      }
    } catch (error: unknown) {
      console.error('Microsoft login error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      const msalError = error as { errorCode?: string; errorMessage?: string; message?: string };
      if (msalError.errorCode === 'user_cancelled') {
        setError('Login was cancelled.');
      } else if (msalError.errorCode === 'access_denied') {
        setError('Access denied. Please contact your administrator.');
      } else {
        const errorMsg = msalError.errorMessage || msalError.message || 'An error occurred during login. Please try again.';
        setError(`Login failed: ${errorMsg}`);
        console.error('Detailed error message:', errorMsg);
      }
    } finally {
      setIsMicrosoftLoading(false);
    }
  };

  return (
    <div className="">
      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Microsoft Login Button */}
      <Button
        variant="bordered"
        type="button"
        onClick={handleMicrosoftLogin}
        disabled={isMicrosoftLoading || !isInitialized}
        className="w-full"
      >
        {isMicrosoftLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in with Microsoft...
          </div>
        ) : (
          <div className="flex items-center">
            {/* Microsoft Logo SVG */}
            <svg className="w-5 h-5 mr-3" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="12" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="12" width="9" height="9" fill="#00A4EF" />
              <rect x="12" y="12" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </div>

        )}
      </Button>

      {/* Domain Restriction Notice */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          Only @xenoptics.com email addresses are allowed
        </p>
      </div>
    </div>
  );
}
