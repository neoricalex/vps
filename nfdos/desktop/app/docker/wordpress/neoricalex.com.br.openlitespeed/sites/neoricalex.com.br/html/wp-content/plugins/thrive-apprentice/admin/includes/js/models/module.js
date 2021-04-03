const CourseItem = require( './course/item' );

module.exports = CourseItem.extend( {
	/**
	 * @property {Object} default prop
	 */
	defaults: {
		comment_status: 'closed',
		post_excerpt: '',
		post_type: 'tva_module',
		order: 0
	},
	/**
	 * Validates current model
	 * @param {Object} data
	 * @return {undefined|[]}
	 */
	validate: function ( data = {} ) {
		const errors = [];
		if ( ! data.post_title ) {
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

		return TVA.apiSettings.root + TVA.apiSettings.v2 + `/modules/${this.get( 'id' ) ? this.get( 'id' ) : ''}`;
	}
} );
