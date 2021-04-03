( function ( $ ) {

	const BaseView = require( './base' );

	/**
	 * Edit title view
	 * @type {Backbone.View}
	 */
	module.exports = BaseView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'utils/input-title' ),
		/**
		 * Append new events beside of those defined in parent
		 * @return {Object}
		 */
		events: function () {
			return $.extend( BaseView.prototype.events, {
				'keyup input': 'keyup',
				'click input': event => event.stopPropagation(),
				'blur input': 'cancel',
			} );
		},
		/**
		 * Extend parent with more options/prop
		 * @param options
		 */
		afterInitialize: function ( options ) {
			this.$titleTextHolder = options.titleTextHolder;

			$.extend( true, this, options );
		},
		/**
		 * Apply some logic after render
		 */
		afterRender: function () {

			this.$input = this.$( 'input' );

			setTimeout( () => {
				this.$input.select().focus();
			}, 0 );

			this.$titleTextHolder.hide();
		},
		/**
		 * Called change event occurred on input
		 *
		 * @param {Event} event
		 * @param {HTMLInputElement} dom
		 */
		inputChanged: function ( event, dom ) {
			this.model.set( 'title', dom.value.trim() );

			this.apply();
		},
		/**
		 * Called on every key pressed on the input
		 *
		 * @param {Event} event
		 */
		keyup: function ( event ) {
			event.which === 27 && this.cancel();
		},
		/**
		 * Cancel the change
		 */
		cancel: function () {

			this.$titleTextHolder.show();

			this.destroy().remove();
		},
		/**
		 * Apply the change
		 */
		apply: function () {
			if ( _.isEmpty( this.model.get( 'title' ) ) ) {
				TVE_Dash.err( 'This field can not be left empty' );

				return;
			}

			this.$titleTextHolder.html( this.model.get( 'title' ) + TVA.Utils.icon( 'pencil-custom' ) ).show();

			this.destroy().remove();

			this.save( this.model.get( 'title' ) );
		},
		/**
		 * Override for each usage
		 */
		save: $.noop,
	} );
} )( jQuery );
