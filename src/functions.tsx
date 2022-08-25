import {MotionPathPlugin} from 'gsap/MotionPathPlugin';

import {
	AnchorPoint,
	Environment,
	Event,
	EventRemovalType,
	EventType,
	Filter,
	Release,
} from './types';

export function anchorsToProgress(rawPathInput: string, resolution = 12) {
	resolution = ~~resolution;
	const rawPath = MotionPathPlugin.getRawPath(rawPathInput);

	MotionPathPlugin.cacheRawPathMeasurements(rawPath, resolution);
	let progress = [0],
		length,
		s,
		i,
		e,
		segment,
		samples;
	for (s = 0; s < rawPath.length; s++) {
		segment = rawPath[s];
		// @ts-ignore
		samples = segment.samples;
		e = segment.length - 6;
		for (i = 0; i < e; i += 6) {
			length = samples[(i / 6 + 1) * resolution - 1];
			// @ts-ignore
			progress.push(length / rawPath.totalLength);
		}
	}
	return progress;
}

export function drawPath(anchorPoints: AnchorPoint[], controlPointOffset: number) {
	return anchorPoints
		.map((point, i) => {
			if (i === 0) {
				return `M ${point.x} ${point.y}`;
			}

			const prevPoint = anchorPoints[i - 1];
			return [
				`C ${prevPoint.x + controlPointOffset} ${prevPoint.y}`,
				`${point.x - controlPointOffset} ${point.y}`,
				`${point.x} ${point.y}`,
			].join(' ');
		})
		.join(' ');
}

export function createSampleGivenRate<Tag extends string = string>(
	rates: Record<Tag, number>
): Tag {
	const total = Object.entries<number>(rates).reduce((acc, cur) => acc + cur[1], 0);
	const normalizedRates: [Tag, number][] = Object.entries<number>(rates).map(entry => [
		entry[0] as Tag,
		entry[1] / total,
	]);
	let randomNumber = Math.random();

	for (const entry of normalizedRates) {
		const [tag, rate] = entry;
		randomNumber -= rate;
		if (randomNumber < 0) {
			return tag;
		}
	}

	return normalizedRates[normalizedRates.length - 1][0];
}

type EventSamplingRates = {
	type: Record<EventType, number>;
	environment: Record<Environment, number>;
	release: Record<Release, number>;
};

export function generateEvents(nEvents = 100, rates: EventSamplingRates): Event[] {
	return new Array(nEvents).fill(0).map(() => ({
		type: createSampleGivenRate(rates.type),
		environment: createSampleGivenRate(rates.environment),
		release: createSampleGivenRate(rates.release),
		anchorPoints: [{filterName: 'start', x: 0, y: Math.random() * 0.25}],
	}));
}

function getPostionFromBand(band: [number, number], ratio: number) {
	return band[0] + (band[1] - band[0]) * ratio;
}
export function processEvents(
	events: Event[],
	filters: Filter[],
	yEndBands: Record<'indexed' | EventRemovalType, [number, number]>
): Event[] {
	return events.map(event => {
		const mutableEvent: Event = {...event};

		// Run events through filters
		filters.forEach(filter => {
			const {name, conditions, retentionRate, removalType, x, yActive, yInactive} =
				filter;

			if (mutableEvent.removed) return;
			if (conditions.some(cond => mutableEvent[cond.property] !== cond.value)) return;

			const inflectionPoint = getPostionFromBand(yActive, retentionRate);
			const yRetentionBand: [number, number] = [yActive[0], inflectionPoint];
			const yRemovalBand: [number, number] = [inflectionPoint, yActive[1]];

			const shouldRemoveEvent = Math.random() > retentionRate;
			if (shouldRemoveEvent) {
				mutableEvent.removed = true;
				mutableEvent.removalType = removalType;
				mutableEvent.anchorPoints.push({
					filterName: name,
					x,
					y: getPostionFromBand(yRemovalBand, Math.random()),
				});
			} else {
				mutableEvent.anchorPoints.push({
					filterName: name,
					x,
					y: getPostionFromBand(yRetentionBand, Math.random()),
				});
			}
		});

		mutableEvent.anchorPoints.push({
			filterName: 'end',
			x: 1,
			y: getPostionFromBand(
				yEndBands[mutableEvent.removalType ?? 'indexed'],
				Math.random()
			),
		});

		return mutableEvent;
	});
}
