( function ( $ ) {

	module.exports = require( './content-base' ).extend( {
		initialize: function ( options ) {

			$.extend( true, this, options );

			/**
			 * We expect here a path the the views that will represent every state
			 */
			if ( ! options.states_views_path ) {
				console.error( 'required argument states_views_path missing' );
			}

			this.states_views_path = options.states_views_path;

			this.listenTo( this.model, 'change:state', this.render );

			/**
			 * On sync we copy all the data that was modified in the model
			 * to the data localized so that we keep the localized data always up to date
			 */
			this.listenTo( this.model, 'sync', model => {

				const _name = model.get( 'name' ),
					modelJSON = model.toJSON();

				if ( TVA.settings[ _name ] ) {
					Object.keys( TVA.settings[ _name ] ).map( function ( a ) {
						if ( Object.keys( modelJSON ).indexOf( a ) ) {
							TVA.settings[ _name ][ a ] = modelJSON[ a ]
						}
					} )
				}

				if ( _name === 'checkout_page' ) {
					TVA.access_integrations.find( element => {
						if ( [ 'sendowl_product', 'sendowl_bundle' ].includes( element.slug ) ) {
							element.allow = modelJSON.value ? 1 : 0;
						}
					} );

				}
			} );
		},

		render: function () {

			if ( this._view instanceof Backbone.View ) {

				this._view.undelegateEvents();
				this._view.$el.empty();

				delete this._view;
			}

			try {

				/**
				 * paths should be smth like this: some-folder/some-feature/items-states/normal.js
				 * this.model should have state attr = normal for normal.js view to be instantiated
				 */
				const state = this.model.get( 'state' ),
					view = require( this.states_views_path + state + '.js' );

				this._view = new view( {
					el: this.el,
					model: this.model,
					labels: this.labels && this.labels[ state ] ? this.labels[ state ] : {},
					settings: this.settings && this.settings[ state ] ? this.settings[ state ] : {},
				} );

				this._view.render();

			} catch ( e ) {

				console.error( this.states_views_path + this.model.get( 'state' ) + '.js' + ' is not a valid Backbone view' );
				console.log( e )
			}

			this.afterRender();

			return this;
		},

		afterRender: $.noop,
	} );

} )( jQuery );
