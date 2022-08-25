import {AriaTextFieldOptions, useTextField} from '@react-aria/textfield';
import {useRef} from 'react';
import styled from 'styled-components';

import Field, {FieldProps} from './field';

type Props = FieldProps &
	AriaTextFieldOptions<'input'> & {
		small?: boolean;
		inputWidth?: string;
		className?: string;
	};

const TextInput = ({
	className,
	rowLayout,
	inputWidth,
	small = false,
	...props
}: Props) => {
	const {label, description} = props;
	const ref = useRef<HTMLInputElement>(null);

	const {labelProps, descriptionProps, inputProps} = useTextField(props, ref);

	return (
		<Field
			label={label}
			labelProps={labelProps}
			description={description}
			descriptionProps={descriptionProps}
			rowLayout={rowLayout}
			small={small}
			className={className}
		>
			<Input ref={ref} small={small} displayWidth={inputWidth} {...inputProps} />
		</Field>
	);
};

export default TextInput;

const Input = styled.input<{small: boolean; displayWidth?: string}>`
	appearance: none;
	background: ${p => p.theme.backgroundSecondary};
	border-radius: ${p => p.theme.borderRadius};
	border: solid 1px ${p => p.theme.border};
	padding: ${p =>
		p.small
			? `${p.theme.space[0]} ${p.theme.space[1]}`
			: `${p.theme.space[0.75]} ${p.theme.space[1]}`};

	${p => p.displayWidth && `width: ${p.displayWidth}`}
`;
