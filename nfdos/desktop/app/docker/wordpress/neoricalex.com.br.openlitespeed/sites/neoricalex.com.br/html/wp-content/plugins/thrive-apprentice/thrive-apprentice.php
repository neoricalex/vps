<?php
/**
 * Plugin Name: Thrive Apprentice
 * Plugin URI: https://thrivethemes.com
 * Description: Create courses and lessons.
 * Author URI: https://thrivethemes.com
 * Version: 2.3.7.1
 * Author: <a href="https://thrivethemes.com">Thrive Themes</a>
 * Text Domain: thrive-apprentice
 * Domain Path: /languages/
 */

register_activation_hook( __FILE__, 'thrive_load' );

function thrive_load() {
	TVA_Const::$tva_during_activation = true;

	/**
	 * Called on plugin activation.
	 * Check for minimum required WordPress version
	 */
	if ( function_exists( 'tcb_wordpress_version_check' ) && ! tcb_wordpress_version_check() ) {
		/**
		 * Dashboard not loaded yet, force it to load here
		 */
		if ( ! function_exists( 'tve_dash_show_activation_error' ) ) {
			/* Load the dashboard included in this plugin */
			tva_load_dash_version();
			tve_dash_load();
		}

		tve_dash_show_activation_error( 'wp_version', 'Thrive Apprentice', TCB_MIN_WP_VERSION );
	}

	/**
	 * Used to check weather or not to show th notification for new thankyou page system
	 */
	update_option( TVA_Sendowl_Settings::SHOW_THANKYOU_TUTORIAL, 0 );

	tva_create_default_data();

	TVA_Const::$tva_during_activation = false;
}


/**
 * This helps to display the errors on ajax requests too
 */
if ( defined( 'TVE_DEBUG' ) && TVE_DEBUG === true ) {
	error_reporting( E_ALL );
	ini_set( 'display_errors', 1 );
}

require_once dirname( __FILE__ ) . '/init.php';

if ( is_admin() ) {
	require_once dirname( __FILE__ ) . '/admin/init.php';
}
