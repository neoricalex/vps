( function ( $ ) {

	/**
	 * Sets Backbone to emulate HTTP requests for models
	 * HTTP_X_HTTP_METHOD_OVERRIDE set to PUT|POST|PATH|DELETE|GET
	 *
	 * @type {boolean}
	 */
	Backbone.emulateHTTP = true;

	/**
	 * Base model from which all others models
	 * should extend from
	 */
	module.exports = Backbone.Model.extend( {
		/**
		 * Append WP Nonce to all requests
		 * @param method
		 * @param collection
		 * @param options
		 */
		sync: function ( method, collection, options ) {
			options.beforeSend = function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', TVA.apiSettings.nonce );
			};

			/**
			 * Save the model state after each request
			 */
			this.saveState();

			return Backbone.Model.prototype.sync.apply( this, arguments );
		},
		/**
		 * Wraps up an error object for later use
		 * @param {string} field
		 * @param {string} message
		 * @return {{field: *, message: *}}
		 */
		validation_error: function ( field, message ) {
			return {
				field: field,
				message: message
			};
		},

		/**
		 * Gets the first error message from list if any defined
		 * @returns {string}
		 */
		getValidationError: function () {
			return this.validationError && this.validationError[ 0 ] ? this.validationError[ 0 ].message : '';
		},

		/**
		 * Saves the current state (attributes) of this model in an internal field
		 * Useful for restoring the attributes to their original values after some modifications
		 *
		 * @return {Backbone.Model}
		 */
		saveState: function () {
			this.__saved_state = {};
			jQuery.extend( true, this.__saved_state, this.attributes );

			return this;
		},
		/**
		 * Restores a previously saved state
		 *
		 * @param {Boolean} silent - whether or not to trigger the 'change' event. Defaults to false
		 *
		 * @returns {exports}
		 */
		restoreState: function ( silent = false ) {
			if ( ! this.__saved_state ) {
				return this;
			}

			this.set( this.__saved_state, {silent} );

			return this;
		},
		/**
		 * "Deep" get a field for a path in the form of: field1.field2 returns this.get('field1').field2
		 * Also handles nested models
		 *
		 * @param {String} path
		 */
		deepGet( path ) {
			if ( ! path ) {
				return null;
			}

			const parts = path.split( '.' );
			let target = this;
			while ( parts.length ) {
				const field = parts.shift();
				const value = ( target instanceof Backbone.Model ) ? target.get( field ) : target[ field ];

				if ( typeof value === 'undefined' ) {
					return null;
				}
			}

			return value;
		}
	} );
} )( jQuery );
