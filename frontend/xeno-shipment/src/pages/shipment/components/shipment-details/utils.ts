import { INCOTERMS } from "../../constants/form-defaults";

export const getDisplayStatus = (status: string | null | undefined) => {
  if (!status) return 'N/A';

  switch (status) {
    case 'requestor_requested':
      return 'WAITING APPROVER';
    case 'send_to_logistic':
      return 'WAITING LOGISTICS';
    case 'logistic_updated':
      return 'WAITING APPROVER';
    case 'approver_approved':
      return 'APPROVED';
    case 'approver_rejected':
      return 'REJECTED';
    default:
      return status.toUpperCase();
  }
};

export const getDisplayStatusHistory = (status: string | null | undefined) => {
  if (!status) return 'N/A';

  switch (status) {
    case 'requestor_requested':
      return 'Requested to Approver';
    case 'send_to_logistic':
      return 'Send to Logistic to Review';
    case 'logistic_updated':
      return 'Logistic Updated';
    case 'approver_approved':
      return 'Approved';
    case 'approver_rejected':
      return 'Rejected';
    case 'logistic_edited':
      return 'Logistic Edited';
    default:
      return status.toUpperCase();
  }
};

export const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) return null;
  const date = new Date(dateTimeString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${year} ${month} ${day} [${displayHours}:${minutes}${period}]`;
};

export const getIncotermDisplay = (key: string) => {
  const incoterm = INCOTERMS.find(term => term.key === key);
  return incoterm ? incoterm.value : key;
};

export const isUrl = (str: string) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};