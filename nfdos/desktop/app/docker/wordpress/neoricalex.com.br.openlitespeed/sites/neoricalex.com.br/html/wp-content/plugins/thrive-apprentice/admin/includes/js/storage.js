( function ( $ ) {

	/**
	 * Storage handler when localStorage is not available
	 */
	var FallbackStorage = {
		setItem: function ( key, value ) {
		},
		getItem: function ( key ) {
		},
		removeItem: function ( key ) {
		}
	};

	/**
	 * Main object constructor
	 *
	 * @constructor
	 */
	function ThriveAppStorage() {
		this.api = window.localStorage || FallbackStorage;
		this.listening = false;
		this.listeners = {};
	}

	/**
	 * Persist a value in a key
	 *
	 * @param {String} key
	 * @param {*} value
	 * @returns {ThriveAppStorage}
	 */
	ThriveAppStorage.prototype.set = function ( key, value ) {
		if ( ! key || typeof value === 'undefined' || value === null ) {
			return this;
		}

		if ( typeof value === 'object' ) {
			value = JSON.stringify( value );
		}
		try {
			this.api.setItem( key, value );
		} catch ( e ) {
		}

		return this;
	};

	/**
	 *
	 * @param {String} key
	 * @returns {*|undefined}
	 */
	ThriveAppStorage.prototype.get = function ( key ) {
		if ( ! key ) {
			return undefined;
		}

		var value = this.api.getItem( key );
		if ( ! value ) {
			return value;
		}
		try {
			return JSON.parse( value );
		} catch ( e ) {
			return value;
		}
	};

	/**
	 * Removes an item from storage
	 *
	 * @param {String} key
	 *
	 * @return {ThriveAppStorage} allow chained calls
	 */
	ThriveAppStorage.prototype.unset = function ( key ) {
		if ( ! key ) {
			return this;
		}
		try {
			this.api.removeItem( key );
		} catch ( e ) {

		}

		return this;
	};

	ThriveAppStorage.prototype._listen = function () {

		var self = this,
			change = function ( e ) {
				if ( ! e ) {
					e = window.event;
				}

				var all = self.listeners[ e.key ];

				if ( all && all.length ) {
					all.forEach( function ( listener ) {
						listener( JSON.parse( e.newValue ), JSON.parse( e.oldValue ) );
					} );
				}
			};

		if ( window.addEventListener ) {
			window.addEventListener( 'storage', change, false );
		} else if ( window.attachEvent ) {
			window.attachEvent( 'onstorage', change );
		} else {
			window.onstorage = change;
		}
	};


	ThriveAppStorage.prototype.on = function ( key, fn ) {
		if ( this.listeners[ key ] ) {
			this.listeners[ key ].push( fn );
		} else {
			this.listeners[ key ] = [ fn ];
		}

		if ( this.listening === false ) {
			this._listen();
			this.listening = true;
		}
	};

	ThriveAppStorage.prototype.off = function ( key, fn ) {
		var listener = listeners[ key ];
		if ( listener.length > 1 ) {
			listener.splice( listener.indexOf( fn ), 1 );
		} else {
			listeners[ key ] = [];
		}
	};

	/**
	 *
	 * @param {String} component
	 * @param {String} field
	 * @param {Boolean|Number|Object|String} value
	 */
	ThriveAppStorage.prototype.setComponentMeta = function ( component, field, value ) {

		var meta = this.get( 'tcb-components-display' ) || {};

		meta[ component ] = meta[ component ] || {};
		meta[ component ][ field ] = value;

		this.set( 'tcb-components-display', meta );
	};

	/**
	 *
	 * @returns {ThriveAppStorage} a storage instance
	 */
	ThriveAppStorage.instance = function () {
		if ( ! this._instance ) {
			this._instance = new ThriveAppStorage();
		}

		return this._instance;
	};

	module.exports = ThriveAppStorage;

} )( jQuery );
