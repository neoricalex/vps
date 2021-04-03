/**
 * Created by PhpStorm.
 * User: Ovidiu
 * Date: 10/15/2018
 * Time: 5:42 PM
 */

( function ( $ ) {

	/**
	 * On TCB Main Ready
	 */
	$( window ).on( 'tcb_main_ready', function () {
		TVE.Views.Components.checkout = require( './checkout-component' );
		TVE.Views.Components.checkout_form = require( './checkout-form-component' );
	} );

	TVE.add_action( 'tcb-ready', function () {
		TVE.inner_$( '.thrive-shortcode-content' ).each( function () {
			var $element = $( this );

			if ( $element.data( 'shortcode' ).includes( 'tva_sendowl_product' ) && ! $element.data( 'option-inline' ) ) {

				$element.attr( 'data-option-inline', 1 );
				$element.attr( 'data-shortcode', 'tva_sendowl_product' );
				$element.text( $element.data( 'editor-name' ) );
			}
		} );
	} );

	/**
	 * Push TA inline shortcodes in SHORTCODE_GROUP_ORDER_MAP
	 */
	TVE.add_filter( 'tcb.inline_shortcodes.shortcode_group', function ( shortcode_group ) {

		shortcode_group.push( 'Thrive Product' );

		return shortcode_group;
	} );

} )( jQuery );
