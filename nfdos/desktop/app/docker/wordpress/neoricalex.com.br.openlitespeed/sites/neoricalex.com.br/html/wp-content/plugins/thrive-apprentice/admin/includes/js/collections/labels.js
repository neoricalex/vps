/**
 * Collection storing all defined Course Labels
 */
module.exports = require( './topics' ).extend( {

	/**
	 * Specific model for this collection
	 */
	model: require( '../models/label' ),

	/**
	 * Comparator function. always sort ASC by ID - in the order they were created
	 *
	 * @param {Label} labelA
	 * @param {Label} labelB
	 * @return {number}
	 */
	comparator( labelA, labelB ) {
		return labelA.get( 'ID' ) - labelB.get( 'ID' );
	}
} );
