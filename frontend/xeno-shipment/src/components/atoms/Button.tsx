import React, { forwardRef } from "react";
import { cn, Button as NextUIButton } from "@heroui/react";

const Button = forwardRef<
	HTMLButtonElement,
	React.ComponentProps<typeof NextUIButton>
>(({ className, children, ...props }, ref) => {
	return (
		<NextUIButton
			ref={ref}
			radius={props.radius || "md"}
			className={cn(
				"",
				className
			)}
			{...props}
		>
			{children}
		</NextUIButton>
	);
});

export default Button;