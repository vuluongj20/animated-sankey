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
	}, [population, filterRates, inboundFilterRate]);

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
				label: 'sampleRate',
				conditions: [{property: 'type', value: EventType.Error}],
				removalType: EventRemovalType.Discarded,
				retentionRate: filterRates.sampleRate,
				x: 0.25,
				yActive: ya.sampleRate,
			},
			{
				name: 'traceSampleRate',
				label: 'traceSampleRate',
				conditions: [{property: 'type', value: EventType.Performance}],
				removalType: EventRemovalType.Discarded,
				retentionRate: filterRates.traceSampleRate,
				x: 0.25,
				yActive: ya.traceSampleRate,
			},
			{
				name: 'inboundFilterError',
				label: 'Inbound Data Filters',
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
				label: 'Custom Rules',
				labelYOffset: -4,
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

	const finalRates = useMemo(() => {
		const typeRates = populationRates.type;
		const releaseRates = populationRates.release;
		const environmentRates = populationRates.environment;
		const filterRates = Object.fromEntries(filters.map(f => [f.name, f.retentionRate]));
		const finalRates = {
			indexed: {
				error: typeRates.error * filterRates.sampleRate * filterRates.inboundFilterError,
				performance:
					typeRates.performance *
					filterRates.traceSampleRate *
					filterRates.inboundFilterPerformance *
					filterRates.serverPerformance *
					(1 - releaseRates.v1 * (1 - filterRates.serverReleaseV1)) *
					(1 - releaseRates.v2 * (1 - filterRates.serverReleaseV2)) *
					(1 - environmentRates.prod * (1 - filterRates.serverEnvironmentProd)) *
					(1 - environmentRates.stage * (1 - filterRates.serverEnvironmentStage)),
			},
			dropped: {error: 0, performance: 0},
			discarded: {error: 0, performance: 0},
		};

		finalRates.dropped.error =
			typeRates.error * filterRates.sampleRate * filterRates.inboundFilterError -
			finalRates.indexed.error;
		finalRates.dropped.performance =
			typeRates.performance *
				filterRates.traceSampleRate *
				filterRates.inboundFilterPerformance -
			finalRates.indexed.performance;

		finalRates.discarded.error =
			typeRates.error - finalRates.indexed.error - finalRates.dropped.error;
		finalRates.discarded.performance =
			typeRates.performance -
			finalRates.indexed.performance -
			finalRates.dropped.performance;

		return finalRates;
	}, [populationRates, filters]);

	const finalCounts = useMemo(() => {
		const popSum = population.error + population.performance;
		return {
			indexed: {
				error: Math.round(popSum * finalRates.indexed.error),
				performance: Math.round(popSum * finalRates.indexed.performance),
			},
			dropped: {
				error: Math.round(popSum * finalRates.dropped.error),
				performance: Math.round(popSum * finalRates.dropped.performance),
			},
			discarded: {
				error: Math.round(popSum * finalRates.discarded.error),
				performance: Math.round(popSum * finalRates.discarded.performance),
			},
		};
	}, [population, finalRates]);

	const yEndBands: Parameters<typeof processEvents>[2] = useMemo(() => {
		const combinedFinalRates = {
			indexed: finalRates.indexed.error + finalRates.indexed.performance,
			dropped: finalRates.dropped.error + finalRates.dropped.performance,
			discarded: finalRates.discarded.error + finalRates.discarded.performance,
		};
		return {
			indexed: [0, combinedFinalRates.indexed * 0.8],
			[EventRemovalType.Dropped]: [
				combinedFinalRates.indexed * 0.8 + 0.1,
				combinedFinalRates.indexed * 0.8 + 0.1 + combinedFinalRates.dropped * 0.8,
			],
			[EventRemovalType.Discarded]: [1 - combinedFinalRates.discarded * 0.8, 1],
		};
	}, [finalRates]);

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
	}, [width, height, filters, populationRates, yEndBands]);

	return (
		<Wrap>
			<MainWrap ref={wrapRef}>
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
									(f.yActive[0] + (f.yActive[1] - f.yActive[0]) * f.retentionRate) *
									height;

								const markOffset = 2;

								return (
									<g className="filter-group" id={`filter-${f.name}`} key={f.name}>
										{f.label && (
											<text
												className="filter-label"
												x={x - 3}
												y={y0 - 4 + (f.labelYOffset ?? 0)}
											>
												{f.label}
											</text>
										)}
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
			</MainWrap>

			<CountWrap>
				<CountRow top={yEndBands.indexed[0]} bottom={yEndBands.indexed[1]}>
					<CountLabel>Indexed</CountLabel>
					<CountError>
						{finalCounts.indexed.error}
						<CountUnit>&nbsp;errors</CountUnit>
					</CountError>
					<CountPerformance>
						{finalCounts.indexed.performance}
						<CountUnit>&nbsp;trans.</CountUnit>
					</CountPerformance>
				</CountRow>

				<CountRow top={yEndBands.dropped[0]} bottom={yEndBands.dropped[1]}>
					<CountLabel>Dropped</CountLabel>
					<CountError>
						{finalCounts.dropped.error}
						<CountUnit>&nbsp;errors</CountUnit>
					</CountError>
					<CountPerformance>
						{finalCounts.dropped.performance}
						<CountUnit>&nbsp;trans.</CountUnit>
					</CountPerformance>
				</CountRow>

				<CountRow top={yEndBands.discarded[0]} bottom={yEndBands.discarded[1]}>
					<CountLabel>Discarded</CountLabel>
					<CountError>
						{finalCounts.discarded.error}
						<CountUnit>&nbsp;errors</CountUnit>
					</CountError>
					<CountPerformance>
						{finalCounts.discarded.performance}
						<CountUnit>&nbsp;trans.</CountUnit>
					</CountPerformance>
				</CountRow>
			</CountWrap>
		</Wrap>
	);
};

export default Canvas;

const Wrap = styled('div')`
	position: relative;
	width: 100%;
	height: 20rem;
	display: flex;
	margin-bottom: ${p => p.theme.space[2]};
`;

const MainWrap = styled('div')`
	position: relative;
	width: 100%;
	height: 100%;
`;

const CountWrap = styled('div')`
	flex-shrink: 0;
	width: 7rem;
	position: relative;
	height: 100%;
`;

const CountRow = styled('div')<{top: number; bottom: number}>`
	position: absolute;
	width: 100%;
	top: ${p => p.top * 100}%;
	bottom: calc(100% - ${p => p.bottom * 100}%);
	padding: 0 ${p => p.theme.space[2]};

	display: flex;
	flex-direction: column;
	justify-content: center;
`;

const CountLabel = styled('p')`
	font-weight: 500;
	font-size: 10px;
	color: ${p => p.theme.subText};
	opacity: 0.75;
	text-transform: uppercase;
	margin-bottom: 0;
`;

const CountError = styled('p')`
	font-weight: 500;
	color: #ff5555;
	opacity: 1;
	margin-bottom: 0;
`;

const CountPerformance = styled('p')`
	font-weight: 500;
	color: #5555ff;
	opacity: 1;
	margin-bottom: 0;
`;

const CountUnit = styled('small')`
	font-size: ${p => p.theme.fontSizeExtraSmall};
	color: inherit;
	opacity: 0.75;
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
	width: 100%;
	height: 100%;
	position: relative;
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

	text.filter-label {
		fill: ${p => p.theme.subText};
		font-size: 10px;
		font-weight: 500;
	}
`;
