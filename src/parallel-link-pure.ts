import { ApolloLink, FetchResult, NextLink, Operation,  Observable, Observer } from '@apollo/client';

interface OperationQueueEntry {
	operation: Operation;
	forward: NextLink;
	observer: Observer<FetchResult>;
}

export class ParallelLinkPure extends ApolloLink {
	
	operations: OperationQueueEntry[] = []
	ongoingOperations: OperationQueueEntry[] = []

	constructor() {
		super();
	}
	
	public request(operation: Operation, forward: NextLink): Observable<FetchResult> {
		return new Observable(observer => {
			const operationEntry = { operation, forward, observer }

			this.addOperations(operationEntry)
			return () => this.cancelOperation()
		})
	}
	
	private addOperations(operation: OperationQueueEntry) {
		this.operations.push(operation);
	}
	
	// private executeOperations() {
	// 	if (this.ongoingOperations.length > 2) {
	// 		return
	// 	}
	//
	// 	while (this.ongoingOperations.length <= 2 && this.operations.length > 0) {
	// 		const { forward, operation, observer } = this.operations.shift()!
	//
	// 		forward(operation).subscribe(result => {
	//
	// 			observer?.next?.(result)
	// 		})
	// 	}
	// }
	
	private cancelOperation() {}
}