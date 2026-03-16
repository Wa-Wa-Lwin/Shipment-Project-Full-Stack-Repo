
import { createBrowserRouter, Navigate } from "react-router-dom";
// import { Suspense, lazy } from "react";

import Home from "@pages/home/Home"
import LoginPage from "@pages/login/Login"
import Shipment from "@pages/shipment/Shipment"
import ShipmentDetails from "@pages/shipment/components/ShipmentDetails"
import ShipmentDuplicateForm from "@pages/shipment/components/ShipmentDuplicateForm"
import ShipmentEditForm from "@pages/shipment/components/ShipmentEditForm"
import InvoiceView from "@pages/shipment/components/InvoiceView"
import PackingSlipView from "@pages/shipment/components/PackingSlipView"
import Overview from "@features/overview/Overview"
import Logistics from "@features/logistics/Logistics"
import ProtectedRoute from "@components/common/ProtectedRoute";
import WarehouseOnlyRoute from "@components/common/WarehouseOnlyRoute";
import Items from "@pages/items/Items";
import Addresses from "@pages/addresses/Addresses";
// import RateCalculator from "@pages/rate-calculator/RateCalculator";
import Dashboard from "@pages/dashboard/Dashboard";
import TestingData from "@features/testingdata/TestingData";
import AddressList from "@pages/address-list/AddressList";
import AddressListDetail from "@pages/address-list/AddressDetail";
import Aftership from "@pages/aftership/Aftership";
import AftershipDetail from "@pages/aftership/AftershipDetail";
import UserList from "@pages/user-list/UserList";
import UserDetail from "@pages/user-list/UserDetail";
import CreateUser from "@pages/user-list/CreateUser";
import EditUser from "@pages/user-list/EditUser";
import ShipmentForm from "@pages/shipment/components/ShipmentForm";
import DHLDomesticRates from "@pages/dhl-domestic-rates/DHLDomesticRates";
import Warehouse from "@pages/warehouse/Warehouse";
import WarehouseShipmentDetail from "@pages/warehouse/components/WarehouseShipmentDetail";
import FedExDomestic from "@pages/fedex-domestic/FedExDomestic";
import FedExDomesticDetail from "@pages/fedex-domestic/FedExDomesticDetail";
import ParcelBoxTypes from "@pages/parcel-box-types/ParcelBoxTypes";
import ParcelBoxTypeDetail from "@pages/parcel-box-types/ParcelBoxTypeDetail";
import UserRoleList from "@pages/user-role-list/UserRoleList";
import UserRoleListDetail from "@pages/user-role-list/UserRoleListDetail";


