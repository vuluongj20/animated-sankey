const debounce = <FunctionArguments extends []>(
	func: (...args: FunctionArguments) => void,
	wait: number
) => {
	let timeout: NodeJS.Timeout | undefined;
	return (...args: FunctionArguments) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
};

export default debounce;
