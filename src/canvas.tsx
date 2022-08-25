import {gsap} from 'gsap';
import {MotionPathPlugin} from 'gsap/MotionPathPlugin';
import * as PIXI from 'pixi.js';
import {useRef, useState} from 'react';
import styled from 'styled-components';

import {drawPath, generateEvents, processEvents} from './functions';
import {Event, EventRemovalType, EventType, Filter} from './types';
import useEffectOnceDefined from './utils/useEffectOnceDefined';
import useSize from './utils/useSize';

gsap.registerPlugin(MotionPathPlugin);

const samplingRates = {
	type: {error: 0.1, performance: 0.9},
	release: {v1: 0.2, v2: 0.8},
	environment: {prod: 0.6, stage: 0.1, dev: 0.3},
};

const filters: Filter[] = [
	{
		name: 'sampleRate',
		conditions: [{property: 'type', value: EventType.Error}],
		removalType: EventRemovalType.Discarded,
		retentionRate: 0.5,
		x: 0.2,
		yActive: [0, 0.2],
	},
	{
		name: 'traceSampleRate',
		conditions: [{property: 'type', value: EventType.Performance}],
		removalType: EventRemovalType.Discarded,
		retentionRate: 0.2,
		x: 0.2,
		yActive: [0.3, 1],
	},
	{
		name: 'dynamicSampling',
		conditions: [
			{property: 'type', value: EventType.Performance},
			{property: 'release', value: 'v1'},
		],
		removalType: EventRemovalType.Dropped,
		retentionRate: 0.1,
		x: 0.6,
		yActive: [0.3, 0.4],
	},
];

const yEndBands: Parameters<typeof processEvents>[2] = {
	indexed: [0, 0.3],
	[EventRemovalType.Dropped]: [0.4, 0.5],
	[EventRemovalType.Discarded]: [0.6, 1],
};

const nEvents = 5000;
const animationDuration = 5;

const Canvas = () => {
	const wrapRef = useRef<HTMLDivElement>(null);
	const {width, height} = useSize(wrapRef);
	const [events, setEvents] = useState<Event[]>([]);

	useEffectOnceDefined(() => {
		if (!width || !height) return;

		const events = generateEvents(nEvents, samplingRates);
		const processedEvents = processEvents(events, filters, yEndBands);
		const eventsWithPath = processedEvents.map(event => ({
			...event,
			path: drawPath(
				event.anchorPoints?.map(p => ({...p, x: p.x * width, y: p.y * height})) ?? [],
				width / 10
			),
		}));

		setEvents(eventsWithPath);

		const app = new PIXI.Application({
			width,
			height,
			backgroundAlpha: 0,
			resolution: 2,
		});
		wrapRef.current?.appendChild(app.view);

		const timeline = gsap.timeline().pause();

		eventsWithPath.forEach((event, index) => {
			const startingPoint = event.anchorPoints[0];
			const frame = new PIXI.Graphics();
			frame.beginFill(event.type === 'error' ? 0xff5555 : 0x5555ff, 0.75);
			frame.drawCircle(startingPoint.x, startingPoint.y, 2);
			app.stage.addChild(frame);

			timeline.to(
				frame,
				{
					motionPath: {
						path: event.path,
					},
					duration: animationDuration,
					ease: 'power1.inOut',
					repeat: -1,
				},
				(index * animationDuration) / nEvents
			);

			return frame;
		});

		timeline.play();
	}, [width, height]);

	return (
		<Wrap ref={wrapRef}>
			<SVG viewBox={`0 0 ${width} ${height}`} style={{zIndex: 0}}>
				<g className="event-paths">
					{events.slice(0, 750).map((e, i) => (
						<path
							key={i}
							d={e.path}
							stroke={e.type === 'error' ? '#ff5555' : '#5555ff'}
						/>
					))}
				</g>
			</SVG>
			<SVG viewBox={`0 0 ${width} ${height}`} style={{zIndex: 2}}>
				<g className="filters">
					{width &&
						height &&
						filters.map(f => {
							const x = f.x * width;
							const y0 = f.yActive[0] * height;
							const y1 = f.yActive[1] * height;
							const yInflection =
								(f.yActive[0] + (f.yActive[1] - f.yActive[0]) * f.retentionRate) * height;

							const markOffset = 2;

							return (
								<g className="filter-group" id={`filter-${f.name}`}>
									<path
										className="filter-mark"
										d={`M ${x - markOffset} ${y0} h ${markOffset * 2}`}
									/>
									<path
										className="filter-line retained"
										d={`M ${x} ${y0} L ${x} ${yInflection}`}
									/>
									<path
										className="filter-mark"
										d={`M ${x - markOffset} ${yInflection} h ${markOffset * 2}`}
									/>
									<path
										className="filter-line removed"
										d={`M ${x} ${yInflection} L ${x} ${y1}`}
									/>
									<path
										className="filter-mark"
										d={`M ${x - markOffset} ${y1} h ${markOffset * 2}`}
									/>
								</g>
							);
						})}
				</g>
			</SVG>
		</Wrap>
	);
};

export default Canvas;

const Wrap = styled('div')`
	position: relative;
	width: 100%;
	height: 20rem;
	display: flex;

	canvas {
		z-index: 1;
	}
`;

const SVG = styled('svg')`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow: visible;

	fill: none;

	g.event-paths {
		stroke-opacity: 0.025;
	}

	path.filter-line {
		stroke: ${p => p.theme.subText};
		stroke-opacity: 0.75;
		stroke-width: 2;
		stroke-linecap: round;

		&.removed {
			stroke-dasharray: 6;
		}
	}
	path.filter-mark {
		stroke: ${p => p.theme.subText};
		stroke-opacity: 0.5;
		stroke-width: 2;
		stroke-linecap: round;
	}
`;
