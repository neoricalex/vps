const TVE = window.TVE || {};

/**
 * The external file is included in TAR when the Thrive Apprentice Plugin is active
 *
 * Ex: When a user edits a page with TAR, the external file will be included
 */


( function ( $ ) {

	/* main includes */
	$.extend( true, TVE, require( './_includes' ) );

	/* include the course implementation */
	require( './course/main' );

} )( jQuery );
