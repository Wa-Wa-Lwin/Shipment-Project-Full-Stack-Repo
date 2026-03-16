import { useMatches, type UIMatch } from "react-router-dom";
import { Link } from "react-router-dom";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Button } from "@heroui/react";
import { useBreadcrumb, type ActiveButtonType } from "@context/BreadcrumbContext";

type BreadcrumbHandle = {
  breadcrumb?: string | ((match: UIMatch<unknown, unknown>) => string);
};

const Breadcrumb = () => {
  const matches = useMatches() as (UIMatch<unknown, unknown> & {
    handle: BreadcrumbHandle;
  })[];

  const { activeButton, setActiveButton, activeButtons } = useBreadcrumb();

  return (
    <Breadcrumbs size="lg">
      {matches
        .filter((m) => m.handle?.breadcrumb)
        .map((m, i, arr) => {
          const isLast = i === arr.length - 1;
          const label =
            typeof m.handle.breadcrumb === "function"
              ? m.handle.breadcrumb(m)
              : m.handle.breadcrumb;

          return (
            <BreadcrumbItem key={m.pathname} isCurrent={isLast}>
              {isLast ? (
                label === "Shipment" ? (                  
                  <div className="flex gap-3 justify-between items-center">
                    {/* <Link to={m.pathname}>{label}</Link> */}
                    {activeButtons.map((btn: ActiveButtonType) => (
                      <>                      
                      <Button
                        key={btn}
                        onClick={() => setActiveButton(btn)}
                        className={`transition-opacity ${
                          activeButton && activeButton !== btn
                            ? "opacity-40"
                            : "opacity-100"
                        } h-12 w-36 text-md`}
                        variant={activeButton === btn ? "bordered" : "ghost"}
                        color={activeButton === btn ? "primary" : "default"}
                      >
                        {btn}
                      </Button>
                      </>                      
                    ))}
                  </div>
                ) : (
                  <span>{label}</span>
                )
              ) : (
                <Link to={m.pathname}>{label}</Link>
              )}
            </BreadcrumbItem>
          );
        })}
    </Breadcrumbs>
  );
};

export default Breadcrumb;
