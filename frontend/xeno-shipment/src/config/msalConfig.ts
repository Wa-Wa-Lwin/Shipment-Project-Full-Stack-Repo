import { LogLevel } from '@azure/msal-browser';
import type { Configuration } from "@azure/msal-browser";

// MSAL configuration for Microsoft Authentication
export const msalConfig: Configuration = {

    auth: {
    clientId: import.meta.env.VITE_APP_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_APP_TENANT_ID}`,

    //  server
    redirectUri: import.meta.env.VITE_APP_WEB_URL || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_APP_WEB_URL || window.location.origin,

  },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
                if (containsPii) return;
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
        },
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
    scopes: ['User.Read'],
    prompt: 'select_account', // Force account selection
};

// Microsoft Graph API endpoint
export const graphConfig = {
    graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};

// Domain restriction for @xenoptics.com emails
export const ALLOWED_DOMAINS = ['xenoptics.com'];

// Function to validate if user's email domain is allowed
export const isEmailDomainAllowed = (email: string) => {
    if (!email) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return ALLOWED_DOMAINS.includes(domain);
};

// Function to extract domain from email
export const getEmailDomain = (email: string) => {
    if (!email || !email.includes('@')) return null;
    return email.split('@')[1]?.toLowerCase();
};
