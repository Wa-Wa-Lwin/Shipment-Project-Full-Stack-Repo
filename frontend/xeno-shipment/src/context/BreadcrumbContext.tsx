import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type ActiveButtonType = 'Request' | 'Review' | 'Approval' | null;

interface BreadcrumbContextType {
  activeButton: ActiveButtonType;
  setActiveButton: (button: ActiveButtonType) => void;
  activeButtons: ActiveButtonType[];
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

interface BreadcrumbProviderProps {
  children: ReactNode;
}

export const BreadcrumbProvider: React.FC<BreadcrumbProviderProps> = ({ children }) => {
  const { msLoginUser } = useAuth();

  // Allowed emails for Review buttons
  // const reviewerEmails = [
  //   'erp@xenoptics.com', 
  //   'jarin@xenoptics.com',
  //   'wawa@xenoptics.com', 
  //   'susu@xenoptics.com', 
  //   'sasipimol@xenoptics.com',
  //   'arphaphat@xenoptics.com',
  //   'vanchan@xenoptics.com',
  //   'supisara@xenoptics.com',
  //   'thinzar@xenoptics.com'
  // ];

  // // Check if current user email is allowed to see review buttons
  // const isReviewAllowed = msLoginUser?.email && reviewerEmails.includes(msLoginUser.email.toLowerCase());

  // Allowed emails for Approval buttons
  const approverEmails = [
    'sasipimol@xenoptics.com',
    'wawa@xenoptics.com',
    'thinzar@xenoptics.com',
    'kotchakorn@xenoptics.com',
    'sira@xenoptics.com',
    'solomon@xenoptics.com',
  ];

  // Check if current user email is allowed to see Approval buttons
  const isApprovalAllowed = msLoginUser?.email && approverEmails.includes(msLoginUser.email.toLowerCase());


  const activeButtons: ActiveButtonType[] = [
    "Request" as ActiveButtonType,
    // ...(isReviewAllowed ? ["Review" as ActiveButtonType] : []),
    ...(isApprovalAllowed ? ["Approval" as ActiveButtonType] : []),
  ];

  const [activeButton, setActiveButton] = useState<ActiveButtonType>('Request'); 

  const value: BreadcrumbContextType = {
    activeButton,
    setActiveButton,
    activeButtons,
  };

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = (): BreadcrumbContextType => {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};
