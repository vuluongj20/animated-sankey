const isDefined = <T,>(item: T): item is NonNullable<T> =>
	typeof item !== 'undefined' && item !== null;

export default isDefined;
