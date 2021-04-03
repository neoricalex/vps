/**
 * General utils object for functions that have no other place
 *
 * @type {Object}
 */
const utilsGeneral = {
	/**
	 * Return a regexp containing all the pseudo-selectors.
	 *
	 * @returns {RegExp}
	 */
	pseudoSelectorsRegex: function () {
		return new RegExp( [
			':hover',
			':active',
			':after',
			':focus',
			'::after',
			':before',
			'::before',
			'::placeholder'
		].join( '|' ), 'gi' )
	},
	/**
	 * Allows the apprentice shortcodes functionality inside the inline-shortcodes & dynamic-links filters & actions
	 *
	 * @param key
	 *
	 * @return {boolean}
	 */
	allowApprenticeShortcodes: function ( key ) {
		return key && key.includes( 'tva_course_' )
	}
};

module.exports = utilsGeneral;
