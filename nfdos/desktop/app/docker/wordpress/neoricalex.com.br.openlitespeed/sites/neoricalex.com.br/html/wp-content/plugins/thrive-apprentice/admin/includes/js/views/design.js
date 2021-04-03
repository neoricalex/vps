( function ( $ ) {
	const ContentBase = require( './content-base' ),
		Preview = require( './design/preview' ),
		AvailableSettingsModel = require( '../models/available-settings' ),
		designBase = require( '../views/design/base' ),
		utils = require( './design/utils' ),
		settingsViews = {
			'template': require( './design/template' ),
			'advanced': require( './design/advanced' ),
			'index': require( './design/index' ),
		};

	module.exports = ContentBase.extend( {
		className: 'tva-wizard-container',
		model: null,
		/**
		 * Underscore template for current view
		 */
		template: TVE_Dash.tpl( 'design/base' ),

		initialize: function ( options ) {
			TVE_Dash.showLoader();

			/**
			 * We need to set this in order to call it from the iframe
			 * The Loaded is hidden when the iframe is loaded completely
			 */
			TVA.design.$el = this.$el;
			TVA.design.$el.on( 'tva_iframe_loaded', () => {
				TVE_Dash.hideLoader();
				utils.iframeLoaded();
			} );

			ContentBase.prototype.initialize.apply( this, arguments );

			const templateSettings = Object.values( TVA.settings ).filter( setting => setting.category === 'template' );

			//The settings
			this.model = new Backbone.Model( templateSettings.reduce( ( o, key ) => Object.assign( o, {[ key.name ]: key.value} ), {} ) );
			//Course Collection
			this.collection = TVA.courses;

			this.listenTo( this.model, 'change:preview_option', model => {
				TVA.settings.preview_option.value = model.get( 'preview_option' );
			} );

			this.fragment = Backbone.history.getFragment().split( '/' );

			if ( ! TVA.globals.availableSettingsModel ) {
				TVA.globals.availableSettingsModel = new AvailableSettingsModel();
				TVA.globals.availableSettingsModel.fetch().success( () => this.renderDesign() );
			} else {
				this.renderDesign();
			}
		},
		render: function () {
			return this;
		},
		/**
		 * Renders the template
		 *
		 * @returns {Backbone.View}
		 */
		renderDesign: function () {
			/**
			 * if we don't have any courses and the preview is set to see live move the switch to mock-up
			 */
			const published = TVA.courses.toArray().filter( item => item.get( 'status' ) === 'publish' );

			this.model.get( 'preview_option' ) && published.length === 0 && this.model.set( {preview_option: false} );

			if ( published.length === 0 && TVA.settings.show_hi_professor_modal ) {

				this.openModal( require( './modals/design/hi-professor' ), ( {
					model: new Backbone.Model(),
					'max-width': '60%',
					width: '800px'
				} ) );

				delete TVA.settings.show_hi_professor_modal;
			}

			this.$el.html( this.template( {
				model: this.model,
				published: published
			} ) );

			this.renderSettings( this.fragment[ 1 ] );
			this.renderPreview();

			TVE_Dash.materialize( this.$el );

			/**
			 * jQuery Scrollbar on Design menu
			 */
			this.$( '.scrollbar-inner' ).scrollbar();

			return this;
		},

		/**
		 * Renders the settings view
		 *
		 * @param {String} state
		 */
		renderSettings: function ( state = 'template' ) {
			let View = null;

			if ( settingsViews[ state ] ) {
				View = settingsViews[ state ];
			}

			if ( ! View instanceof Backbone.View ) {
				return;
			}

			this.settings = new View( {
				model: this.model,
				collection: this.collection,
				available_settings: TVA.globals.availableSettingsModel,
				el: this.$( '.tva-options-container' )
			} );
		},

		/**
		 * Renders the iFrame Preview
		 */
		renderPreview: function () {
			this.$( '#tva-preview-' + ( this.model.get( 'preview_option' ) ? 'live' : 'demo' ) ).addClass( 'active' );

			const preview = new Preview( {
				model: this.model,
				el: this.$( '.tva-template-container' )
			} );
		},

		/**
		 * Sets the active preview of the iFrame (Demo / Live)
		 *
		 * @param {Event} event
		 * @param {Element} dom
		 */
		setActivePreview: function ( event, dom ) {
			const activePreview = parseInt( dom.getAttribute( 'data-preview' ) );

			designBase.prototype.save.apply( this, [] ).always( () => { //We call the design base save in order to avoid duplicate code
				wp.apiRequest( {
					type: 'POST',
					url: `${TVA.routes.settings_v2}/switch_preview/`,
					data: {
						key: 'preview_option',
						value: activePreview
					}
				} ).done( ( response, status, options ) => {
					if ( options.status === 200 ) {
						this.model.set( {preview_option: activePreview} );
						this.renderDesign();
					}
				} ).fail( () => {
					TVE_Dash.hideLoader();
				} );
			} );
		},
	} );
} )( jQuery );
