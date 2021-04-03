( function ( $ ) {

	const WPMediaView = require( './../../wp-media' );
	const MediaSettingsView = require( './../../media-settings' );
	const BaseItemFormView = require( './base' );

	/**
	 * Lesson Form View
	 * - used for add and edit new lesson
	 */
	module.exports = BaseItemFormView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/forms/lesson' ),
		/**
		 * @property {jQuery} select dropdown for lesson types
		 */
		$types: null,
		/**
		 * Bind some events
		 */
		afterInitialize: function () {

			this.listenTo( this.model, 'change:lesson_type', function ( model, value ) {
				this.toggleOptions( value );
			} );
		},
		/**
		 * Apply some other changes after the view has been rendered
		 */
		afterRender: function () {

			this.$types = this.$( '#tva-lesson-type' );

			appendOptionsToSelect( this.$types, TVA.lessonTypes )
				.val( this.model.get( 'lesson_type' ) );

			this.$( '#tva-comment-status' ).val( this.model.get( 'comment_status' ) );

			TVA.Utils.renderMCE( 'tva-lesson-description', this.model, 'post_excerpt' );

			this.toggleOptions( this.model.get( 'lesson_type' ) );

			new WPMediaView( {
				el: this.$( '#tva-lesson-image' ),
				model: this.model,
				prop: 'cover_image'
			} ).render();

			/**
			 * this one has to be called before any other inside view which has data binder
			 */
			TVE_Dash.data_binder( this );

			new MediaSettingsView( {
				types: [ 'youtube', 'vimeo', 'wistia', 'custom' ],
				model: this.model.get( 'video' ),
				el: this.$( '#tva-lesson-video-options' )
			} ).render();

			new MediaSettingsView( {
				types: [ 'soundcloud', 'custom' ],
				model: this.model.get( 'audio' ),
				el: this.$( '#tva-lesson-audio-options' )
			} ).render();
		},
		/**
		 * Based on type shows specific options and hides all the others
		 * @param {string} type
		 */
		toggleOptions: function ( type ) {
			this.$( '#tva-lesson-options >' ).hide();
			this.$( `#tva-lesson-${type}-options` ).show();
		}
	} );

	/**
	 * Appends options to the dropdown
	 * @param {jQuery} $select
	 * @param {Array} types
	 * @return {jQuery}
	 */
	function appendOptionsToSelect( $select, types ) {
		types.forEach( function ( type ) {
			const $option = $( '<option/>' )
				.val( type )
				.text( `${TVE_Dash.upperFirst( type )} lesson` );
			$select.append( $option );
		} );
		return $select;
	}
} )( jQuery );
