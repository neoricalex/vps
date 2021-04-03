( function ( $ ) {

	const selectCollection = require( './../collections/select' );
	const BaseView = require( './base' );

	/**
	 * Main view that allows adding a new item to the list
	 */
	const AddItem = BaseView.extend( {
		/**
		 * Main template
		 *
		 * @property {Function}
		 */
		template: TVE_Dash.tpl( 'select/add-item' ),

		/**
		 * Input control template
		 *
		 * @property {Function}
		 */
		inputTemplate: _.template( '<input type="text" placeholder="<#= this.str.title #>" class="">', TVE_Dash.templateSettings ),

		/**
		 * Various strings used throughout the functionality
		 */
		str: {
			title: 'Add new item',
			save: 'Save',
			err: 'Required field missing'
		},

		/**
		 * DOM events
		 */
		events: {
			...BaseView.prototype.events,
			'keyup input[type="text"]': 'onKeyup',
		},

		/**
		 * Initializes the view. Setup a state model that will handle re-rendering of the view.
		 * Also allows extending on the fly
		 *
		 * @param options
		 */
		initialize( options ) {
			this.state = new Backbone.Model( {
				step: 'default',
			} );

			/**
			 * Set each option as a field for this object
			 */
			$.extend( true, this, options );

			this.listenTo( this.state, 'change', this.render.bind( this ) );
		},

		/**
		 * Keyup listener on the "input" state
		 * Handles ENTER and ESC
		 *
		 * @param event
		 */
		onKeyup( event ) {
			switch ( event.which ) {
				case 13:
					// enter
					this.save();
					break;
				case 27:
					// escape
					this.reset();
					break;
			}
		},

		/**
		 * Make sure the input is always focused
		 */
		afterRender() {
			this.$input = this.$( 'input' ).filter( ':visible' ).not( '.tva-dropdown-thumb input' );
			this.focusInput();
		},

		/**
		 * Focus input on the next animation frame
		 */
		focusInput() {
			requestAnimationFrame( () => this.$input.focus() );
		},

		/**
		 * Render input state. Allows extending with custom input states
		 *
		 * @return {*}
		 */
		renderInput() {
			return this.inputTemplate( {} );
		},

		/**
		 * Show the input state
		 * @return {boolean}
		 */
		showInput() {
			this.state.set( 'step', 'input' );

			return false;
		},

		/**
		 * Reset the view to its default state
		 */
		reset() {
			this.$input.val( '' ).removeClass( 'tvd-validate tvd-invalid' );
			this.state.set( 'step', 'default' );
		},

		/**
		 * Save the newly added item
		 *
		 * @return {boolean}
		 */
		save() {
			if ( ! this.$input.val().trim() ) {
				this.$input.addClass( 'tvd-validate tvd-invalid' );
				TVE_Dash.err( this.str.err );
				this.focusInput();

				return false;
			}

			this.$input.removeClass( 'tvd-validate tvd-invalid' );

			const model = this.getModelForSave(); // this is always needed

			this.$el.tvaToggleLoader();
			model.save().done( response => {
				if ( ! response.id && response.ID ) {
					response.id = response.ID;
				}
				/**
				 * Add new model to the dropdown collection
				 */
				this.addToCollection( response );

				/**
				 * Close the dropdown list and hide the loader
				 */
				this.dropdown.closeSelect();
				this.$el.tvaToggleLoader( false );

				if ( typeof this.afterSave === 'function' ) {
					this.afterSave( response, model );
				}

				/**
				 * Finally, select the newly added item
				 */
				this.dropdown.selectItem( this.dropdown.collection.findWhere( {id: response.id} ) );
			} );

			return false;
		},

		/**
		 * Overwrite if you need to add it at the end. By default it will add it as the first item
		 *
		 * @param response
		 */
		addToCollection( response ) {
			this.dropdown.collection.unshift( response );
		},

		/**
		 * Destroy the view and remove any possible Spectrum colorpickers
		 */
		destroy() {
			this.$( '.tva-colorpicker' ).each( function () {
				const $this = $( this );
				if ( $this.data( 'spectrum.id' ) ) {
					$this.spectrum( 'destroy' );
				}
			} );

			BaseView.prototype.destroy.call( this );
		}
	} );

	/**
	 * Base select(dropdown) View
	 * - renders thumb for selected item and thumbs for each item in list
	 */
	module.exports = BaseView.extend( {
		/**
		 * @property {string} css thumb class
		 */
		thumbCssClass: 'tva-dropdown-thumb',
		/**
		 * @property {string} css list class
		 */
		listCssClass: 'tva-dropdown-list',
		/**
		 * @property {string} css class for list item
		 */
		listItemCssClass: 'tva-dropdown-list-item',
		/**
		 * @property {string} element css class
		 */
		className: 'tva-dropdown',
		/**
		 * @property template
		 */
		template: TVE_Dash.tpl( 'select' ),
		/**
		 * @property {string}
		 */
		label: null,
		/**
		 * @property {jQuery}
		 */
		$thumb: null,
		/**
		 * Where to render thumb for current list
		 * @property {boolean}
		 */
		renderThumbs: false,
		/**
		 * @property {boolean} whether the item can be deleted
		 */
		deletable: false,
		/**
		 * @property {Object} events
		 */
		events() {
			return {
				...BaseView.prototype.events,
				'click': function ( event ) {
					const $item = $( event.target ).closest( '.' + this.listItemCssClass );
					if ( $item.length ) {
						const id = parseInt( $item.attr( 'data-id' ) );
						return this.selectItem( this.collection.findWhere( {[ this.collection.idAttribute ]: id} ) );
					}
					if ( event.target.tagName.toUpperCase() === 'INPUT' ) {
						return event.stopPropagation();
					}
					/**
					 * If click occurs into the dropdown view, make sure it isn't closed
					 */
					if ( event.target.closest( '.' + this.listCssClass ) ) {
						return;
					}
					this.displayList();
					event.stopPropagation();
				}
			}
		},
		/**
		 * Checks if a specific select collection has been provided
		 * - throws errors if collection does not inherit from select collection
		 * @param {Object} options
		 */
		initialize: function ( options ) {

			$.extend( true, this, options );
			/**
			 * Collection has to be provided on instantiating
			 */
			if ( ! options || ! options.collection ) {
				throw new Error( 'collection has to be provided for this select view' );
			}
			/**
			 * The collection provided has to be at a specific type
			 */
			if ( ! ( options.collection instanceof selectCollection ) ) {
				throw new Error( 'collection has to inherit from specific select collection' );
			}

			this.model = this.collection.getSelectedItem();

			this.collection.on( 'selectionchange', model => this.model = model );
		},
		/**
		 * Renders the template for the selected item provided
		 *
		 * @param {Boolean} [partial] Whether or not to only render the main part or the full element. Useful when you want to keep the dropdown list in place
		 */
		render: function ( partial = false ) {

			if ( ! this.model ) {
				console.error( 'No selected item to be rendered' );
				return this;
			}

			let $main;
			const $content = $( this.template( {
				model: this.model
			} ) );
			/**
			 * If partial render, only replace the main portion of the dropdown ( excluding the dropdown list of items )
			 */
			if ( partial === true && ( $main = this.$( '.tva-dropdown-items' ) ).length ) {
				$main.replaceWith( $content.filter( '.tva-dropdown-items' ) );
			} else {
				this.$el.html( $content );
			}

			/**
			 * If this view does support thumbs rendering then create a new jQuery $element and prepend it
			 * to current view $el
			 */
			if ( this.renderThumbs ) {
				this.renderThumb( this.$el, this.model );
			}

			return this;
		},
		/**
		 * Used in template to display the label for current dropdown
		 * @return {null|string}
		 */
		getLabel: function () {
			return this.label;
		},
		/**
		 * Builds a $thumb and appends it to $wrapper based on the backbone model
		 * @param {jQuery} $wrapper
		 * @param {{Backbone.Model}} model
		 * @return {{Backbone.View}}
		 */
		renderThumb: function ( $wrapper, model ) {

			const $thumb = $( '<div/>' )
				.css( 'background-color', model.get( 'color' ) )
				.addClass( this.thumbCssClass );

			if ( model.get( 'icon_type' ) === 'icon' ) {
				$thumb.css( {
					'background-image': 'url(' + model.get( 'icon' ) + ')'
				} );
			} else if ( model.get( 'icon_type' ) === 'svg_icon' ) {
				$thumb.html( model.get( 'svg_icon' ) );
			} else if ( model.get( 'url' ) ) {
				$thumb.css( {
					'background-image': 'url(' + model.get( 'url' ) + ')'
				} );
			} else if ( model.get( 'avatar_url' ) ) {
				$thumb.css( {
					'background-image': 'url(' + model.get( 'avatar_url' ) + ')'
				} );
			}

			$thumb[ 0 ].style.setProperty( '--thumb-color', model.get( 'color' ) );

			$wrapper.prepend( $thumb );

			return this;
		},
		/**
		 * Appends a $list with $item(s) to the current view
		 * - triggers {tva.display.list} event
		 * @return {jQuery|{Backbone.View}}
		 */
		displayList: function () {

			if ( this.$( '.' + this.listCssClass ).length ) {
				return this.closeSelect();
			}

			this.trigger( 'tva.before.display.list' );

			const $list = $( '<div class="tva-items-holder"></div>' );

			this.collection.each( ( itemModel ) => {

				let $item = $( '<div/>' )
					.addClass( this.listItemCssClass );

				if ( this.renderThumbs ) {
					this.renderThumb( $item, itemModel );
				}
				$item.append( $( '<div/>' ).html( itemModel.get( 'title' ) || itemModel.get( 'name' ) ) );
				$item.attr( 'data-id', itemModel.get( this.collection.idAttribute ) );

				/**
				 * Do not allow deleting the item with id = 0. By convention, this is the default item that cannot be removed.
				 */
				if ( this.deletable && parseInt( itemModel.get( 'id' ) ) !== 0 ) {
					$item.append( `<span class="tva-difficulty-delete click" data-fn="deleteItem" data-id="${itemModel.get( 'id' )}">${TVA.Utils.icon( 'trash-1' )}</span>` );
				}

				$list.append( $item );
			} );

			this.$el.append( $list.wrap( `<div class="${this.listCssClass}"></div>` ).parent() );

			if ( this.add_item ) {
				this.add_item.dropdown = this; // store a reference to the dropdown view
				this.addItemView = new AddItem( this.add_item );
				this.addChild( this.addItemView );
				$list.after( this.addItemView.render().$el );
			}

			this.trigger( 'tva.display.list', $list, this );

			return this;
		},
		/**
		 * Set the model pass as parameter to current view and re-render the while view for the new model
		 * - triggers {tva.dropdown.item.selected}
		 * @param {Backbone.Model} model
		 * @param {Boolean} partialRender Whether or not to only render the main dropdown area (and not the dropdown list)
		 *
		 * @return {Backbone.View}
		 */
		selectItem: function ( model, partialRender = false ) {

			this.model = model;
			this.collection.setSelected( this.model );
			this.render( partialRender );

			this.trigger( 'tva.dropdown.item.selected', this.model, this.collection, partialRender );

			return this;
		},
		/**
		 * Closes the view
		 *
		 * @returns {JQuery<HTMLElement>}
		 */
		closeSelect: function () {
			if ( this.addItemView ) {
				this.addItemView.destroy();
			}

			return this.$( `.${this.listCssClass}` ).remove();
		},
		/**
		 * Delete item from dropdown list
		 */
		deleteItem: $.noop
	} );
} )( jQuery );
