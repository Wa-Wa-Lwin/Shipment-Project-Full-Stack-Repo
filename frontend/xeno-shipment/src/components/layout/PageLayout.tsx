import { cn } from "@heroui/react";

const PageLayout = ({ className, children }:any) => {
  return (
    <div  className={cn(
        "flex flex-col bg-background-50 p-6", // default layout styles
        className
      )} >
      {children}
    </div>
  )
}

export default PageLayout