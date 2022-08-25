import {AriaOptionProps, useOption} from '@react-aria/listbox';
import {SelectState} from '@react-stately/select';
import {Node} from '@react-types/shared';
import {useRef} from 'react';
import styled from 'styled-components';

import IconDone from '../../icons/done';
import StateLayer from '../stateLayer';

type Props = AriaOptionProps & {
  item: Node<unknown>;
  state: SelectState<unknown>;
  small: boolean;
};

const Option = (props: Props) => {
  const ref = useRef<HTMLLIElement>(null);
  const {item, state, small} = props;
  const {optionProps, isSelected, isFocused, isDisabled} = useOption(
    {key: item.key},
    state,
    ref
  );

  return (
    <Wrap
      {...optionProps}
      isSelected={isSelected}
      isDisabled={isDisabled}
      small={small}
      ref={ref}
    >
      <StateLayer isHovered={isFocused} opacityFactor={isSelected ? 1.4 : 1} />
      <CheckIndent aria-hidden="true" visible={isSelected}>
        <IconDone />
      </CheckIndent>
      <Label>{item.rendered}</Label>
    </Wrap>
  );
};

export default Option;

const Wrap = styled.li<{
  isSelected: boolean;
  isDisabled: boolean;
  small: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;

  padding: ${p =>
    p.small
      ? `${p.theme.space[0]} ${p.theme.space[1]}`
      : `${p.theme.space[1]} ${p.theme.space[2]}`};
  padding-left: ${p => p.theme.space[1]};
  border-radius: ${p => p.theme.borderRadius};
  outline: none;
  white-space: nowrap;
  cursor: pointer;
  transition: ${p => p.theme.utils.defaultTransitions}, background-color 0s,
    color ${p => p.theme.animation.mediumIn};

  && {
    margin: 0;
  }

  ${p => p.isSelected && `color: ${p.theme.activeText};`}
`;

const CheckIndent = styled.div<{visible: boolean}>`
  ${p => p.theme.utils.flexCenter};
  width: 1.2rem;
  height: 1.2rem;
  margin-right: ${p => p.theme.space[0]};
  opacity: 0;
  transition: opacity ${p => p.theme.animation.mediumIn};

  ${p => p.visible && `opacity:100%;`};
`;

const Label = styled.span``;