export const routes = [
  {
    path: "login", element: <LoginPage />, handle: { breadcrumb: "Login" },
  },
  {
    element: <ProtectedRoute><Home /></ProtectedRoute>,
    children: [
      { path: "overview", element: <WarehouseOnlyRoute><Overview /></WarehouseOnlyRoute>, handle: { breadcrumb: "Overview" } },
      { path: "user-approver-data", element: <WarehouseOnlyRoute><TestingData /></WarehouseOnlyRoute>, handle: { breadcrumb: "User & Approver Data" } },
      { path: "logistics/:category?", element: <WarehouseOnlyRoute><Logistics /></WarehouseOnlyRoute>, handle: { breadcrumb: "Logistics" } },
      { path: "shipment",
        handle: { breadcrumb: "Shipment" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><Shipment /></WarehouseOnlyRoute>,
          },
          {
            path: "request-form",
            element: <WarehouseOnlyRoute><ShipmentForm /></WarehouseOnlyRoute>,
            handle: { breadcrumb: "New Request Form" },
          },
          {
            path: "duplicate/:shipmentId",
            element: <WarehouseOnlyRoute><ShipmentDuplicateForm /></WarehouseOnlyRoute>,
            handle: { breadcrumb: "Duplicate Request" },
          },
          {
            path: "edit/:shipmentId",
            element: <WarehouseOnlyRoute><ShipmentEditForm /></WarehouseOnlyRoute>,
            handle: { breadcrumb: "Edit" },
          },
          { path: ":shipmentId",
            element: <WarehouseOnlyRoute><ShipmentDetails /></WarehouseOnlyRoute>,
            handle: { breadcrumb: (match: any) => match.params.shipmentId }
          },
          { path: "invoice/:shipmentId",
            element: <WarehouseOnlyRoute><InvoiceView /></WarehouseOnlyRoute>,
            handle: { breadcrumb: "Invoice" }
          },
          { path: "packing-slip/:shipmentId",
            element: <PackingSlipView />,
            handle: { breadcrumb: "Packing Slip" }
          },
        ]
      },
      { path: "items",
        handle: { breadcrumb: "Items" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><Items /></WarehouseOnlyRoute>,
          },
        ]
      },
      { path: "addresses",
        handle: { breadcrumb: "Addresses" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><Addresses /></WarehouseOnlyRoute>,
          },
        ]
      },
      // { path: "rate-calculator",
      //   handle: { breadcrumb: "Rate Calculator" },
      //   children:[
      //     {
      //       path: "",
      //       element: <RateCalculator />,
      //     },
      //   ]
      // },
      { path: "local/address-list",
        handle: { breadcrumb: "Address List" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><AddressList /></WarehouseOnlyRoute>,
          },
          {
            path: ":id",
            element: <WarehouseOnlyRoute><AddressListDetail /></WarehouseOnlyRoute>,
            handle: { breadcrumb: (match: any) => match.params.id }
          },
        ]
      },
      { path: "local/parcel-box-types",
        handle: { breadcrumb: "Parcel Box Types" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><ParcelBoxTypes /></WarehouseOnlyRoute>,
          },
          {
            path: ":id",
            element: <WarehouseOnlyRoute><ParcelBoxTypeDetail /></WarehouseOnlyRoute>,
            handle: { breadcrumb: (match: any) => match.params.id }
          },
        ]
      },
      { path: "local/user-role-list",
        handle: { breadcrumb: "User Role List" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><UserRoleList /></WarehouseOnlyRoute>,
          },
          {
            path: ":id",
            element: <WarehouseOnlyRoute><UserRoleListDetail /></WarehouseOnlyRoute>,
            handle: { breadcrumb: (match: any) => match.params.id }
          },
        ]
      },
      { path: "dashboard",
        handle: { breadcrumb: "Dashboard" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><Dashboard /></WarehouseOnlyRoute>,
          },
        ]
      },
      { path: "aftership",
        handle: { breadcrumb: "Aftership" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><Aftership /></WarehouseOnlyRoute>,
          },
          {
            path: ":id",
            element: <WarehouseOnlyRoute><AftershipDetail /></WarehouseOnlyRoute>,
            handle: { breadcrumb: (match: any) => match.params.id }
          },
        ]
      },
      { path: "user-list",
        handle: { breadcrumb: "User Management" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><UserList /></WarehouseOnlyRoute>,
          },
          {
            path: "create",
            element: <WarehouseOnlyRoute><CreateUser /></WarehouseOnlyRoute>,
            handle: { breadcrumb: "Create User" }
          },
          {
            path: ":id",
            element: <WarehouseOnlyRoute><UserDetail /></WarehouseOnlyRoute>,
            handle: { breadcrumb: (match: any) => match.params.id }
          },
          {
            path: ":id/edit",
            element: <WarehouseOnlyRoute><EditUser /></WarehouseOnlyRoute>,
            handle: { breadcrumb: "Edit" }
          },
        ]
      },
      { path: "rates/dhl-domestic",
        handle: { breadcrumb: "DHL Domestic Rates" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><DHLDomesticRates /></WarehouseOnlyRoute>,
          },
        ]
      },
      { path: "warehouse",
        handle: { breadcrumb: "Warehouse" },
        children:[
          {
            path: "",
            element: <Warehouse />,
          },
          {
            path: ":id",
            element: <WarehouseShipmentDetail />,
            handle: { breadcrumb: (match: any) => `Shipment ${match.params.id}` }
          },
        ]
      },
      { path: "fedex-domestic",
        handle: { breadcrumb: "FedEx Domestic" },
        children:[
          {
            path: "",
            element: <WarehouseOnlyRoute><FedExDomestic /></WarehouseOnlyRoute>,
          },
          {
            path: ":id",
            element: <WarehouseOnlyRoute><FedExDomesticDetail /></WarehouseOnlyRoute>,
            handle: { breadcrumb: (match: any) => `Shipment ${match.params.id}` }
          },
        ]
      },
    ],
  },
  {
    path: "*", element: <Navigate to="/login" replace />,
  }
];


export const Router = createBrowserRouter(routes, {
  basename: "/xeno-shipment"
});
