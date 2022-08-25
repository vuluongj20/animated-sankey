import {HTMLAttributes, ReactNode} from 'react';
import styled from 'styled-components';

import isDefined from '../../utils/isDefined';

export type FieldProps = {
	label?: React.ReactNode;
	description?: string;
	rowLayout?: boolean;
	small?: boolean;
	isDisabled?: boolean;
};

type Props = FieldProps & {
	labelProps?: HTMLAttributes<HTMLLabelElement>;
	descriptionProps?: HTMLAttributes<HTMLParagraphElement>;
	className?: string;
	children?: ReactNode;
};

const Field = ({
	label,
	labelProps = {},
	description,
	descriptionProps = {},
	rowLayout = false,
	small = false,
	className,
	isDisabled,
	children,
}: Props) => {
	return (
		<Wrap className={className} rowLayout={rowLayout} small={small}>
			{isDefined(label) && (
				<Label rowLayout={rowLayout} isDisabled={isDisabled} {...labelProps}>
					{label}
				</Label>
			)}
			{isDefined(description) && (
				<Description rowLayout={rowLayout} {...descriptionProps}>
					{description}
				</Description>
			)}
			<InputWrap rowLayout={rowLayout}>{children}</InputWrap>
		</Wrap>
	);
};

export default Field;

const Wrap = styled.div<{rowLayout: boolean; small: boolean}>`
	${p =>
		p.rowLayout
			? `
					display: grid;
					grid-column-gap: ${p.theme.space[2]};
					grid-row-gap: ${p.theme.space[0]};
					grid-template-columns: 1fr max-content;
					align-items: center;
					justify-items: end;
					padding: ${p.theme.space[2]} 0;

					:not(:last-child) {
						border-bottom: solid 1px ${p.theme.innerBorder};
					}
			`
			: `
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					padding: ${p.theme.space[1]} 0;
				`}
`;

const Label = styled.label<{rowLayout: boolean; isDisabled?: boolean}>`
	justify-self: start;
	margin-bottom: ${p => p.theme.space[0.25]};

	${p =>
		!p.rowLayout &&
		`
		display: block; 
		margin-bottom: ${p.theme.space[0]};
	`}

	${p => p.isDisabled && `color: ${p.theme.subText};`}
`;

const Description = styled.small<{rowLayout: boolean}>`
	grid-row: 2;
	justify-self: start;

	font-size: ${p => p.theme.fontSizeSmall};
	color: ${p => p.theme.subText};

	${p =>
		!p.rowLayout &&
		`
		display: block; 
		margin-bottom: ${p.theme.space[0]};
	`}
`;

const InputWrap = styled.div<{rowLayout: boolean}>`
	${p =>
		p.rowLayout &&
		`
			height: 0;
			display: flex;
			align-items: center;
		`};
`;
