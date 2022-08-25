import {gsap} from 'gsap';
import {MotionPathPlugin} from 'gsap/MotionPathPlugin';
import * as PIXI from 'pixi.js';
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import styled from 'styled-components';

import Button from './components/button';
import {anchorsToProgress, drawPath, generateEvents, processEvents} from './functions';
import {Environment, Event, EventRemovalType, EventType, Filter, Release} from './types';
import useEffectOnceDefined from './utils/useEffectOnceDefined';
import useSize from './utils/useSize';

gsap.registerPlugin(MotionPathPlugin);

const nEvents = 5000;
const animationDuration = 5;

type CanvasProps = {
	population: Record<EventType, number>;
	filterRates: Record<string, number>;
	inboundFilterRate: number;
};

const Canvas = ({population, filterRates, inboundFilterRate}: CanvasProps) => {
	const wrapRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const timeline = useRef<gsap.core.Timeline>();
	const {width, height} = useSize(wrapRef);
	const [events, setEvents] = useState<Event[]>([]);
	const [isStale, setIsStale] = useState(false);

	// On mount
	useEffectOnceDefined(() => {
		initialize();
	}, [width, height]);

	// On population update
	useEffect(() => {
		if (events.length === 0) return;
		setIsStale(true);
		setTimeout(() => timeline.current?.pause(), 500);
	}, [population, filterRates]);

	// On restart
	function restart() {
		setIsStale(false);
		initialize();
	}

	const populationRates = useMemo(() => {
		const populationSum = population.error + population.performance;
		return {
			type: {
				error: population.error / populationSum,
				performance: population.performance / populationSum,
			},
			release: {v1: 0.4, v2: 0.6},
			environment: {prod: 0.8, stage: 0.2},
		};
	}, [population]);

	const filters = useMemo<Filter[]>(() => {
		const errorRatio = populationRates.type.error;
		const ya: Record<string, [number, number]> = {};

		ya.sampleRate = [0, 0.9 * errorRatio];
		ya.traceSampleRate = [ya.sampleRate[1] + 0.1, 1];

		ya.inboundFilterError = [0, ya.sampleRate[1] * filterRates.sampleRate];
		ya.inboundFilterPerformance = [
			ya.sampleRate[1] * filterRates.sampleRate,
			(ya.traceSampleRate[1] - ya.traceSampleRate[0]) * filterRates.traceSampleRate,
		];

		ya.serverPerformance = [
			0.2,
			0.2 + (ya.traceSampleRate[1] - ya.traceSampleRate[0]) * filterRates.traceSampleRate,
		];
		ya.serverReleaseV1 = [
			ya.serverPerformance[0] - 0.01,
			ya.serverPerformance[0] -
				0.01 +
				(ya.serverPerformance[1] - ya.serverPerformance[0]) *
					filterRates.serverPerformance,
		];
		ya.serverReleaseV2 = [
			ya.serverReleaseV1[0] - 0.01,
			ya.serverReleaseV1[0] -
				0.01 +
				(ya.serverReleaseV1[1] - ya.serverReleaseV1[0]) * filterRates.serverReleaseV1,
		];
		ya.serverEnvironmentProd = [
			ya.serverReleaseV2[0] - 0.01,
			ya.serverReleaseV2[0] -
				0.01 +
				(ya.serverReleaseV2[1] - ya.serverReleaseV2[0]) * filterRates.serverReleaseV2,
		];
		ya.serverEnvironmentStage = [
			ya.serverEnvironmentProd[0] - 0.01,
			ya.serverEnvironmentProd[0] -
				0.01 +
				(ya.serverEnvironmentProd[1] - ya.serverEnvironmentProd[0]) *
					filterRates.serverEnvironmentProd,
		];

		return [
			{
				name: 'sampleRate',
				conditions: [{property: 'type', value: EventType.Error}],
				removalType: EventRemovalType.Discarded,
				retentionRate: filterRates.sampleRate,
				x: 0.25,
				yActive: ya.sampleRate,
			},
			{
				name: 'traceSampleRate',
				conditions: [{property: 'type', value: EventType.Performance}],
				removalType: EventRemovalType.Discarded,
				retentionRate: filterRates.traceSampleRate,
				x: 0.25,
				yActive: ya.traceSampleRate,
			},
			{
				name: 'inboundFilterError',
				conditions: [{property: 'type', value: EventType.Error}],
				removalType: EventRemovalType.Discarded,
				retentionRate: inboundFilterRate,
				x: 0.55,
				yActive: ya.inboundFilterError,
			},
			{
				name: 'inboundFilterPerformance',
				conditions: [{property: 'type', value: EventType.Performance}],
				removalType: EventRemovalType.Discarded,
				retentionRate: inboundFilterRate,
				x: 0.55,
				yActive: ya.inboundFilterPerformance,
			},
			{
				name: 'serverPerformance',
				conditions: [{property: 'type', value: EventType.Performance}],
				removalType: EventRemovalType.Dropped,
				retentionRate: filterRates.serverPerformance,
				x: 0.65,
				yActive: ya.serverPerformance,
			},
			{
				name: 'serverReleaseV1',
				conditions: [
					{property: 'type', value: EventType.Performance},
					{property: 'release', value: Release.v1},
				],
				removalType: EventRemovalType.Dropped,
				retentionRate: filterRates.serverReleaseV1,
				x: 0.7,
				yActive: ya.serverReleaseV1,
			},
			{
				name: 'serverReleaseV2',
				conditions: [
					{property: 'type', value: EventType.Performance},
					{property: 'release', value: Release.v2},
				],
				removalType: EventRemovalType.Dropped,
				retentionRate: filterRates.serverReleaseV2,
				x: 0.75,
				yActive: ya.serverReleaseV2,
			},
			{
				name: 'serverEnvironmentProd',
				conditions: [
					{property: 'type', value: EventType.Performance},
					{property: 'release', value: Environment.Prod},
				],
				removalType: EventRemovalType.Dropped,
				retentionRate: filterRates.serverEnvironmentProd,
				x: 0.8,
				yActive: ya.serverEnvironmentProd,
			},
			{
				name: 'serverEnvironmentStage',
				conditions: [
					{property: 'type', value: EventType.Performance},
					{property: 'environment', value: Environment.Stage},
				],
				removalType: EventRemovalType.Dropped,
				retentionRate: filterRates.serverEnvironmentStage,
				x: 0.85,
				yActive: ya.serverEnvironmentStage,
			},
		];
	}, [filterRates, inboundFilterRate, populationRates]);

	const yEndBands: Parameters<typeof processEvents>[2] = useMemo(() => {
		const popSum = population.error + population.performance;
		const popRates = {
			error: population.error / popSum,
			performance: population.performance / popSum,
		};
		const filterRates = Object.fromEntries(filters.map(f => [f.name, f.retentionRate]));
		const finalRates = {
			indexed:
				popRates.error * filterRates.sampleRate * filterRates.inboundFilterError +
				popRates.performance *
					filterRates.traceSampleRate *
					filterRates.inboundFilterPerformance *
					filterRates.serverPerformance,
			dropped: 0,
			discarded: 0,
		};
		finalRates.dropped =
			popRates.error * filterRates.sampleRate * filterRates.inboundFilterError +
			popRates.performance *
				filterRates.traceSampleRate *
				filterRates.inboundFilterPerformance -
			finalRates.indexed;
		finalRates.discarded = 1 - finalRates.indexed - finalRates.dropped;

		return {
			indexed: [0, finalRates.indexed * 0.8],
			[EventRemovalType.Dropped]: [
				finalRates.indexed * 0.8 + 0.1,
				finalRates.indexed * 0.8 + 0.1 + finalRates.dropped * 0.8,
			],
			[EventRemovalType.Discarded]: [1 - finalRates.discarded * 0.8, 1],
		};
	}, [population, filters, populationRates]);

	const initialize = useCallback(() => {
		if (!width || !height || !canvasRef.current) return;

		const events = generateEvents(nEvents, populationRates);
		const processedEvents = processEvents(events, filters, yEndBands);
		const eventsWithPath = processedEvents.map(event => {
			const mappedAnchorPoints =
				event.anchorPoints?.map(p => ({...p, x: p.x * width, y: p.y * height})) ?? [];

			return {
				...event,
				path: drawPath(mappedAnchorPoints, width / 20),
				pathActive: drawPath(mappedAnchorPoints.slice(0, -1), width / 20),
				pathInactive: drawPath(mappedAnchorPoints.slice(-2), width / 20),
			};
		});

		setEvents(eventsWithPath);

		const app = new PIXI.Application({
			width,
			height,
			backgroundAlpha: 0,
			resolution: 2,
			view: canvasRef.current,
		});

		const tl = gsap.timeline().pause();
		timeline.current = tl;

		eventsWithPath.forEach((event, index) => {
			const startingPoint = event.anchorPoints[0];
			const frame = new PIXI.Graphics();
			const fill = event.type === 'error' ? 0xff5555 : 0x5555ff;
			frame.beginFill(fill, 0.65);
			frame.drawCircle(startingPoint.x, startingPoint.y, 2);
			app.stage.addChild(frame);

			const removalPoint = event.removed
				? anchorsToProgress(event.path, 5)[event.anchorPoints.length - 2]
				: 1;
			const delay = (index * animationDuration) / nEvents;

			tl.to(
				frame,
				{
					motionPath: {
						path: event.path,
					},
					duration: animationDuration,
					ease: 'none',
					repeat: -1,
				},
				delay
			)
				.to(
					frame,
					{
						tint: event.removalType === EventRemovalType.Discarded ? 0x999999 : fill,
						alpha: event.removalType === EventRemovalType.Discarded ? 0.1 : 0.3,
						duration: 0,
						repeat: -1,
						repeatDelay: animationDuration,
					},
					delay + animationDuration * removalPoint
				)
				.to(
					frame,
					{tint: fill, alpha: 1, duration: 0, repeat: -1, repeatDelay: animationDuration},
					delay + animationDuration
				);

			return frame;
		});

		tl.play();
	}, [width, height, population, filterRates]);

	return (
		<Wrap ref={wrapRef}>
			<SVG viewBox={`0 0 ${width} ${height}`} style={{zIndex: 0}} isStale={isStale}>
				<g className="event-paths">
					{events.slice(0, 750).map((e, i) => (
						<Fragment key={i}>
							<path
								d={e.removed ? e.pathActive : e.path}
								stroke={e.type === 'error' ? '#ff5555' : '#5555ff'}
							/>
							<path d={e.pathInactive} stroke="#999999" />
						</Fragment>
					))}
				</g>
			</SVG>
			<CanvasElement ref={canvasRef} isStale={isStale} />
			<SVG viewBox={`0 0 ${width} ${height}`} style={{zIndex: 2}} isStale={isStale}>
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
								<g className="filter-group" id={`filter-${f.name}`} key={f.name}>
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

			<RestartButton visible={isStale} onPress={restart} showBorder>
				Restart
			</RestartButton>
		</Wrap>
	);
};

export default Canvas;

const Wrap = styled('div')`
	position: relative;
	width: 100%;
	height: 20rem;
	display: flex;
`;

const RestartButton = styled(Button)<{visible: boolean}>`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 3;

	transition: opacity ${p => p.theme.animation.mediumOut};
	opacity: ${p => (p.visible ? `1` : `0`)};
	pointer-events: ${p => (p.visible ? `all` : `none`)};
`;

const CanvasElement = styled('canvas')<{isStale: boolean}>`
	z-index: 1;
	transition: opacity ${p => p.theme.animation.mediumOut};
	${p => p.isStale && `opacity: 0;`}
`;

const SVG = styled('svg')<{isStale: boolean}>`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	overflow: visible;

	transition: opacity ${p => p.theme.animation.mediumOut};
	${p => p.isStale && `opacity: 0.5;`}

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
			stroke-opacity: 0.5;
		}
	}
	path.filter-mark {
		stroke: ${p => p.theme.subText};
		stroke-opacity: 0.5;
		stroke-width: 2;
		stroke-linecap: round;
	}
`;
