import {
  Placement,
  UseFloatingProps,
  arrow,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react-dom';
import {FocusScope, FocusScopeProps} from '@react-aria/focus';
import {AriaOverlayProps, DismissButton, useOverlay} from '@react-aria/overlays';
import {
  CSSProperties,
  ForwardRefRenderFunction,
  ReactNode,
  forwardRef,
  useMemo,
  useState,
} from 'react';
import {Transition} from 'react-transition-group';
import styled from 'styled-components';

import {Theme} from '../theme';

type UsePopoverProps = AriaOverlayProps &
  UseFloatingProps & {
    placement?: Placement;
    offset?: number;
  };

export const usePopover = <TriggerType extends HTMLElement = HTMLElement>({
  isOpen,
  onClose,
  isDismissable = true,
  shouldCloseOnBlur = false,
  isKeyboardDismissDisabled = false,
  placement = 'left',
  strategy = 'absolute',
  offset: mainOffset = 4,
  ...props
}: UsePopoverProps) => {
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);

  const middleware = useMemo(
    () => [
      shift({padding: 16}),
      flip(),
      offset(mainOffset),
      ...(arrowElement ? [arrow({element: arrowElement, padding: 20})] : []),
    ],
    [mainOffset, arrowElement]
  );

  const {
    x,
    y,
    refs,
    reference,
    floating,
    placement: calculatedPlacement,
    middlewareData: {arrow: {x: arrowX, y: arrowY} = {}},
  } = useFloating<TriggerType>({
    placement,
    strategy,
    middleware,
    ...props,
  });

  const {overlayProps} = useOverlay(
    {
      isOpen,
      onClose,
      isDismissable,
      shouldCloseOnBlur,
      isKeyboardDismissDisabled,
    },
    refs.floating
  );

  return {
    refs: {trigger: refs.reference, popover: refs.floating},
    triggerProps: {
      ref: reference,
    },
    popoverProps: {
      ref: floating,
      refObject: refs.floating,
      style: {position: strategy, top: y, left: x},
      arrowStyles: {top: arrowY, left: arrowX},
      placement: calculatedPlacement,
      ...overlayProps,
    },
    arrowProps: {
      ref: setArrowElement,
      style: {top: arrowY, left: arrowX},
      placement: calculatedPlacement,
    },
  };
};

type Props = FocusScopeProps & {
  isOpen: boolean;
  onClose: () => void;
  arrowStyles?: CSSProperties;
  placement?: Placement;
  animateScale?: boolean;
  className?: string;
  children?: ReactNode;
};

const Popover: ForwardRefRenderFunction<HTMLDivElement, Props> = (
  {
    isOpen,
    onClose,
    placement,
    autoFocus = true,
    restoreFocus = true,
    contain = true,
    animateScale = false,
    arrowStyles = {},
    children,
    className,
    ...props
  },
  ref
) => {
  return (
    <Transition in={isOpen} timeout={200} unmountOnExit mountOnEnter>
      {animationState => (
        <FocusScope autoFocus={autoFocus} restoreFocus={restoreFocus} contain={contain}>
          <Wrap
            {...props}
            placement={placement}
            className={`${animationState} ${className ?? ''}`}
            animateScale={animateScale}
            arrowStyles={arrowStyles}
            ref={ref}
          >
            {children}
            <DismissButton onDismiss={onClose} />
          </Wrap>
        </FocusScope>
      )}
    </Transition>
  );
};

export default forwardRef(Popover);

type WrapProps = {
  placement?: Placement;
  animateScale: boolean;
  arrowStyles: CSSProperties;
};

const getTransform = ({
  animateScale,
  placement,
  arrowStyles,
  theme,
}: WrapProps & {theme: Theme}) => {
  const scaleTerm = animateScale ? 'scale(0.8)' : '';

  switch (placement?.split('-')[0]) {
    case 'top':
      return `
        transform-origin: ${arrowStyles.left ?? 0}px 100%;
        transform: translate3d(0, ${theme.space[2]}, 0) ${scaleTerm};
      `;
    case 'bottom':
      return `
        transform-origin: ${arrowStyles.left ?? 0}px 0%;
        transform: translate3d(0, -${theme.space[2]}, 0) ${scaleTerm};
      `;
    case 'left':
      return `
        transform-origin: 100% ${arrowStyles.top ?? 0}px;
        transform: translate3d(${theme.space[2]}, 0, 0) ${scaleTerm};
      `;
    case 'right':
      return `
        transform-origin: 0% ${arrowStyles.top ?? 0}px;
        transform: translate3d(-${theme.space[2]}, 0, 0) ${scaleTerm};
      `;
    default:
      return '';
  }
};

const Wrap = styled.div<WrapProps>`
  position: absolute;
  max-width: calc(100vw - 32px);
  background: ${p => p.theme.backgroundElevated};
  border-radius: ${p => p.theme.borderRadius};
  padding: ${p => p.theme.space[0]};
  box-shadow: 0 0 0 1px ${p => p.theme.border}, ${p => p.theme.dropShadowHeavy};
  transition: transform ${p => p.theme.animation.fastOut},
    opacity ${p => p.theme.animation.fastOut};
  opacity: 0;
  z-index: 1000;

  ${getTransform}

  &.entering,
  &.entered {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }

  &.exiting {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(1);
  }

  @media (prefers-reduced-motion) {
    transition: opacity ${p => p.theme.animation.fastOut};
  }
`;
