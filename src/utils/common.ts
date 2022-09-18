/**
 * @example toDisplayDuration(85600) // '1:25' toDisplayDuration(85600, true) //
 * '1:25.6'
 *
 * @param time the time in milliseconds
 * @returns a readable time
 */
export const toDisplayDuration = (time: number): string => {
	time = time / 1000;
	const getSeconds = (time: number) => Math.floor(time);

	if (time < 60) {
		return `00:${time < 10 ? `0${getSeconds(time)}` : getSeconds(time)}`;
	} else if (time < 3600) {
		const minutes = Math.trunc(time / 60);
		const seconds = time - minutes * 60;
		return `${minutes}:${
			seconds < 10 ? `0${getSeconds(seconds)}` : getSeconds(seconds)
		}`;
	} else {
		const hours = Math.trunc(time / 3600);
		const minutes = Math.trunc((time % 3600) / 60);
		const seconds = Math.trunc((time % 3600) % 60);
		return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}:${
			seconds < 10 ? `0${getSeconds(seconds)}` : getSeconds(seconds)
		}`;
	}
};
