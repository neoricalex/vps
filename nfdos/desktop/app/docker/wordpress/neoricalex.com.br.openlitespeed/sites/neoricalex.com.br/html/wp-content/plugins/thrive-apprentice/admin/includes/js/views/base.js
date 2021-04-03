( function ( $ ) {

	/**
	 * remove tvd-invalid class for all inputs in the view's root element
	 *
	 * @returns {Backbone.View}
	 */
	Backbone.View.prototype.tvaClearError = function () {
		this.$( '.tvd-invalid' ).removeClass( 'tvd-invalid' );
		this.$( 'select' ).trigger( 'tvaclear' );
		return this;
	};

	/**
	 *
	 * @param {Backbone.Model|object} [model] backbone model or error object with 'field' and 'message' properties
	 *
	 * @returns {Backbone.View|undefined}
	 */
	Backbone.View.prototype.tvaShowErrors = function ( model ) {
		model = model || this.model;

		if ( ! model ) {
			return;
		}

		var err = model instanceof Backbone.Model ? model.validationError : model,
			self = this,
			$all = $();

		function showError( error_item ) {
			if ( typeof error_item === 'string' ) {
				return TVE_Dash.err( error_item );
			}
			$all = $all.add( self.$( '[data-field=' + error_item.field + ']' ).addClass( 'tvd-invalid' ).each( function () {
				var $this = $( this );
				if ( $this.is( 'select' ) ) {
					$this.trigger( 'tvderror', error_item.message );
				} else {
					$this.next( 'label' ).attr( 'data-error', error_item.message )
				}
			} ) );
		}

		if ( $.isArray( err ) ) {
			_.each( err, function ( item ) {
				showError( item );
			} );
		} else {
			showError( err );
		}
		$all.not( '.tvd-no-focus' ).first().focus();
		/* if the first error message is not visible, scroll the contents to include it in the viewport. At the moment, this is only implemented for modals */
		this.scrollFirstError( $all.first() );

		return this;
	};

	/**
	 * scroll the contents so that the first errored input is visible
	 * currently this is only implemented for modals
	 *
	 * @param {Object} $input first input element that has the error
	 *
	 * @returns {Backbone.View}
	 */
	Backbone.View.prototype.scrollFirstError = function ( $input ) {
		if ( ! ( this instanceof TVE_Dash.views.Modal ) || ! $input.length ) {
			return this;
		}
		var input_top = $input.offset().top,
			content_top = this.$_content.offset().top,
			scroll_top = this.$_content.scrollTop(),
			content_height = this.$_content.outerHeight();
		if ( input_top >= content_top && input_top < content_height + content_top - 50 ) {
			return this;
		}

		this.$_content.animate( {
			'scrollTop': scroll_top + input_top - content_top - 40 // 40px difference
		}, 200, 'swing' );
	};

	const modalBase = require( './modals/base' );

	/**
	 * Base View from which each view should extend from
	 */
	module.exports = Backbone.View.extend( {
		zClipCopiedClass: 'tva-copied',
		/**
		 * An array of child views to be destroyed when this view is destroyed
		 */
		$$childViews: [],
		/**
		 * Allows template to be set dynamically
		 * @param {*} options
		 */
		initialize: function ( options ) {
			if ( options && options.template ) {
				this.template = options.template;
			}
			this.afterInitialize( options );
		},
		/**
		 * Default events
		 * - css class on an HTML element which might call a method defined in a data-fn="" attribute
		 */
		events: {
			'click .click': '_call',
			'change .change': '_call',
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
		 * Appends the template's html into $el
		 *
		 * @returns {{Backbone.View}}
		 */
		render: function () {

			if ( typeof this.template === 'function' ) {
				this.$el.html( this.template( {model: this.model} ) );
			}

			setTimeout( () => this.bindZclip(), 200 );

			/**
			 * Used to do stuff after the template is applied.
			 *
			 * Ex: declare the view variables
			 */
			this.afterRender();

			return this;
		},

		/**
		 * Opens a new modal
		 *
		 * @param {modalBase} modalView
		 * @param {Object} params
		 */
		openModal: function ( modalView, params = {} ) {

			if ( _.isObject( modalView ) && ( modalView.prototype instanceof modalBase || modalView.prototype instanceof TVE_Dash.views.ModalSteps || modalView.prototype instanceof TVE_Dash.views.Modal ) ) {
				params =
					{
						...{
							'max-width': 'calc(100% - 40px)',
							width: '850px',
							in_duration: 200,
							out_duration: 300,
							className: 'tvd-modal tva-modal-create',
							dismissible: true
						}, ...params
					};

				return TVE_Dash.modal( modalView, params );
			} else {
				console.warn( 'Invalid type of modal view' )
			}
		},

		/**
		 * Changes the route hash and so a new view is rendered
		 *
		 * @param {String} route
		 */
		changeView: function ( route ) {
			TVA.Router.navigate( route, {trigger: true} );
		},

		/**
		 * Binds ZClip to the view copy buttons
		 */
		bindZclip: function () {

			this.$el.find( '.tva-zclip' ).each( ( index, element ) => {
				const $elem = $( element ),
					$input = $elem.prev().on( 'click', function ( event ) {
						this.select();
						event.preventDefault();
						event.stopPropagation();
					} );

				try {
					$elem.zclip( {
						path: TVE_Dash_Const.dash_url + '/js/util/jquery.zclip.1.1.1/ZeroClipboard.swf',
						copy: () => {
							return $elem.prev().val();
						},
						afterCopy: () => {
							$input[ 0 ].select();
							$elem.removeClass( this.zClipCopiedClass ).addClass( this.zClipCopiedClass );

							setTimeout( () => {
								$elem.removeClass( this.zClipCopiedClass );
							}, 2000 );
						}
					} );
				} catch ( e ) {
					console.warn( 'Error embedding zclip - most likely another plugin is messing this up' ) && console.warn( e );
				}
			} );
		},

		/**
		 * Overridden in child views
		 */
		afterRender: $.noop,
		afterInitialize: $.noop,

		/**
		 * Add one or more child view reference. Can receive any number of arguments
		 *
		 * @param {Backbone.View|Backbone.View[]} views
		 *
		 * @return {Backbone.View}
		 */
		addChild( ...views ) {
			if ( Array.isArray( views[ 0 ] ) ) {
				views = views[ 0 ];
			}
			this.$$childViews = this.$$childViews.concat( views );

			return this;
		},
		/**
		 * Completely destroy the view and un-delegate any events
		 */
		destroy() {
			this.stopListening();
			this.undelegateEvents();
			this.$el.removeData().off();

			this.$$childViews.forEach( view => {
				if ( typeof view.destroy === 'function' ) {
					view.destroy();
				}
			} );

			return this;
		}
	} );
} )( jQuery );
