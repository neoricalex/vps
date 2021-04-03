( function ( $ ) {
	const Base = TVE_Dash.views.ModalSteps;
	const Chapter = require( '../../../../models/chapter' );

	module.exports = Base.extend( {
		template: TVE_Dash.tpl( 'courses/grouping/chapter' ),
		/**
		 * Parent view - main itemsTabContent
		 */
		parent: null,
		/**
		 * Main Course reference
		 *
		 * @property {Backbone.Model}
		 */
		course: null,

		/**
		 * Course Structure reference
		 *
		 * @property {Backbone.Collection}
		 */
		structure: null,

		/**
		 * @property {Backbone.Model[]} IDs of lessons that need to be grouped in yet another chapter
		 */
		orphans: [],

		/**
		 *  Array of selected items
		 *  @property {Backbone.Model[]}
		 */
		selectedItems: [],

		events() {
			return {
				...Base.prototype.events,
				'click .tvd-modal-save': 'save',
			};
		},

		/**
		 * Initializer. Calculates whether or not there are "orphan" lessons that need to be grouped in another chapter
		 *
		 * @param {Object} options
		 */
		initialize( options ) {
			this.setup( options );

			Base.prototype.initialize.call( this, options );

			this.setupOrphans();
		},

		/**
		 * Setup the orphan items (the unselected items that would possibly need to be grouped in another chapter)
		 */
		setupOrphans() {
			this.selectedItems.some( lesson => {
				const parent = lesson.getParent();
				let siblings = null;

				if ( ! parent ) { // this means lessons are directly in course
					siblings = this.structure;
				} else if ( parent.getType() === 'module' ) {
					/* lessons directly in the module --> check for orphans */
					siblings = parent.get( 'structure' );
				}

				/**
				 * Check through all the siblings of the current lesson and mark the ones that are not selected as orphans
				 */
				if ( siblings ) {
					this.orphans = siblings.filter( lesson => ! this.selectedItems.includes( lesson ) );

					return true;
				}
			} );
		},

		/**
		 * Prepare the selected items in order to correctly process them
		 *
		 * @param {Backbone.Model[]} selectedItems
		 *
		 * @return {Backbone.Model[]}
		 */
		prepareSelection( selectedItems ) {
			return selectedItems;
		},

		/**
		 * Store references to the needed objects from the main view
		 *
		 * @param {Object} options
		 */
		setup( options ) {
			this.parent = options.parent;
			this.course = this.parent.model;
			this.structure = this.parent.collection;
			this.selectedItems = this.prepareSelection( options.parent.selected );
		},

		/**
		 * Get the ID of the parent item where the new Item (Chapter / Module) should be created
		 *
		 * @return {Number}
		 */
		getNewItemParent() {
			const module = this.selectedItems[ 0 ].getModule();

			return module ? module.get( 'ID' ) : 0;
		},

		/**
		 * Get the order at which the new item needs to be inserted
		 *
		 * @return {Number}
		 */
		getNewItemOrder() {
			const module = this.selectedItems[ 0 ].getModule();

			return this.structure.countChildren( module ? module.get( 'ID' ) : 0 );
		},

		/**
		 * Init the 2 forms - "orphan" chapter form and new chapter form
		 */
		afterRender() {
			Base.prototype.afterRender.call( this );

			const newItemParent = this.getNewItemParent();
			let newItemOrder = this.getNewItemOrder();

			if ( this.orphans.length ) {
				/**
				 * if first orphan is before the first selected item, the "orphan" new chapter/module will be placed before the newly created chapter / module.
				 */
				let orphanOrder = newItemOrder;
				if ( this.orphans[ 0 ].get( 'order' ) < this.selectedItems[ 0 ].get( 'order' ) ) {
					newItemOrder ++; // the new chapter needs to be created after the chapter containing orphans
				} else {
					orphanOrder = newItemOrder + 1;
				}
				this.orphanItemForm = new Backbone.View( {
					model: this.newModel( orphanOrder, newItemParent, this.orphans.map( item => item.get( 'ID' ) ) ),
					el: this.$( '.tva-orphans-form' )[ 0 ],
				} );

				TVE_Dash.data_binder( this.orphanItemForm );
			}

			this.itemForm = new Backbone.View( {
				model: this.newModel( newItemOrder, newItemParent, this.selectedItems.map( item => item.get( 'ID' ) ) ),
				el: this.$( '.tva-chapter-form' )[ 0 ],
			} );
			TVE_Dash.data_binder( this.itemForm );
		},

		/**
		 * Validate the "Orphan" chapter model if needed.
		 *
		 * @return {boolean}
		 */
		beforeNext() {
			switch ( this.currentStep ) {
				case 1:
					if ( this.orphans.length && ! this.orphanItemForm.model.isValid() ) {
						/* validate chapter for orphan lessons */
						return false;
					}
					break;
			}
		},

		/**
		 * Instantiate a new Chapter model
		 *
		 * @param {Number} order ordering index of the new chapter
		 * @param {Number} parent ID of the post parent ( eventually a module )
		 * @param {Number[]} itemIds children IDs
		 *
		 * @return {Chapter}
		 */
		newModel( order, parent, itemIds ) {
			return new Chapter( {
				post_parent: parent,
				type: 'chapter',
				order,
				course_id: this.course.get( 'id' ),
				item_ids: itemIds,
			} );
		},

		/**
		 * Get the ajax URL where the POST should be sent
		 *
		 * @return {String}
		 */
		url() {
			return `${TVA.routes.chapters}/group_as_chapter`;
		},

		/**
		 * Get the message that should be displayed after a successful save
		 *
		 * @return {String}
		 */
		successMessage() {
			return TVA.t.success_chapter_group;
		},

		/**
		 * Save the new chapter and (possibly) another chapter containing orphan lessons
		 *
		 * @return {boolean}
		 */
		save() {
			if ( ! this.itemForm.model.isValid() ) {
				return false;
			}

			let items = [];
			if ( this.orphans.length ) {
				items.push( this.orphanItemForm.model.toJSON() );
			}
			items.push( this.itemForm.model.toJSON() );

			this.showLoader();

			wp.apiRequest( {
				url: this.url(),
				type: 'post',
				data: {
					course_id: this.course.get( 'id' ),
					items
				}
			} ).done( response => {
				this.structure.reset( response );
				this.close();
				TVE_Dash.success( this.successMessage() );
			} );
		}
	} );
} )( jQuery );
