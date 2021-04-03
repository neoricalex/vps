const BaseModel = require( './../base' );

module.exports = BaseModel.extend( {
	initialize( data ) {
		if ( data.structure && ! ( data.structure instanceof Backbone.Collection ) ) {
			this.set( 'structure', new this.collection.constructor( data.structure ), {silent: true} );
		}
	},
	/**
	 * Returns type of the course model item: module/chapter/lesson
	 * @return {"module"|"chapter"|"lesson"}
	 */
	getType: function () {
		return this.get( 'post_type' ).replace( 'tva_', '' );
	},
	/**
	 * Check if current item model is has post_status publish
	 * @return {boolean}
	 */
	isPublished: function () {
		return this.get( 'post_status' ) === 'publish';
	},
	/**
	 * Get the parent item, immediately higher in the hierarchy
	 *
	 * @return {Backbone.Model|null}
	 */
	getParent() {
		if ( ! this.get( 'post_parent' ) ) {
			return null;
		}

		return this.collection.parent;
	},
	/**
	 * Get all parents of the current item
	 *
	 * @return {Backbone.Model[]}
	 */
	getParents() {
		let parent = this.getParent();

		if ( ! parent ) {
			return [];
		}

		const items = [];

		do {
			items.push( parent );
			parent = parent.getParent();

		} while ( parent );

		return items;
	},

	/**
	 * Get all the published lessons (on any level) from this item
	 *
	 * @return {Backbone.Model[]}
	 */
	getPublishedLessons() {
		return this.get( 'structure' ).findItemsByOptions( {
			post_type: 'tva_lesson',
			post_status: 'publish',
		} );
	},

	/**
	 * Get the Module that this model belongs to
	 *
	 * @return {Backbone.Model|null} found module, if any
	 */
	getModule() {
		const deepestParent = this.getHighestParent();

		return deepestParent.getType() === 'module' ? deepestParent : null;
	},

	/**
	 * Get the highest parent of this model in the course structure
	 *
	 * @return {Backbone.Model} deepest parent
	 */
	getHighestParent() {
		let model = this;

		while ( model.get( 'post_parent' ) > 0 && model.collection && model.collection.parent ) {
			model = model.collection.parent;
		}

		return model;
	},

	/**
	 * Overwrite set() in order to always setup a parent field on the structure collection
	 */
	set() {
		if ( arguments[ 0 ] === 'structure' && arguments[ 1 ] instanceof Backbone.Collection ) {
			arguments[ 1 ].parent = this;
		}
		return BaseModel.prototype.set.apply( this, arguments );
	},

	/**
	 * Get a user-friendly representation of the number of children (both direct and indirect)
	 *
	 * @param {String} emptyClassName CSS class to use for the "(EMPTY)" element
	 *
	 * @return {String}
	 */
	getCountSummary( emptyClassName = 'tva-empty' ) {
		const directChildren = this.get( 'structure' );

		if ( ! directChildren.length ) {
			return `<span class="${emptyClassName}">(${TVA.t.empty})</span>`;
		}

		const parts = [];
		let lessonCount = 0;

		if ( directChildren.at( 0 ).getType() === 'chapter' ) {
			parts.push( TVA.Utils._n( directChildren.length, TVA.t.chapter ) );

			/* from each chapter, count the lessons */
			directChildren.each( ( item ) => {
				if ( item.get( 'structure' ) ) {
					lessonCount += item.get( 'structure' ).length;
				}
			} );
		} else {
			lessonCount = directChildren.length;
		}

		if ( lessonCount ) {
			parts.push( TVA.Utils._n( lessonCount, TVA.t.lesson ) );
		}

		return `(${parts.join( ', ' )})`;
	},
	/**
	 * Trigger an event that should expand the view in the course structure.
	 * It also handles expanding of all parent items
	 */
	expand() {
		this.trigger( 'expand', this );

		if ( this.get( 'post_parent' ) ) {
			this.getParent().expand();
		}
	},
	/**
	 * Overwritten so that we can update the post_status for parent items
	 *
	 * @return {*}
	 */
	destroy() {
		/**
		 * when deleting a published lesson / chapter, update parents to ensure the post_status is correctly updated (this is already ensured server-side);
		 */
		if ( this.get( 'post_parent' ) ) {

			/* for each of the published parents, update the status as needed */
			this.getParents()
			    .forEach( parent => {
				    const hasPublishedLessons = parent.getPublishedLessons().filter( lesson => lesson !== this && lesson.getParent() !== this ).length > 0;
				    parent.set( 'post_status', hasPublishedLessons ? 'publish' : 'draft', {silent: true} );
			    } );

		}

		return BaseModel.prototype.destroy.apply( this, arguments );
	}
} );
