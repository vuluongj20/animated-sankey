import {AriaSelectOptions, HiddenSelect, useSelect} from '@react-aria/select';
import {mergeProps} from '@react-aria/utils';
import {Item, Section} from '@react-stately/collections';
import {useSelectState} from '@react-stately/select';
import {ComponentProps, Fragment, Key, useCallback} from 'react';
import styled from 'styled-components';

import isDefined from '../../utils/isDefined';
import Button from '../button';
import ListBox from '../listBox';
import Popover, {usePopover} from '../popover';
import Field, {FieldProps} from './field';

type BaseProps = AriaSelectOptions<object> &
	FieldProps & {
		className?: string;
		showDialogOnMobile?: boolean;
		popoverProps?: Partial<ComponentProps<typeof Popover>>;
	};

const BaseSelect = ({
	className,
	rowLayout,
	small = false,
	showDialogOnMobile = false,
	...props
}: BaseProps) => {
	const {label, name} = props;

	const state = useSelectState(props);

	const {refs, triggerProps, popoverProps} = usePopover<HTMLButtonElement>({
		placement: rowLayout ? 'bottom-end' : 'bottom-start',
		isOpen: state.isOpen,
		onClose: () => state.close(),
	});

	const {
		triggerProps: selectTriggerProps,
		valueProps,
		menuProps,
		labelProps,
	} = useSelect(props, state, refs.trigger);

	const renderTrigger = useCallback(() => {
		return (
			<StyledButton
				small={small}
				showBorder={isDefined(label)}
				showExpandIcon
				{...mergeProps(triggerProps, selectTriggerProps, valueProps)}
			>
				{state.selectedItem ? state.selectedItem.rendered : 'Select an option'}
			</StyledButton>
		);
	}, [triggerProps, selectTriggerProps, small, valueProps, label, state.selectedItem]);

	const renderContent = useCallback(
		() => (
			<ListBox state={state} label={label} small={small} shouldFocusWrap {...menuProps} />
		),
		[label, menuProps, small, state]
	);

	return (
		<Field
			label={label}
			labelProps={labelProps}
			rowLayout={rowLayout}
			small={small}
			className={className}
		>
			<HiddenSelect state={state} triggerRef={refs.trigger} label={label} name={name} />
			<Fragment>
				{renderTrigger()}
				<Popover isOpen={state.isOpen} onClose={() => state.close()} {...popoverProps}>
					{renderContent()}
				</Popover>
			</Fragment>
		</Field>
	);
};

type SelectItem = {value: Key; label: string};
type SelectSection = {title: string; options: SelectItem[]};

type Props = Omit<
	BaseProps,
	'children' | 'selectedKey' | 'defaultSelectedKey' | 'onSelectionChange'
> & {
	options: (SelectItem | SelectSection)[];
	value?: BaseProps['selectedKey'];
	defaultValue?: BaseProps['defaultSelectedKey'];
	onChange?: BaseProps['onSelectionChange'];
};

const isSection = (el: SelectItem | SelectSection): el is SelectSection =>
	isDefined((el as SelectSection).title) && Array.isArray((el as SelectSection).options);

/**
 * Select component with simpler prop names: options, value, default value,
 * and onChange.
 */
const Select = ({options, value, defaultValue, onChange, ...props}: Props) => (
	<BaseSelect
		selectedKey={value}
		defaultSelectedKey={defaultValue}
		onSelectionChange={onChange}
		{...props}
	>
		{options.map(el => {
			if (isSection(el)) {
				return (
					<Section key={el.title} title={el.title}>
						{el.options.map(c => (
							<Item key={c.value}>{c.label}</Item>
						))}
					</Section>
				);
			}
			return <Item key={el.value}>{el.label}</Item>;
		})}
	</BaseSelect>
);

export default Select;

const StyledButton = styled(Button)`
	font-weight: 400;
`;
