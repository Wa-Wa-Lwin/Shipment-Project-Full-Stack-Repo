import {Chip} from "@heroui/react";
import {Icon} from "@iconify/react";

import type { SidebarItem } from "./Sidebar";
import TeamAvatar from "./team-avatar";
import { isWarehouseOnlyUser } from "@config/userRoles";
import type { UserRoleList } from "@pages/user-role-list/types";

/**
 * Please check the https://heroui.com/docs/guide/routing to have a seamless router integration
 */

// Re-export for convenience
export { isWarehouseOnlyUser };

export const getFilteredSidebarItems = (items: SidebarItem[], userRoleList?: UserRoleList | null): SidebarItem[] => {
  // First check if user is warehouse-only
  if (isWarehouseOnlyUser(userRoleList)) {
    return items.filter(item => item.key === 'warehouse');
  }

  // Filter items based on user roles
  return items.filter(item => {
    // Show "Local" section only if user has Logistic or Developer role
    if (item.key === 'local') {
      if (!userRoleList) return false;
      return userRoleList.Logistic === true || userRoleList.Developer === true;
    }

    // Show all other items by default
    return true;
  });
};

export const items: SidebarItem[] = [
  {
    key: "home",
    href: "#",
    icon: "solar:home-2-linear",
    title: "Home",
  },
  {
    key: "projects",
    href: "#",
    icon: "solar:widget-2-outline",
    title: "Projects",
    endContent: (
      <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
    ),
  },
  {
    key: "tasks",
    href: "#",
    icon: "solar:checklist-minimalistic-outline",
    title: "Tasks",
    endContent: (
      <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
    ),
  },
  {
    key: "team",
    href: "#",
    icon: "solar:users-group-two-rounded-outline",
    title: "Team",
  },
  {
    key: "tracker",
    href: "#",
    icon: "solar:sort-by-time-linear",
    title: "Tracker",
    endContent: (
      <Chip size="sm" variant="flat">
        New
      </Chip>
    ),
  },
  {
    key: "analytics",
    href: "#",
    icon: "solar:chart-outline",
    title: "Analytics",
  },
  {
    key: "perks",
    href: "#",
    icon: "solar:gift-linear",
    title: "Perks",
    endContent: (
      <Chip size="sm" variant="flat">
        3
      </Chip>
    ),
  },
  {
    key: "expenses",
    href: "#",
    icon: "solar:bill-list-outline",
    title: "Expenses",
  },
  {
    key: "settings",
    href: "#",
    icon: "solar:settings-outline",
    title: "Settings",
  },
];

