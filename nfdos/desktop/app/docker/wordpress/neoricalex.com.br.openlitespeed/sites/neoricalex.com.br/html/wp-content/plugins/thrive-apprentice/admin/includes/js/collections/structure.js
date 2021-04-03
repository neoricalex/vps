const BaseCollection = require( './base' );
const ModuleModel = require( './../models/module' );
const ChapterModel = require( './../models/chapter' );
const LessonModel = require( './../models/lesson' );

/**
 * Collection for course items: modules, chapters, collection
 * - models are initialized dynamically
 * - saves order items
 * @type {Backbone.Collection}
 */
module.exports = BaseCollection.extend( {

	model: function ( data = {}, options ) {

		switch ( data.post_type ) {
			case 'tva_module':
				return new ModuleModel( data, options );
			case 'tva_chapter':
				return new ChapterModel( data, options );
			case 'tva_lesson':
				return new LessonModel( data, options );
			default:
				return new Backbone.Model( data, options );
		}
	},
	/**
	 * Saves the items/model order
	 */
	save: function () {

		const json = [];

		this.each( function ( model, ) {
			json.push( model.toJSON() );
		} );

		const model = new StructureModel( json );

		return model.save.apply( model, arguments );
	},

	/**
	 * Updates the children comments status
	 *
	 * @param {int} parentID
	 * @param {String} currentValue
	 * @param {String} parentType
	 */
	updateChildrenCommentStatus: function ( parentID, currentValue, parentType = '' ) {
		const model = new StructureModel( {} );

		if ( typeof currentValue === 'boolean' ) { //Check for courses
			currentValue = currentValue ? 'open' : 'closed';
		}

		model.updateChildrenCommentStatus( parentID, currentValue, parentType, this.findItemsIDsByOptions() ).success( response => {
			response.update && this.findItemsByOptions().forEach( model => model.set( 'comment_status', currentValue ) );
		} ).error( response => {
			console.warn( 'Invalid Payload when updating the children comments status' );
		} );
	},


	/**
	 * Gets the first model's type
	 * - modules
	 * - chapters
	 * - lessons
	 * @return {string}
	 */
	getType: function () {

		let type = 'content';

		if ( this.length === 0 ) {
			return type;
		}

		const firstModel = this.first();
		if ( ! ( firstModel instanceof Backbone.Model ) ) {
			return type;
		}

		switch ( firstModel.getType() ) {
			case 'module':
				type = 'modules';
				break;
			case 'chapter':
				type = 'chapters';
				break;
			case 'lesson':
				type = 'lessons';
				break;
		}

		return type;
	},
	/**
	 * Gets the first model's type and returns it
	 * @return {string|"module"|"chapter"|"lesson"}
	 */
	getSingularType: function () {

		if ( this.first() instanceof Backbone.Model ) {
			return this.first().getType();
		}

		return 'content';
	},
	/**
	 * Loops through all structures for a model
	 * @param {number|string} id
	 * @return {Backbone.Model|null}
	 */
	findItem: function ( id ) {
		id = parseInt( id );

		if ( isNaN( id ) ) {
			return null;
		}

		let foundModel = this.findWhere( {id: id} );

		if ( foundModel instanceof Backbone.Model ) {
			return foundModel;
		}

		this.some( ( model ) => {
			/**
			 * the item is module or chapter and contains items
			 * then try find the model with id
			 */
			if ( model.get( 'structure' ).length ) {
				return foundModel = this.findItem.call( model.get( 'structure' ), id );
			}

			return false;
		} );

		return foundModel;
	},

	/**
	 * Counts the number of children having post_parent = parentID (on any level)
	 *
	 * @param {Number} parentID
	 */
	countChildren( parentID ) {
		if ( parentID === parseInt( this.at( 0 ).get( 'post_parent' ) ) ) {
			return this.length;
		}

		const item = this.findItem( parentID );

		return item && item.get( 'structure' ) && item.get( 'structure' ).length || 0;
	},

	/**
	 * Recursively find modules in current structure by options has sent as parameter
	 * @param options
	 * @return {Array}
	 */
	findItemsByOptions: function ( options ) {

		let founded = this.where( options );

		this.some( ( model ) => {
			if ( model.get( 'structure' ).length ) {

				if ( ! ( model.get( 'structure' ) instanceof this.constructor ) ) {
					model.set( 'structure', new this.constructor( model.get( 'structure' ) ) );
				}

				const children = this.findItemsByOptions.call( model.get( 'structure' ), options );

				founded = founded.concat( children );
			}
		} );

		return founded;
	},
	/**
	 * Find the items IDs by Options
	 *
	 * @param options
	 *
	 * @returns {Array}
	 */
	findItemsIDsByOptions: function ( options ) {
		return _.map( this.findItemsByOptions( options ), model => {
			return model.get( 'ID' );
		} );
	},
	/**
	 * Calculates order for a new item in collection
	 * @return {number}
	 */
	getOrderForNewItem: function () {
		const orders = this.pluck( 'order' );
		return parseInt( _.last( orders ) ) + 1;
	}

} );

const StructureModel = require( './../models/base' ).extend( {
	/**
	 * Defines the URL whre the course structure can be saved
	 * @return {string}
	 */
	url: function () {

		return `${TVA.apiSettings.root}${TVA.apiSettings.v1}/structure`;
	},
	/**
	 * Ajax request for updating the children comment status
	 *
	 * @param {int} parent_id
	 * @param {String} currentValue
	 * @param {String} parentType
	 * @param {Array} list
	 *
	 * @returns {JQuery.jqXHR}
	 */
	updateChildrenCommentStatus: function ( parent_id, currentValue, parentType = '', list = [] ) {

		return wp.apiRequest( {
			type: 'POST',
			url: `${this.url()}/update_children_comment_status`,
			data: {
				parent_id: parent_id,
				parent_type: parentType,
				current_value: currentValue,
				ids: list,
			},
		} );
	}
} );
