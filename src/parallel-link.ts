import { ApolloLink, NextLink, Operation, Observable as ApolloObservable, FetchResult, Observer as ApolloObserver } from '@apollo/client';
import { mergeMap, from, Subject, map, of, filter, tap } from 'rxjs';


export const isDefined = <T>(value: T): value is NonNullable<T> => value !== undefined && value !== null

interface OperationQueueEntry {
	
	/**
	 * Query operation info (context, query itself, extensions)
	 */
	operation: Operation;
	
	/**
	 * Connection with other links in the apollo chain.
	 * forward(info) - pass info
	 */
	forward: NextLink;
	
	/**
	 * Back connection with other links in the apollo chain.
	 */
	observer: ApolloObserver<FetchResult>;
}

/**
 * Custom Apollo link class to limit number of parallel gql requests.
 */
export default class ParallelLink extends ApolloLink {
	
	private requests = new Subject<OperationQueueEntry>()
	private cancelledRequests: Set<OperationQueueEntry> = new Set()
	
	constructor() {
		super();
		
		this.requests
			.pipe(
				// Merge map is used here for the concurrent logic over gql request operations.
				// Only N (be default 2) requests can be run in parallel
				mergeMap((event) => this.getRequestObserver(event), 2),

				// Delete event from the canceled set operations if that operation was canceled
				// In order to avoid memory leak in cancelledRequests set
				tap(event => event && this.cancelledRequests.delete(event.originEvent)),

				// Filter all cancelled operations from the main output
				filter(isDefined)
			)
			.subscribe(event => {
				const { originEvent: { observer }, payload } = event

				if (observer.next) {
					observer.next(payload as FetchResult)
				}
			})
	}

	public request(operation: Operation, forward: NextLink) {
		
		// Apollo supports only zen-observables but this library supports
		// only limited subset of rxjs operations over observables.
		// In order to get on rxjs and apollo links we have to use zen-observables
		// for public API and transform to rxjs observable for internal use.
		return new ApolloObservable<FetchResult>((observer: ApolloObserver<FetchResult>) => {
			const operationEntry = { operation, forward, observer };

			// Send a request for a fetch operation to the requests pipeline
			this.requests.next(operationEntry)
			
			return () => this.cancelOperation(operationEntry)
		})
	}
	
	private cancelOperation(operation: OperationQueueEntry) {
		this.cancelledRequests.add(operation)
	}
	
	private getRequestObserver(event: OperationQueueEntry) {
		if (this.cancelledRequests.has(event)) {
			return of(undefined)
		}
		
		return from(event.forward(event.operation))
			.pipe(map(payload => ({ payload, originEvent: event })))
	}
}