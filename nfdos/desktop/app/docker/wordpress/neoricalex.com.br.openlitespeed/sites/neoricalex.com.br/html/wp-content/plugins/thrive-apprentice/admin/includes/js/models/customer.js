( function ( $ ) {

	const BaseCollection = require( './../collections/base' );

	module.exports = require( './base' ).extend( {
		/**
		 * id attribute name
		 */
		idAttribute: 'ID',
		/**
		 * default properties
		 */
		defaults: {
			display_name: '',
			user_email: '',
			user_login: '',
			services: {},
			notify: 0, //Flag that marks if the user should receive an email or not
			edit_url: '',
		},
		/**
		 * Set defaults
		 */
		initialize: function () {
			/**
			 * Set services as an empty object on initialization
			 */
			this.set( 'services', {} );
		},
		/**
		 * Server site URL endpoint
		 * @return {string}
		 */
		url: function () {

			let url = TVA.routes.customer;

			if ( this.get( 'ID' ) ) {
				url += `/${this.get( 'ID' )}`;
			}

			return url;
		},
		/**
		 * Overwrite Backbone validation
		 * Return something to invalidate the model
		 *
		 * @param {Object} attrs
		 * @param {Object} options
		 */
		validate: function ( attrs, options ) {
			const errors = [];

			if ( ! attrs.user_login ) {
				errors.push( this.validation_error( 'user_login', TVA.t.MissingUserLogin ) );
			}

			if ( ! attrs.user_email ) {
				errors.push( this.validation_error( 'user_email', TVA.t.MissingEmail ) );
			}

			if ( ! TVA.Utils.isEmail( attrs.user_email ) ) {
				errors.push( this.validation_error( 'user_email', TVA.t.InvalidCustomerEmail ) );
			}

			if ( errors.length ) {
				return errors;
			}
		},

		/**
		 * Checks if the customer has services applied
		 *
		 * @returns {boolean}
		 */
		hasServices: function () {
			const services = this.get( 'services' ),
				serviceKeys = Object.keys( services );

			let hasServices = false;

			for ( let _key of serviceKeys ) {
				const isNotEmpty = Array.isArray( services[ _key ] ) && services[ _key ].length > 0;

				if ( isNotEmpty ) {
					hasServices = true;
					break;
				}
			}

			return hasServices;
		},

		/**
		 * Returns all services with their items for a customer
		 *
		 * @param ajaxParams
		 *
		 * @returns {jQuery.xhr}
		 */
		getServices: function ( ajaxParams ) {

			ajaxParams = ajaxParams || {};
			ajaxParams.beforeSend = function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', TVA.apiSettings.nonce );
			};

			const oAjaxParams = _.extend( {
				type: 'POST',
				dataType: 'json',
				url: `${this.url()}/service_items`,
			}, ajaxParams );

			return $.ajax( oAjaxParams );
		},

		/**
		 * Set services to empty object
		 */
		removeServices: function () {
			this.set( 'services', {} );
		},
		/**
		 * Fetches a list of order items purchased by user
		 * @return {Promise<unknown>}
		 */
		getPurchasedItems: function () {

			return new Promise( resolve => {

				if ( this.get( 'purchasedItems' ) instanceof Backbone.Collection ) {
					return resolve( this.get( 'purchasedItems' ) );
				}

				const collection = new BaseCollection();
				collection.url = this.url() + '/purchased-items';

				collection.fetch( {
						success: ( collection ) => {

							if ( collection instanceof Backbone.Collection ) {
								this.set( 'purchasedItems', collection );
							}

							resolve( this.get( 'purchasedItems' ) );
						}
					}
				);
			} );
		},
		/**
		 * Fetches a list of courses customer has access to
		 * @return {Promise|Backbone.Collection}
		 */
		getAccessCourses: function () {

			return new Promise( resolve => {
				if ( this.get( 'courses' ) instanceof Backbone.Collection ) {
					return resolve( this.get( 'courses' ) );
				}

				const collection = new BaseCollection();
				collection.url = this.url() + '/courses';

				collection.fetch( {
						success: ( collection ) => {
							if ( collection instanceof BaseCollection ) {
								this.set( 'courses', collection );
							}

							return resolve( this.get( 'courses' ) );
						}
					}
				);
			} );
		}
	} );
} )( jQuery );
