// import { EventEmitter } from 'node:events';

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

		if (this._tail) {
			this._tail.next = node;
		} else {
			this._head = node;
		}

		this._tail = node;
		this._size++;
	}

	dequeue(): ValueType | undefined {
		if (!this._head) {
			return;
		}

		const current = this._head;
		this._head = this._head.next;
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

type AsyncFunction<T> = () => Promise<T>;

const getConcurrencyLimiter = <ReturnType>(
	concurrency: number,
): ((fn: AsyncFunction<ReturnType>) => Promise<ReturnType>) => {
	const queue = new Queue<AsyncFunction<void>>();
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

	const executeConcurrentFunction = async (
		fn: AsyncFunction<ReturnType>,
		resolve: (value: ReturnType | PromiseLike<ReturnType>) => void,
	) => {
		activeCount++;
		try {
			const result = await fn();
			resolve(result);
		} catch (err) {
			console.error(err); // log error for debugging
			resolve(Promise.reject(err)); // reject promise with the error
		} finally {
			next();
		}
	};

	const enqueue = (
		fn: AsyncFunction<ReturnType>,
		resolve: (value: ReturnType | PromiseLike<ReturnType>) => void,
	) => {
		queue.enqueue(executeConcurrentFunction.bind(undefined, fn, resolve));

		// Use IIFE with void to fix no-unused-expressions
		void (async () => {
			await Promise.resolve();

			if (activeCount < concurrency && queue.size > 0) {
				const task = queue.dequeue();
				if (task) task();
			}
		})();
	};

	const generator = (fn: AsyncFunction<ReturnType>): Promise<ReturnType> =>
		new Promise<ReturnType>((resolve) => {
			enqueue(fn, resolve);
		});

	return generator;
};

/**
 * Executes a list of functions concurrently, with a limit on the maximum number
 * of concurrent executions.
 *
 * @param functions - An array of functions to execute.
 * @param concurrency - The maximum number of concurrent function executions.
 * @returns - A promise that resolves to an array of return values of the
 *   executed functions.
 */
export const runFunctions = async <T>(
	functions: AsyncFunction<T>[],
	concurrency: number,
): Promise<T[]> => {
	if (concurrency < 1) {
		throw new Error('Concurrency must be at least 1.');
	}

	if (concurrency === 1) {
		const results: T[] = [];
		for (const fn of functions) {
			results.push(await fn());
		}
		return results;
	}

	const limiter = getConcurrencyLimiter<T>(concurrency);

	// if (functions.length > 10 && concurrency > 10) {
	// 	EventEmitter.defaultMaxListeners = functions.length;
	// }

	return Promise.all(functions.map(limiter));
};
