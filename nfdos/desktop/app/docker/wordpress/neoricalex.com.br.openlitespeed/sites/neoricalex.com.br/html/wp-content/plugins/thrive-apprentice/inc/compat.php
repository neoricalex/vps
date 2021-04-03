<?php
/**
 * Created by PhpStorm.
 * User: User
 * Date: 4/9/2019
 * Time: 13:20
 */

/**
 * Used to fix a compatibility issue between s2member and TA, SUPP-7397
 */
add_filter( 'ws_plugin__s2member_login_redirect', 'tva_ws_plugin__s2member_login_redirect', 10, 2 );

/**
 * Avoid redirecting after the user was logged via TA checkout form
 *
 * @param $redirect
 * @param $args
 *
 * @return bool
 */
function tva_ws_plugin__s2member_login_redirect( $redirect, $args ) {

	if ( isset( $_REQUEST['payment_processor'] ) && 'Sendowl' === $_REQUEST['payment_processor'] ) {
		$redirect = false;
	}

	return $redirect;
}
