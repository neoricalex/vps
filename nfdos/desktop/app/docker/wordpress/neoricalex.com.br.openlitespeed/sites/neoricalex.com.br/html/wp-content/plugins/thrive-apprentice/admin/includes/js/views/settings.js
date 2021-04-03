( function ( $ ) {
	const postSearch = require( '../post-search' ),
		settingItemModel = require( '../models/setting-item' ),
		ItemState = require( './item-state' ),
		PageModel = require( './../models/base-page' );


	module.exports = require( './content-base' ).extend( {
		template: TVE_Dash.tpl( 'settings/general' ),
		initialize: function () {
			const generalSettings = Object.values( TVA.settings ).filter( setting => setting.category === 'general' );

			this.model = new Backbone.Model( generalSettings.reduce( ( o, key ) => Object.assign( o, {[ key.name ]: key} ), {} ) );

			this.registerPageModel = new PageModel( TVA.settings.register_page );

			//Run a fetch on courses to refresh the preview URL
			this.listenTo( TVA.indexPageModel, 'sync', model => {
				if ( Array.isArray( TVA.design.demo_courses ) ) {
					TVA.design.demo_courses.forEach( demoCourse => {
						demoCourse.preview_url = model.get( 'preview_url' ) + demoCourse.slug;
					} );
				}

				TVA.courses.fetch();
			} );
		},
		/**
		 * Render function for this view
		 *
		 * @returns {*}
		 */
		render: function () {
			this.$el.html( this.template( {model: this.model} ) );

			this.afterRender();

			return this;
		},

		/**
		 * After Render Function
		 */
		afterRender: function () {
			this.$( '[data-toggle-setting]' ).each( ( index, element ) => {
				this.toggleElementsDependencies( element );
			} );

			new ItemState( {
				el: this.$( '.tva-apprentice-page-elem' ),
				model: this.registerPageModel,
				states_views_path: './page-states/',
				labels: {
					search: {
						title: 'Set your register page',
					},
					normal: {
						title: 'Register Page',
					},
					delete: {
						title: 'Are you sure you want to remove this register page?',
					},
				},
				afterRender: function () {
					this.$( '.tva-edit-page-with-tar' ).remove();
				},
			} ).render();

			new ItemState( {
				el: this.$( '.tva-course-states-container' ),
				model: TVA.indexPageModel,
				states_views_path: './page-states/',
				labels: {
					search: {
						title: 'Set your courses page',
					},
					normal: {
						title: 'Courses Page',
					},
					delete: {
						title: 'Are you sure you want to remove this course page?',
					},
				},
				afterRender: function () {
					this.$( '.tva-edit-page-with-tar' ).remove();
				},
			} ).render();
		},

		/**
		 * Callback when general settings checkbox is changed
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		changeSettingCheckbox: function ( event, dom ) {
			const value = dom.checked ? dom.getAttribute( 'data-val-checked' ) || 1 : dom.getAttribute( 'data-val-not-checked' ) || 0;

			this._save( dom.getAttribute( 'data-field' ), value );

			this.toggleElementsDependencies( dom );
		},

		/**
		 * Toggle Element Dependencies
		 *
		 * @param {HTMLElement} element
		 */
		toggleElementsDependencies: function ( element ) {
			const toggleSettings = element.getAttribute( 'data-toggle-setting' ),
				toggleSettingsValue = !! element.getAttribute( 'data-toggle-value' );

			if ( toggleSettings ) {
				this.$( toggleSettings ).toggle( toggleSettingsValue === element.checked )
			}
		},

		/**
		 * Triggered when a user modifies an input from the view
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		input: function ( event, dom ) {
			let value = dom.value;

			if ( dom.type === 'number' ) {
				value = Number( value );
			}

			this._save( dom.getAttribute( 'data-field' ), value );
		},

		/**
		 * Sets model props and trigger the save request
		 *
		 * @param {String} prop
		 * @param {Number|String} value
		 *
		 * @private
		 */
		_save: function ( prop, value ) {
			this.model.get( prop ).value = value;
			TVA.settings[ prop ].value = value;

			const model = new settingItemModel( {key: prop, value: value} );

			if ( ! model.isValid() ) {
				TVE_Dash.err( model.validationError.message );
				return;
			}

			model.save();
		}
	} );
} )( jQuery );
