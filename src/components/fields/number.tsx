import {useLocale} from '@react-aria/i18n';
import {useNumberField} from '@react-aria/numberfield';
import {NumberFieldStateOptions, useNumberFieldState} from '@react-stately/numberfield';
import {AriaNumberFieldProps} from '@react-types/numberfield';
import {useRef} from 'react';
import styled from 'styled-components';

import IconChevronDown from '../../icons/chevronDown';
import IconChevronUp from '../../icons/chevronUp';
import Button from '../button';
import Field, {FieldProps} from './field';

type Props = FieldProps &
	AriaNumberFieldProps &
	Omit<NumberFieldStateOptions, 'locale'> & {
		inputWidth?: string;
		small?: boolean;
		className?: string;
	};

const TextInput = ({
	className,
	rowLayout,
	inputWidth,
	small = false,
	isDisabled = false,
	...props
}: Props) => {
	const {label, description} = props;
	const {locale} = useLocale();
	const inputRef = useRef<HTMLInputElement>(null);
	const incrRef = useRef<HTMLButtonElement>(null);
	const decRef = useRef<HTMLButtonElement>(null);

	const state = useNumberFieldState({...props, locale});
	const {
		labelProps,
		descriptionProps,
		groupProps,
		inputProps,
		incrementButtonProps,
		decrementButtonProps,
	} = useNumberField({...props, isDisabled}, state, inputRef);

	return (
		<Field
			label={label}
			labelProps={labelProps}
			description={description}
			descriptionProps={descriptionProps}
			rowLayout={rowLayout}
			small={small}
			isDisabled={isDisabled}
			className={className}
		>
			<Group {...groupProps}>
				<Input ref={inputRef} small={small} displayWidth={inputWidth} {...inputProps} />
				<IncDecWrap>
					<IncDecButton ref={incrRef} {...incrementButtonProps}>
						<IconChevronUp size="xs" />
					</IncDecButton>
					<IncDecButton ref={decRef} {...decrementButtonProps}>
						<IconChevronDown size="xs" />
					</IncDecButton>
				</IncDecWrap>
			</Group>
		</Field>
	);
};

export default TextInput;

const Group = styled.div`
	position: relative;
`;

const IncDecWrap = styled.div`
	position: absolute;
	right: 1px;
	top: 50%;
	transform: translateY(-50%);
	height: calc(100% - 2px);
	display: flex;
	flex-direction: column;
	justify-content: center;
	border-left: solid 1px ${p => p.theme.border};
`;

const IncDecButton = styled(Button)`
	height: 50%;
	padding: 0;
	margin: 0;
	background: ${p => p.theme.background};
	border-radius: 0;
	:not(:first-child) {
		border-top: solid 1px ${p => p.theme.border};
	}
	:first-child {
		border-top-right-radius: calc(${p => p.theme.borderRadius} - 1px);
	}
	:last-child {
		border-bottom-right-radius: calc(${p => p.theme.borderRadius} - 1px);
	}
`;

const Input = styled.input<{small: boolean; displayWidth?: string}>`
	appearance: none;
	background: ${p => p.theme.backgroundSecondary};
	border-radius: ${p => p.theme.borderRadius};
	border: solid 1px ${p => p.theme.border};
	padding: ${p =>
		p.small
			? `${p.theme.space[0]} ${p.theme.space[1]}`
			: `${p.theme.space[0.5]} ${p.theme.space[0.75]}`};
	padding-right: ${p => p.theme.space[3]};

	${p => p.displayWidth && `width: ${p.displayWidth}`}
`;
