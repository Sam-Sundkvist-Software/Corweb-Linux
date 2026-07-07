import React from "react";
import "./MenuBar.css";
import { MenuProps, MenuVariant } from "./Menu";

export interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactElement<MenuProps>[] | React.ReactElement<MenuProps>;
}

export default function MenuBar({ children, ...props }: MenuBarProps) {
	return (
		<div className="tlnx-menu-bar" {...props}>
			{React.Children.map(children, (child) => {
				if (React.isValidElement<MenuProps>(child)) {
					return React.cloneElement(child, {
						variant: MenuVariant.DOWN,
					})
				}

				return child;
			})}
		</div>
	);
}