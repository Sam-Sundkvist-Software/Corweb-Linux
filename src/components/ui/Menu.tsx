import React, { useState } from "react";

export enum MenuVariant {
	DOWN = "down",
	RIGHT = "right",
}

export interface MenuProps {
	text: string;
	variant?: MenuVariant;
	children?: React.ReactElement<MenuProps>[] | React.ReactElement<MenuProps>;
}

export default function Menu({ text, variant, children }: MenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	// mouse click locks open
	const [isLocked, setIsLocked] = useState(false);

	const handleMouseEnter = () => {
		if (variant === MenuVariant.RIGHT) {
			setIsOpen(true);
		}
	};

	const handleMouseLeave = () => {
		setIsOpen(false);
	};

	const handleClick = (e: React.MouseEvent) => {
		if (e.target !== e.currentTarget) {
			return;
		}

		if (variant === MenuVariant.DOWN) {
			setIsOpen(!isOpen);
		}
	};

	return (
		<div
			className={`tlnx-menu ${variant || MenuVariant.RIGHT}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onClick={handleClick}
		>
			{text}

			{/* Render flyout menu when open */}
			{isOpen && children && (
				<div className={`tlnx-menu-flyout ${variant}`}>
					{React.Children.map(children, (child) => {
						return child;
					})}
				</div>
			)}
		</div>
	);
}