export const sectionItems: SidebarItem[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    to: "/dashboard",
    items: [
      {
        key: "dashboard",
        to: "/dashboard",
        icon: "majesticons:home",
        title: "Dashboard",
      },      
    ],
  },
  {
    key: "shipment",
    title: "Shipment",
    to: "/shipment",
    items: [
      {
        key: "shipment",
        to: "/shipment",
        icon: "solar:chart-outline",
        title: "Shipments",
      },
      {
        key: "request-form",
        to: "/shipment/request-form",
        icon: "codicon:request-changes",
        title: "New Request Form",
        // endContent: (
        //   // <Chip size="sm" variant="flat">
        //   //   3
        //   // </Chip>
        //   // <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
        // ),
      },
    ],
  },
  {
    key: "warehouse",
    title: "Warehouse",
    to: "/warehouse",
    items: [
      {
        key: "warehouse",
        to: "/warehouse",
        icon: "solar:box-minimalistic-bold",
        title: "Warehouse",
      },
    ],
  },
  {
    key: "items",
    title: "Items",
    to: "/items",
    items: [
      {
        key: "items",
        to: "/items",
        icon: "lets-icons:materials",
        title: "Items",
      },      
    ],
  },
  // old addresses
  // {
  //   key: "addresses",
  //   title: "Addresses",
  //   to: "/addresses",
  //   items: [
  //     {
  //       key: "addresses",
  //       to: "/addresses",
  //       icon: "tabler:address-book",
  //       title: "Addresses",
  //     },      
  //   ],
  // },
  {
    key: "user-approver-data",
    to: "/user-approver-data",
    icon: "solar:home-2-linear",
    title: "User & Approver Data",
    items: [
      {
        key: "user-approver-data",
        to: "/user-approver-data",
        icon: "solar:home-2-linear",
        title: "User & Approver Data",
      },
    ]
  },
  {
    key: "local",
    to: "/local",
    title: "Local",
    items: [
      {
        key: "address-list",
        to: "/local/address-list",
        icon: "tabler:address-book",
        title: "Address List New",
      },
      {
        key: "parcel-box-types",
        to: "/local/parcel-box-types",
        icon: "solar:box-linear",
        title: "Parcel Box Types",
      },
      {
        key: "user-role-list",
        to: "/local/user-role-list",
        icon: "mdi:account-key",
        title: "User Role List",
      },
    ]
  },
  // {
  //   key: "rates",
  //   to: "/rates",
  //   title: "Rates",
  //   items: [
  //     {
  //       key: "dhl-domestic",
  //       to: "/rates/dhl-domestic",
  //       icon: "mdi:truck-delivery",
  //       title: "DHL Domestic Rates",
  //     },
  //     {
  //       key: "fedex-domestic",
  //       to: "/fedex-domestic",
  //       icon: "mdi:truck-fast",
  //       title: "FedEx Domestic",
  //     },
  //   ]
  // },
  // {
  //   key: "aftership",
  //   to: "/aftership",
  //   title: "Aftership",
  //   items: [
  //     {
  //       key: "aftership-labels",
  //       to: "/aftership",
  //       icon: "streamline:shipping-transfer-cart-package-box-fulfillment-cart-warehouse-shipping-delivery",
  //       title: "Labels",
  //     },
  //   ]
  // },
  // {
  //   key: "rate-calculator",
  //   title: "Rate Calculator",
  //   to: "/rate-calculator",
  //   items: [
  //     {
  //       key: "rate-calculator",
  //       to: "/rate-calculator",
  //       icon: "majesticons:calculator",
  //       title: "Rate Calculator",
  //     },      
  //   ],
  // },
  
];

export const sectionItemsWithTeams: SidebarItem[] = [
  ...sectionItems,
];

export const brandItems: SidebarItem[] = [
  {
    key: "overview",
    title: "Overview",
    items: [
      {
        key: "home",
        href: "#",
        icon: "solar:home-2-linear",
        title: "Home",
      },
      {
        key: "projects",
        href: "#",
        icon: "solar:widget-2-outline",
        title: "Projects",
        endContent: (
          <Icon
            className="text-primary-foreground/60"
            icon="solar:add-circle-line-duotone"
            width={24}
          />
        ),
      },
      {
        key: "tasks",
        href: "#",
        icon: "solar:checklist-minimalistic-outline",
        title: "Tasks",
        endContent: (
          <Icon
            className="text-primary-foreground/60"
            icon="solar:add-circle-line-duotone"
            width={24}
          />
        ),
      },
      {
        key: "team",
        href: "#",
        icon: "solar:users-group-two-rounded-outline",
        title: "Team",
      },
      {
        key: "tracker",
        href: "#",
        icon: "solar:sort-by-time-linear",
        title: "Tracker",
        endContent: (
          <Chip className="bg-primary-foreground text-primary font-medium" size="sm" variant="flat">
            New
          </Chip>
        ),
      },
    ],
  },
  {
    key: "your-teams",
    title: "Your Teams",
    items: [
      {
        key: "heroui",
        href: "#",
        title: "HeroUI",
        startContent: (
          <TeamAvatar
            classNames={{
              base: "border-1 border-primary-foreground/20",
              name: "text-primary-foreground/80",
            }}
            name="Hero UI"
          />
        ),
      },
      {
        key: "tailwind-variants",
        href: "#",
        title: "Tailwind Variants",
        startContent: (
          <TeamAvatar
            classNames={{
              base: "border-1 border-primary-foreground/20",
              name: "text-primary-foreground/80",
            }}
            name="Tailwind Variants"
          />
        ),
      },
      {
        key: "heroui-pro",
        href: "#",
        title: "HeroUI Pro",
        startContent: (
          <TeamAvatar
            classNames={{
              base: "border-1 border-primary-foreground/20",
              name: "text-primary-foreground/80",
            }}
            name="HeroUI Pro"
          />
        ),
      },
    ],
  },
];

