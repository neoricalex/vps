const CourseItem = require( './course/item' );

/**
 * Chapter Model
 * @type {Backbone.Model}
 */
module.exports = CourseItem.extend( {
	/**
	 * @property {Object} defaults data
	 */
	defaults: {
		post_type: 'tva_chapter'
	},
	/**
	 * Validates chapter's props
	 * @param {Object} data
	 * @return {[]}
	 */
	validate: function ( data = {} ) {

		const errors = [];

		if ( ! data.post_title || data.post_title.length <= 0 ) {
			errors.push( this.validation_error( 'post_title', TVA.t.EmptyTitle ) );
		}

		if ( errors.length ) {
			return errors;
		}
	},
	/**
	 * Returns the URL where the item should be saved
	 * @return {string}
	 */
	url: function () {

		return TVA.apiSettings.root + TVA.apiSettings.v2 + `/chapters/${this.get( 'id' ) ? this.get( 'id' ) : ''}`;
	}
} );
