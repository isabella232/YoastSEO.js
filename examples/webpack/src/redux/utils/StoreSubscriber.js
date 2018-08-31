import Paper from "../../../../../src/values/Paper";
import { isEqual, debounce } from "lodash-es";

import { setStatus } from "../actions/worker";
import { setResults } from "../actions/results";

export default class StoreSubscriber {
	constructor( { store, worker } ) {
		this._store = store;
		this._worker = worker;
		this._prevState = {};

		this.onStoreChange = this.onStoreChange.bind( this );
		this.triggerAutomaticRefresh = debounce( this.triggerAutomaticRefresh, 500 );
	}

	onStoreChange() {
		const state = this._store.getState();

		const { isAutomaticRefreshEnabled } = state.worker;

		if ( isAutomaticRefreshEnabled ) {
			this.triggerAutomaticRefresh( this._prevState, state );
		}

		this._prevState = state;
	}

	dispatch( action ) {
		this._store.dispatch( action );
	}

	triggerAutomaticRefresh( prevState, state ) {
		const { paper: prevPaper } = prevState;
		const { paper } = state;

		if ( ! isEqual( paper, prevPaper ) ) {
			this.dispatch( setStatus( "analyzing" ) );
			this._worker.analyze( Paper.parse( paper ) )
				.then( ( { result } ) => {
					this.dispatch( setStatus( "idling" ) );
					this.dispatch( setResults( {
						readability: result.readability.results,
						seo: result.seo[ "" ].results,
					} ) );
				} );
		}
	}

	subscribe() {
		this._store.subscribe( this.onStoreChange );
	}
}
