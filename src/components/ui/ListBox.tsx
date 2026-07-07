import React from "react";
import { ListBoxItemProps } from "./ListBoxItem";

export interface ListBoxProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactElement<ListBoxItemProps>[] | React.ReactElement<ListBoxItemProps>;
}

export default function ListBox({ children, ...props }: ListBoxProps) {
	return (
		<div {...props} className="tlnx-listbox">
			{React.Children.map(children, (child) => {
				return child;
			})}
		</div>
	);
}