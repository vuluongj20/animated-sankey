export enum EventType {
	Error = 'error',
	Performance = 'performance',
}

export enum Environment {
	Prod = 'prod',
	Stage = 'stage',
	Dev = 'dev',
}

export enum Release {
	v1 = 'v1',
	v2 = 'v2',
}

export type AnchorPoint = {
	filterName: Filter['name'];
	x: number;
	y: number;
};

export enum EventRemovalType {
	Discarded = 'discarded',
	Dropped = 'dropped',
}

export type Event = {
	type: EventType;
	release: Release;
	environment: Environment;
	anchorPoints: AnchorPoint[];
	removed?: boolean;
	removalType?: EventRemovalType;
	path?: string;
};

export type Filter = {
	name: string;
	conditions: Array<{property: keyof Event; value: string}>;
	retentionRate: number;
	removalType: EventRemovalType;
	x: number;
	yActive: [number, number];
	yInactive?: [number, number];
};
