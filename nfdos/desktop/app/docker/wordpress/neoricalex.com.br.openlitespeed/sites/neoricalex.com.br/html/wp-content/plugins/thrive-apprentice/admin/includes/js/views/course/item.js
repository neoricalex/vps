( function ( $ ) {

	const BaseView = require( './../base' );
	const CourseStructureCollection = require( './../../collections/structure' );
	const InputTitle = require( './../input-title' );

	/**
	 * Course Item View
	 * - to be extended by specific course item views
	 * @type {Backbone.View} for Course Item
	 */
	module.exports = BaseView.extend( {
		/**
		 * @property {string} for element css class name
		 */
		className: 'tva-box tva-collapsed tva-course-item',
		/**
		 * @property {number} number in list: Lesson 1,2,3
		 */
		numberInList: 0,
		/**
		 * @property {string} of css class for child items
		 * - e.g.: tva_module, tva_chapter, tva_lesson
		 */
		childrenItemsSelector: '',
		/**
		 * @property
		 */
		connectWith: false,
		/**
		 * IDs of expanded items
		 *
		 * @property {Set<Number>}
		 */
		expanded: null,
		/**
		 * Overwrite parent and extend the options param over current class
		 * @param options
		 */
		initialize: function ( options ) {

			$.extend( true, this, options );

			this.$el.addClass( this.model.get( 'post_type' ) );

			this.$el.toggleClass( 'tva-collapsed', ! this.expanded.has( this.model.get( 'id' ) ) );

			this.listenTo( this.model, 'destroy', this.remove );

			this.listenTo( this.model, 'expand', this.expand );
		},
		/**
		 * After render for current item
		 */
		afterRender: function () {

			this.$el.attr( {
				'data-id': this.model.get( 'ID' ),
				'data-type': this.model.getType(),
				'data-parent-id': this.model.get( 'post_parent' )
			} );

			if ( this.model.get( 'structure' ) instanceof CourseStructureCollection ) {
				this.renderStructure( this.model.get( 'structure' ), this.getItemsList() );
			}
		},
		/**
		 *
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		editItemTitle: function ( event, dom ) {
			const $titleHolder = $( dom ).closest( '.tva-title-holder' );

			$titleHolder.prepend( ( new InputTitle( {
					model: new Backbone.Model( {
						title: this.model.get( 'post_title' ),
					} ),
					titleTextHolder: $titleHolder.find( '.tva-items-tab-title' ),
					save: ( title = '' ) => {
						this.model.set( 'post_title', title );
						const structure = this.model.get( 'structure' );

						this.model.save().done( () => {
							this.model.set( {structure}, {silent: true} );
						} );
					}
				}
			) ).render().$el );

			event.stopPropagation();
		},
		/**
		 * Render item's structure
		 * @param {CourseStructureCollection} collection
		 * @param {jQuery} $el
		 */
		renderStructure: function ( collection, $el ) {
		},
		/**
		 * Element where the course items should be rendered based on the collection type
		 * @return {jQuery}
		 */
		getItemsList: function () {

			return this.$( `.tva-${this.model.get( 'structure' ).getType()}-list` );
		},
		/**
		 * Expand the current item
		 */
		expand() {
			this.$el.removeClass( 'tva-collapsed' );
			this.expanded.add( this.model.get( 'id' ) );
		}
	} );
} )( jQuery );
