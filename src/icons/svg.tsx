import {ReactNode} from 'react';
import styled from 'styled-components';

import {ColorOrAlias} from '../theme';

type ColorProp = ColorOrAlias | 'currentColor';

type IconSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export type IconProps = {
	size?: IconSize;
	color?: ColorProp;
	className?: string;
	useAlt?: boolean;
};

type Props = IconProps & {
	alt: string;
	children: ReactNode;
};

const sizes: Record<IconSize, string> = {
	xs: '14px',
	s: '16px',
	m: '18px',
	l: '20px',
	xl: '22px',
};

const SVG = ({
	size = 'm',
	color = 'currentColor',
	className,
	alt,
	useAlt = false,
	children,
}: Props) => {
	return (
		<StyledSVG
			xmlns="http://www.w3.org/2000/svg"
			width={sizes[size]}
			height={sizes[size]}
			viewBox="0 0 24 24"
			className={className}
			$color={color}
			{...(useAlt && {alt})}
		>
			{children}
		</StyledSVG>
	);
};

export default SVG;

const StyledSVG = styled.svg<{$color: ColorProp}>`
	fill: ${p =>
		p.$color && (p.$color === 'currentColor' ? 'currentColor' : p.theme[p.$color])};
	transition: color ${p => p.theme.animation.vFastOut};

	path {
		transition: color ${p => p.theme.animation.vFastOut};
	}
`;
