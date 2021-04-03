( function ( $ ) {
	/**
	 * Base View
	 * @type {Backbone.View}
	 */
	const BaseView = require( './../base' );
	const ImageUpload = require( './../wp-media' );
	const MediaSettingsView = require( './../media-settings' );

	/**
	 * Details Tab for Course
	 * @type {Backbone.View}
	 */
	module.exports = BaseView.extend( {
		/**
		 * @property {jQuery}
		 */
		$videoSettings: null,
		/**
		 * @param {jQuery}
		 */
		$authorSettings: null,
		/**
		 * @property {jQuery}
		 */
		$authorAvatar: null,
		/**
		 * @property {jQuery}
		 */
		$authorCustomBioWrapper: null,
		/**
		 * @property {jQuery}
		 */
		$courseImage: null,
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/details-tab' ),
		/**
		 * Events of this view
		 * @return {Object}
		 */
		events: function () {
			return $.extend( BaseView.prototype.events, {} );
		},
		/**
		 * Applies some events listeners
		 */
		initialize: function () {
			this.listenTo( this.model, 'change:has_video', _.bind( toggleVideoDescription, this ) );
			this.listenTo( this.model, 'change:author', () => this.changeAuthorBio( this.model.get( 'author' ).get( 'biography_type' ), true ) );
			this.listenTo( this.model, 'change:author', () => {
				/**
				 * destroy current author image and its binds on its model
				 */
				if ( this.authorImage ) {
					this.authorImage.destroy();
					delete this.authorImage;
				}

				/**
				 * creates a new author image view for thw newly selected author
				 */
				this.handleAuthorAvatar( this.$authorAvatar );
			} );
		},
		/**
		 * Puts template's html into current element's view
		 * @return {Backbone.View}
		 */
		render: function () {

			BaseView.prototype.render.apply( this, arguments );

			TVA.Utils.renderMCE( 'tva-course-description', this.model, 'description' );
			TVA.Utils.renderMCE( 'tva-course-author-description', this.model.get( 'author' ), 'custom_biography' ).then( maybeEditor => {
				if ( maybeEditor && typeof maybeEditor.setContent === 'function' ) {
					this.authorMCE = maybeEditor;
				}
			} );

			this.$videoSettings = this.$( '#tva-course-video-settings' );
			this.$authorSettings = this.$( '#tva-author-settings' );
			this.$authorCustomBioWrapper = this.$( '#tva-course-author-description-wrapper' );
			this.$authorAvatar = this.$( '#tva-author-avatar' );
			this.$courseImage = this.$( '#tva-course-image' );

			new ImageUpload( {
				model: this.model,
				el: this.$courseImage,
				template: TVE_Dash.tpl( 'courses/cover-image' ),
				prop: 'cover_image'
			} ).render();

			this.authorImage = this.handleAuthorAvatar( this.$authorAvatar );

			if ( this.model.get( 'author' ) && this.model.get( 'author' ).get( 'biography_type' ) === 'custom_bio' ) {
				this.$( '#tva-course-author-bio' ).val( 'custom_bio' );
				this.$authorCustomBioWrapper.show();
			}

			TVE_Dash.data_binder( this );

			/**
			 * do not do data binder after this method
			 */
			toggleVideoDescription.apply( this );

			return this;
		},

		/**
		 * Handles the author image manipulation
		 *
		 * @param {jQuery} $el
		 */
		handleAuthorAvatar: function ( $el ) {

			if ( this.authorImage ) {
				this.authorImage.setImage( this.model.get( 'author' ).get( 'avatar_url' ) );
				return;
			}

			return new ImageUpload( {
				model: this.model.get( 'author' ),
				el: $el,
				prop: 'avatar_url'
			} ).render();
		},

		/**
		 * Toggle textarea for custom author biography if specific option is selected
		 * - method called from html dataset
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 * @return {undefined|void}
		 */
		onAuthorDropdownChange: function ( event, dom ) {

			this.changeAuthorBio( dom.value );

			return event.stopPropagation();
		},

		/**
		 * Change the author biography source
		 *
		 * @param {String} option
		 * @param {Boolean} [clearCustomBio] whether or not to clear the custom biography settings
		 */
		changeAuthorBio( option, clearCustomBio = false ) {
			this.model.get( 'author' ).set( 'biography_type', option );
			const _method = option === 'custom_bio' ? 'show' : 'hide';
			this.$authorCustomBioWrapper[ _method ]();
			if ( _method === 'hide' && clearCustomBio ) {
				this.$authorCustomBioWrapper.val( '' ).trigger( 'change' );
				if ( this.authorMCE && typeof this.authorMCE.setContent === 'function' ) {
					this.authorMCE.setContent( '' );
				}
			}
			this.$( '#tva-course-author-bio' ).val( option );
		}
	} );

	/**
	 * Toggle for video settings form
	 * @return {jQuery}
	 */
	function toggleVideoDescription() {

		if ( this.model.get( 'has_video' ) === false ) {
			return this.$videoSettings.empty().hide();
		}

		const formView = new MediaSettingsView( {
			types: [ 'youtube', 'vimeo', 'wistia', 'custom' ],
			model: this.model.get( 'video' ),
			el: this.$videoSettings
		} );

		return formView.render().$el.show();
	}
} )( jQuery );
