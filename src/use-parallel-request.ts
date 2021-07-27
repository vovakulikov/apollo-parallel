import { useEffect, useState } from 'react';
import {
	from,
	of,
	Observable,
	publish,
	Subject,
	filter,
	debounce,
	delay,
	concatMap,
	buffer,
	takeWhile,
	refCount
} from 'rxjs';
import { takeUntil, map , mergeMap, take, switchMap } from 'rxjs/operators'

interface Request<T> {
	request: () => any,
	onComplete: (result: any) => void;
	cancel: Subject<any>;
}

const requests = new Subject<Request<unknown>>()
const cancelledRequests = new Set<Request<unknown>>()

window.cancelledRequests = cancelledRequests

// Global pipeline query/request manager
requests
	.pipe(
		// Merge map is used here for the concurrent logic over gql request operations.
		// Only N (be default 2) requests can be run in parallel
		mergeMap(
			event => {
				
				const { request } = event;
				
				return of(null).pipe(
					delay(0),
					takeWhile(() => {
						if (cancelledRequests.has(event)) {
							cancelledRequests.delete(event)

							return false
						}
						
						return true
					}),
					switchMap(() =>
						from(request()).pipe(
							takeUntil(event.cancel),
							take(1),
							map(payload => ({ payload, originEvent: event })),
						)
					)
				)
			},
			1
		),
	)
	.subscribe(result => {
		const { payload, originEvent } = result
		const { onComplete } = originEvent

		onComplete(payload)
	})

export function useParallelRequests(request: () => any) {
	const [state, setState] = useState<any>()
	
	useEffect(() => {
		
		const stopReference = new Subject()
		
		const event = {
			request,
			cancel: stopReference.pipe(publish(), refCount()),
			onComplete: (res) => setState(res)
		}
		requests.next(event)
		
		return () => {
			cancelledRequests.add(event)
			stopReference.next(true)
		}
	}, [request])
	
	return state;
}
