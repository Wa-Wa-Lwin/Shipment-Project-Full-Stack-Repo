import type { ReactNode } from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <NavbarBrand>
          <p className="font-bold text-inherit">Xeno Shipment</p>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <a color="foreground" href="#">
              Dashboard
            </a>
          </NavbarItem>
          <NavbarItem>
            <a color="foreground" href="#">
              Shipments
            </a>
          </NavbarItem>
          <NavbarItem>
            <a color="foreground" href="#">
              Reports
            </a>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <a href="#">Login</a>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
