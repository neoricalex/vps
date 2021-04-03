const Topic = require( '../models/topic' );

/**
 * Collection storing all Course Topics
 */
module.exports = require( './base' ).extend( {

	/**
	 * Specific model for this collection
	 */
	model: Topic,

	/**
	 * Comparator function. always sort DESC by ID
	 *
	 * @param {Topic} topicA
	 * @param {Topic} topicB
	 * @return {number}
	 */
	comparator( topicA, topicB ) {
		return topicB.get( 'ID' ) - topicA.get( 'ID' );
	}
} );
