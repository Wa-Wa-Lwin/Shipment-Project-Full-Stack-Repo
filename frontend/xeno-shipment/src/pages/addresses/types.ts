export interface AddressData {
  CardCode: string;
  CardName: string;
  CardType: string;
  Phone1?: string;
  MailZipCod?: string;
  MailAddres?: string;
  ZipCode?: string;
  Address?: string;
  Currency?: string;
  City?: string;
  County?: string;
  Country?: string;
  MailCity?: string;
  MailCounty?: string;
  MailCountr?: string;
  E_Mail?: string;
  Building?: string;
  MailBuildi?: string;
  StreetNo?: string;
  MailStrNo?: string;
  CntctPrsn?: string;
  BillToDef?: string;
  ShipToDef?: string;
  TaxID?: string;
}

export interface CardTypeInfo {
  label: string;
  color: 'primary' | 'secondary' | 'default';
  icon: string;
}

export interface AddressTableProps {
  addresses: AddressData[];
  isLoading: boolean;
  onAddressClick: (address: AddressData) => void;
  currentPage: number;
  itemsPerPage: number;
}

export interface AddressDetailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  address: AddressData | null;
}

export interface AddressHeaderProps {
  totalAddresses: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  addresses: AddressData[];
}