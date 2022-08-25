import {AriaListBoxOptions, useListBox} from '@react-aria/listbox';
import {SelectState} from '@react-stately/select';
import {useRef} from 'react';
import styled from 'styled-components';

import Option from './option';
import Section from './section';

type ListBoxProps = AriaListBoxOptions<unknown> & {
  state: SelectState<unknown>;
  small?: boolean;
};

const ListBox = ({state, small = false, ...props}: ListBoxProps) => {
  const ref = useRef<HTMLUListElement>(null);
  const {listBoxProps} = useListBox(props, state, ref);

  return (
    <StyledListBox ref={ref} {...listBoxProps}>
      {[...state.collection].map(el => {
        if (el.type === 'section') {
          return <Section key={el.key} section={el} state={state} small={small} />;
        }
        return <Option key={el.key} item={el} state={state} small={small} />;
      })}
    </StyledListBox>
  );
};

export default ListBox;

const StyledListBox = styled.ul`
  padding: 0;
  margin: 0;
  min-width: 8rem;
  border-radius: ${p => p.theme.borderRadius};
  list-style-type: none;

  :focus {
    outline: none;
  }
  :focus-visible {
    outline: none;
  }
`;
