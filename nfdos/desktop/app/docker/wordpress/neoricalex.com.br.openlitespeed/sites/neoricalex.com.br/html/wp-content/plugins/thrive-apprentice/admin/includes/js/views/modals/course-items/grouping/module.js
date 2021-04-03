( function ( $ ) {
	const ChapterGrouping = require( './chapter' );
	const Module = require( '../../../../models/module' );

	module.exports = ChapterGrouping.extend( {
		template: TVE_Dash.tpl( 'courses/grouping/module' ),

		/**
		 * Prepare the selected items in order to correctly process them
		 *
		 * @param {Backbone.Model[]} selectedItems
		 *
		 * @return {Backbone.Model[]}
		 */
		prepareSelection( selectedItems ) {
			/**
			 * If there are chapters selected, ignore all lesson selections
			 */
			const hasChapterSelection = selectedItems.filter( item => item.getType() === 'chapter' );

			if ( hasChapterSelection && hasChapterSelection.length ) {
				selectedItems = selectedItems.filter( item => item.getType() === 'chapter' ); // only keep chapters
			}

			return selectedItems;
		},

		/**
		 * Setup the orphan items (the unselected items that would possibly need to be grouped in another chapter)
		 */
		setupOrphans() {
			this.selectedItems.some( item => {
				const parent = item.getParent();
				let siblings = null;

				if ( ! parent ) { // this selected items are directly in course
					siblings = this.structure;
				} else if ( parent.getType() === 'chapter' && ! parent.getParent() ) {
					/* grouping lessons from a chapter into a new module - if chapter does not have a parent, need to group the chapter into a orphan module */
					siblings = this.structure;
				}

				/**
				 * Check through all the siblings of the current lesson and mark the ones that are not selected as orphans
				 */
				if ( siblings ) {
					this.orphans = siblings.filter( item => ! this.selectedItems.includes( item ) );

					return true;
				}
			} );
		},

		/**
		 * Get the ID of the parent item where the new Item (Chapter / Module) should be created
		 *
		 * @return {Number}
		 */
		getNewItemParent() {
			return 0; // modules should always be created at root level
		},

		/**
		 * Get the order at which the new item needs to be inserted.
		 *
		 * If there are no modules, insert a module at order `0`. If there are modules, insert new module at the end.
		 *
		 * @return {Number}
		 */
		getNewItemOrder() {
			const modules = this.structure.findItemsByOptions( {post_type: 'tva_module'} );

			return modules && modules.length || 0;
		},

		/**
		 * Instantiate a new Module model
		 *
		 * @param {Number} order ordering index of the new chapter
		 * @param {Number} parent ID of the post parent ( eventually a module )
		 * @param {Number[]} itemIds children IDs
		 *
		 * @return {Chapter}
		 */
		newModel( order, parent, itemIds ) {
			return new Module( {
				post_parent: parent,
				type: 'module',
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
			return `${TVA.routes.modules}/group_as_module`;
		},

		/**
		 * Get the message that should be displayed after a successful save
		 *
		 * @return {String}
		 */
		successMessage() {
			return TVA.t.success_module_group;
		},
	} );
} )( jQuery );
