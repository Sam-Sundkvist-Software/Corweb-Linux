export interface ListBoxItemProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export default function ListBoxItem({ children, ...props }: ListBoxItemProps) {
	return (
		<div {...props}>
			{children}
		</div>
	);
}