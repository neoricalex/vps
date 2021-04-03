( function ( $ ) {

	module.exports = TVE_Dash.views.Modal.extend( {
		zClipCopiedClass: 'tva-copied',
		template: '',
		currentStep: 0,
		previouslyStep: 0,
		stepSelector: '.tva-modal-step',
		events: {
			'click .click': '_call',
			'input .input': '_call',
		},

		/**
		 * Call method for specific events
		 *
		 * @param {Event} event
		 * @returns {*}
		 */
		_call: function ( event ) {
			const _method = event.currentTarget.dataset.fn;

			if ( typeof this[ _method ] === 'function' ) {
				return this[ _method ].call( this, event, event.currentTarget );
			}
		},

		/**
		 * Called after the view has been render
		 *
		 * @returns {exports}
		 */
		afterRender: function () {
			this.$steps = this.$el.find( this.stepSelector ).hide();

			this.$steps.length && this.gotoStep( 0 );

			this.bindZclip();
			/**
			 * Called after render is done.
			 */
			this.dom();

			return this;
		},
		/**
		 * Calls zClip Function after render
		 */
		bindZclip: function () {
			const BaseView = require( '../content-base' );

			setTimeout( () => BaseView.prototype.bindZclip.call( this, null ), 200 );
		},

		/**
		 * Hides the view steps and shows the step provided as argument
		 *
		 * @param {number} index
		 *
		 * @returns {exports}
		 */
		gotoStep: function ( index ) {
			this.$steps.hide().eq( index ).show();
			this.previouslyStep = this.currentStep;
			this.currentStep = index;

			/**
			 * Call a dynamic function after step X has been initialized
			 */
			if ( typeof this[ `afterStep${index}Loaded` ] === 'function' ) {
				this[ `afterStep${index}Loaded` ]();
			}

			return this;
		},
		/**
		 * Returns to Previously Step
		 *
		 * Useful when there is a system of steps with one common final step and you need to go back to the step where you came from
		 *
		 * @returns {exports}
		 */
		goToPreviouslyStep: function () {
			this.$steps.length && this.gotoStep( this.previouslyStep );

			return this;
		},
		/**
		 * Jump to a specific step
		 *
		 * @param {event} event
		 * @param {Element} dom
		 * @returns {exports}
		 */
		jumpToStep: function ( event, dom ) {
			const step = parseInt( dom.getAttribute( 'data-step' ) );

			this.$steps.length && this.allowJumpToStep( step ) && this.gotoStep( step );

			return this;
		},

		/**
		 * Checks if the system is allowed to jump to step X
		 *
		 * @param {string} step
		 *
		 * @returns {boolean}
		 */
		allowJumpToStep: function ( step ) {
			return true;
		},

		/**
		 * @return {jQuery}
		 */
		getCurrentStep: function () {
			return $( this.$steps[ this.currentStep ] );
		},

		/**
		 * Called after render is done.
		 *
		 * Must be extended in child objects
		 */
		dom: $.noop,
	} );
} )( jQuery );
