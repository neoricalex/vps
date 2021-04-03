( function ( $ ) {
	const Base = require( '../content-base' );
	const IconPicker = require( '../modals/icons' );

	const TopicView = Base.extend( {
		/**
		 * DOM class name
		 */
		className: 'tva-topic-item tva-flex tva-align-center mb-20',

		/**
		 * Underscore template
		 *
		 * @type {Function}
		 */
		template: TVE_Dash.tpl( 'topics/item' ),

		/**
		 * Message to be displayed after a topic has been deleted
		 *
		 * @type {String}
		 */
		deletedMessage: TVA.t.topic_deleted,

		/**
		 * Reference to the parent view (topics dashboard)
		 *
		 * @type {Base}
		 */
		parent: null,

		/**
		 * List of events, extended to include some special events
		 */
		events: {
			...Base.prototype.events,
			'change .tva-title-events': 'onTitleChange',
			'blur .tva-title-events': 'onTitleBlur',
			'keyup .tva-title-events': 'onTitleKeyup',
		},

		/**
		 * Store a parent reference passed in options
		 *
		 * @param {*} options
		 */
		afterInitialize( options ) {
			this.parent = options.parent;
			this.model.on( 'change', this.render.bind( this ) );
		},

		/**
		 * Initialize spectrum on click, because of massive performance hit it has
		 *
		 * @param {jQuery.Event} event
		 */
		spectrum( event ) {
			const {model, parent} = this;

			const $input = $( event.currentTarget.parentNode ).find( `input[data-field="${event.currentTarget.dataset.field}"]` ).spectrum( {
				containerClassName: 'tva-color-picker',
				showPalette: false,
				allowEmpty: false,
				showInitial: false,
				showButtons: true,
				chooseText: 'Apply',
				cancelText: 'Cancel',
				showInput: true,
				preferredFormat: "hex",
				hide: function ( color ) {
					color = color.toString();
					parent.$el.removeClass( 'tva-disabled' );
					if ( color !== model.get( this.dataset.field ) ) {
						model.persist( {[ this.dataset.field ]: color.toString()} );
					}
				},
				show: function () {
					parent.$el.addClass( 'tva-disabled' );
				},
				...this.spectrumOptions()
			} );

			/* show it on the next animation frame */
			requestAnimationFrame( () => $input.spectrum( 'show' ) );

			return false;
		},

		spectrumOptions() {
			return {};
		},

		/**
		 * Render using this.template, then instantiate the necessary spectrum color pickers
		 *
		 * @return {*}
		 */
		render() {
			Base.prototype.render.apply( this, arguments );

			/* auto-focus title input if it's the case */
			this.$( '.tva-title-events' ).select().focus();

			this.toggleLoader();

			return this;
		},

		/**
		 * Transform the title into a text input
		 */
		editing() {
			this.model.set( 'editing', true );
		},

		/**
		 * Called when user finished editing the title (`change` event)
		 *
		 * @param {jQuery.Event} event event object
		 */
		onTitleChange( event ) {
			const input = event.currentTarget;
			const newTitle = input.value.trim();

			if ( ! newTitle ) {
				input.classList.add( 'tva-error' );
				input.focus();

				return false;
			}

			this.preventBlur = true;

			if ( newTitle === this.model.get( 'title' ) ) {
				this.model.set( 'editing', false );

				return;
			}

			this.model.persist( {title: newTitle}, {
				loader: true,
				showSuccess: true,
				...( this.saveOptions() || {} )
			} );
		},

		/**
		 * Keyup event triggered on title input
		 * If ESC => cancel editing
		 * ENTER is treated in the `onTitleChange` callback
		 *
		 * @param {jQuery.Event} event
		 */
		onTitleKeyup( event ) {
			// ESC key
			if ( event.which === 27 ) {
				this.preventBlur = true;
				this.model.set( 'editing', false );
			}
		},

		/**
		 * Blur event triggered on title input
		 *
		 * @param {jQuery.Event} event
		 */
		onTitleBlur( event ) {
			if ( this.preventBlur ) {
				delete this.preventBlur;
			} else {
				this.model.set( 'editing', false );
			}
		},

		/**
		 * Open a modal for choosing a topic icon
		 *
		 * @return {boolean}
		 */
		openIconPicker() {
			this.openModal( IconPicker, {
				topic_title: this.model.get( 'title' ),
				model: this.model,
				'max-width': '865px',
				'max-height': '80vh',
				width: 'auto',
				in_duration: 200,
				out_duration: 300,
				className: 'tva-default-modal-style tvd-modal'
			} );

			return false;
		},

		/**
		 * Open the WP gallery picker
		 *
		 * @return {boolean}
		 */
		openImagePicker() {
			TopicView.initMedia().then( attachment => {
				this.model.persist( {
					icon: attachment.url,
					icon_type: 'icon',
				} );
			} );

			return false;
		},

		/**
		 * Get the constructor for the "Delete Confirmation" modal
		 *
		 * @return {Function}
		 */
		getConfirmationModal() {
			return require( '../modals/topics/confirm-delete' );
		},

		/**
		 * Open a modal with a "Are you sure you want to delete this?" message
		 *
		 * @return {boolean}
		 */
		openDeleteConfirmation() {
			this.openModal( this.getConfirmationModal() ).then( () => {
				this.model.set( 'loading', true );
				const _clone = this.model.clone();

				this.beforeDelete( _clone );

				_clone.destroy()
				      .done( () => TVE_Dash.success( this.deletedMessage ) )
				      .always( () => this.model.collection.remove( this.model ) );
			} );

			return false;
		},

		/**
		 * Triggered before deleting a topic
		 *
		 * @param {Topic} itemClone
		 */
		beforeDelete( itemClone ) {
			/**
			 * Update all courses that have this topic to have the "General" topic (ID = 0)
			 */
			TVA.courses.where( {topic: itemClone.get( 'ID' )} ).forEach( course => {
				course.set( 'topic', 0, {silent: true} );
				course.saveState();
			} );
		},
		/**
		 * Toggle the loading state
		 */
		toggleLoader() {
			this.$el.tvaToggleLoader( 30, !! this.model.get( 'loading' ), {background: '#eaefef'} );
		},

		/**
		 * Get a map of options to send as parameter to the `persist` function
		 */
		saveOptions() {
		}
	}, {
		/**
		 * Singleton initialization for a media frame
		 *
		 * @return {Promise} the returned promise is always resolved when a file has been selected
		 */
		initMedia() {
			const frame = TopicView.mediaFrame || ( TopicView.mediaFrame = wp.media( {
				title: 'Select or upload an image',
				button: {
					text: 'Use this image'
				},
				library: {type: 'image'},
				multiple: false
			} ) );

			frame.open();

			return new Promise( resolve => {
				frame.off( 'select' )
				     .on( 'select', () => resolve( frame.state().get( 'selection' ).first().toJSON() ) );
			} );
		}
	} );

	module.exports = TopicView;
} )
( jQuery );