export const sectionLongList: SidebarItem[] = [
  ...sectionItems,
  {
    key: "payments",
    title: "Payments",
    items: [
      {
        key: "payroll",
        href: "#",
        title: "Payroll",
        icon: "solar:dollar-minimalistic-linear",
      },
      {
        key: "invoices",
        href: "#",
        title: "Invoices",
        icon: "solar:file-text-linear",
      },
      {
        key: "billing",
        href: "#",
        title: "Billing",
        icon: "solar:card-outline",
      },
      {
        key: "payment-methods",
        href: "#",
        title: "Payment Methods",
        icon: "solar:wallet-money-outline",
      },
      {
        key: "payouts",
        href: "#",
        title: "Payouts",
        icon: "solar:card-transfer-outline",
      },
    ],
  },
  {
    key: "your-teams",
    title: "Your Teams",
    items: [
      {
        key: "heroui",
        href: "#",
        title: "HeroUI",
        startContent: <TeamAvatar name="Hero UI" />,
      },
      {
        key: "tailwind-variants",
        href: "#",
        title: "Tailwind Variants",
        startContent: <TeamAvatar name="Tailwind Variants" />,
      },
      {
        key: "heroui-pro",
        href: "#",
        title: "HeroUI Pro",
        startContent: <TeamAvatar name="HeroUI Pro" />,
      },
    ],
  },
];

export const sectionNestedItems: SidebarItem[] = [
  {
    key: "home",
    href: "#",
    icon: "solar:home-2-linear",
    title: "Home",
  },
  {
    key: "projects",
    href: "#",
    icon: "solar:widget-2-outline",
    title: "Projects",
    endContent: (
      <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
    ),
  },
  {
    key: "tasks",
    href: "#",
    icon: "solar:checklist-minimalistic-outline",
    title: "Tasks",
    endContent: (
      <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
    ),
  },
  {
    key: "team",
    href: "#",
    icon: "solar:users-group-two-rounded-outline",
    title: "Team",
  },
  {
    key: "tracker",
    href: "#",
    icon: "solar:sort-by-time-linear",
    title: "Tracker",
    endContent: (
      <Chip size="sm" variant="flat">
        New
      </Chip>
    ),
  },
  {
    key: "analytics",
    href: "#",
    icon: "solar:chart-outline",
    title: "Analytics",
  },
  {
    key: "perks",
    href: "#",
    icon: "solar:gift-linear",
    title: "Perks",
    endContent: (
      <Chip size="sm" variant="flat">
        3
      </Chip>
    ),
  },
  {
    key: "cap_table",
    title: "Cap Table",
    icon: "solar:pie-chart-2-outline",
    type: "nest",
    items: [
      {
        key: "shareholders",
        icon: "solar:users-group-rounded-linear",
        href: "#",
        title: "Shareholders",
      },
      {
        key: "note_holders",
        icon: "solar:notes-outline",
        href: "#",
        title: "Note Holders",
      },
      {
        key: "transactions_log",
        icon: "solar:clipboard-list-linear",
        href: "#",
        title: "Transactions Log",
      },
    ],
  },
  {
    key: "expenses",
    href: "#",
    icon: "solar:bill-list-outline",
    title: "Expenses",
  },
];
