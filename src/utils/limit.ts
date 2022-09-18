class Node<ValueType extends () => unknown = () => unknown> {
	value: ValueType;
	next?: Node<ValueType>;

	constructor(value: ValueType) {
		this.value = value;
	}
}

class Queue<ValueType extends () => unknown = () => unknown>
	implements Iterable<ValueType>
{
	private _head?: Node<ValueType>;
	private _tail?: Node<ValueType>;
	private _size = 0;

	enqueue(value: ValueType): void {
		const node = new Node<ValueType>(value);

		if (this._head) {
			if (this._tail) {
				this._tail.next = node;
			}
			this._tail = node;
		} else {
			this._head = node;
			this._tail = node;
		}

		this._size++;
	}

	dequeue(): ValueType | undefined {
		const current = this._head;
		if (!current) {
			return;
		}
		if (this._head) {
			this._head = this._head.next;
		}
		this._size--;
		return current.value;
	}

	clear(): void {
		this._head = undefined;
		this._tail = undefined;
		this._size = 0;
	}

	get size() {
		return this._size;
	}

	*[Symbol.iterator]() {
		let current = this._head;

		while (current) {
			yield current.value;
			current = current.next;
		}
	}
}

/**
 * Limit the amount of concurrent executions of a function.
 *
 * @param concurrency The maximum amount of concurrent executions.
 * @returns A function that accepts a function to limit.
 */
export const getLimiter = <
	Params extends unknown[],
	T extends (...params: Params) => unknown,
>(
	concurrency: number,
): ((fn: T, ...args: Params) => Promise<unknown>) => {
	const queue = new Queue();
	let activeCount = 0;

	const next = () => {
		activeCount--;

		if (queue.size > 0) {
			const task = queue.dequeue();
			if (task) {
				task();
			}
		}
	};

	const run = async (
		fn: T,
		resolve: (value: unknown) => void,
		args: Params,
	) => {
		activeCount++;
		const result = (async () => fn(...args))();

		resolve(result);

		try {
			await result;
		} catch {
			// Ignore errors
		}

		next();
	};

	const enqueue = (
		fn: T,
		resolve: (value: unknown) => void,
		args: Params,
	) => {
		queue.enqueue(run.bind(undefined, fn, resolve, args));

		(async () => {
			// This function needs to wait until the next microtask before comparing
			// `activeCount` to `concurrency`, because `activeCount` is updated asynchronously
			// when the run function is dequeued and called. The comparison in the if-statement
			// needs to happen asynchronously as well to get an up-to-date value for `activeCount`.
			await Promise.resolve();

			if (activeCount < concurrency && queue.size > 0) {
				const task = queue.dequeue();
				if (task) {
					task();
				}
			}
		})();
	};

	const generator = (fn: T, ...args: Params) =>
		new Promise((resolve) => {
			enqueue(fn, resolve, args);
		});

	return generator;
};
