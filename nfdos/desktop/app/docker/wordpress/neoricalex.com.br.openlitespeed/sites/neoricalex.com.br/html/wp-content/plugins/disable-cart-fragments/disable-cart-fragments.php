<?php

/**
 * Plugin Name: Disable Cart Fragments
 * Plugin URI: https://wordpress.org/plugins/disable-cart-fragments/
 * Description: A better way to disable WooCommerce's cart fragments script, and re-enqueue it when the cart is updated. Works with all caching plugins.
 * Version: 1.21
 * Author: Optimocha
 * Author URI: https://optimocha.com/
 * License: GPL v3
 * Requires PHP: 5.6 or later
 * WC requires at least: 2.0
 * WC tested up to: 4.0.1
 * Text Domain: speed-booster-pack
 * Domain Path: /lang
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 3, as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

defined( 'ABSPATH' ) or die( __( 'No script kiddies please!' ) );

if( !defined( 'OPTIMOCHA_DCF_PATH' ) ) {
	define( 'OPTIMOCHA_DCF_PATH', plugin_dir_path( __FILE__ ) );
}

if( !defined( 'OPTIMOCHA_DCF_BASENAME' ) ) {
	define( 'OPTIMOCHA_DCF_BASENAME', plugin_basename( __FILE__ ) );
}

if( !defined( 'OPTIMOCHA_DCF_DOMAIN' ) ) {
	define( 'OPTIMOCHA_DCF_DOMAIN', 'disable-cart-fragments' );
}

if ( ! class_exists( 'Optimocha_Disable_Cart_Fragments' ) ) {

	class Optimocha_Disable_Cart_Fragments {

		function __construct(){

			require_once OPTIMOCHA_DCF_PATH . '/vendor/persist-admin-notices-dismissal/persist-admin-notices-dismissal.php';

			if( class_exists( 'PAnD' ) ) {
				add_action( 'admin_init', array( 'PAnD', 'init' ) );
			}

			add_filter( "plugin_action_links_" . OPTIMOCHA_DCF_BASENAME, array( $this, 'settings_links' ) );
			add_action( 'admin_notices', array( $this, 'optimocha_notice' ) );

			if( $this->dcf_is_plugin_active( 'speed-booster-pack/speed-booster-pack.php' ) ) {

				add_action( 'admin_notices', array( $this, 'sbp_active_warning' ) );

			} else if( $this->dcf_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {

				add_action( 'wp_enqueue_scripts', array( $this, 'disable_cart_fragments' ), 999 );

			}

		}

		function dcf_is_plugin_active( $path ) {
			return in_array( $path, apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) );
		}

		function sbp_active_warning() {

			?>
			<div class="notice notice-error">
				<p><?php _e( "We detected that you're already using another plugin of ours: Speed Booster Pack. Since SBP already has the same \"Disable cart fragments\" feature, you can safely deactivate the Disable Cart Fragments plugin and keep using Speed Booster Pack! :)", OPTIMOCHA_DCF_DOMAIN ); ?>
				</p>
			</div>
			<?php

		}

		function optimocha_notice() {

			if ( ! PAnD::is_admin_notice_active( 'dcf-180' ) ) {
				return;
			}

			?>
			<div data-dismissible="dcf-180" class="notice notice-success is-dismissible">
				<p><a href="https://optimocha.com/?ref=disable-cart-fragments" target="_blank"><?php _e( "If you need any help optimizing your website speed, if you're ready to <em>invest in</em> speed optimization, you can visit Optimocha.com by clicking here, and have us speed up your site!", OPTIMOCHA_DCF_DOMAIN ); ?></a></p>
			</div>
			<?php

		}


		/*
		 * Disable Cart Fragments Function
		 */
		function disable_cart_fragments() {
			global $wp_scripts;

			$handle = 'wc-cart-fragments';

			$load_cart_fragments_path = $wp_scripts->registered[ $handle ]->src;
			$wp_scripts->registered[ $handle ]->src = null;
			wp_add_inline_script(
				'jquery',
				'
				function optimocha_getCookie(name) {
					var v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
					return v ? v[2] : null;
				}

				function optimocha_check_wc_cart_script() {
				var cart_src = "' . $load_cart_fragments_path . '";
				var script_id = "optimocha_loaded_wc_cart_fragments";

					if( document.getElementById(script_id) !== null ) {
						return false;
					}

					if( optimocha_getCookie("woocommerce_cart_hash") ) {
						var script = document.createElement("script");
						script.id = script_id;
						script.src = cart_src;
						script.async = true;
						document.head.appendChild(script);
					}
				}

				optimocha_check_wc_cart_script();
				document.addEventListener("click", function(){setTimeout(optimocha_check_wc_cart_script,1000);});
				'
			);
		}

		function settings_links( $links ) {
			$pro_link = ' <a href="https://optimocha.com/?ref=disable-cart-fragments" target="_blank">Pro Help</a > ';
			array_unshift( $links, $pro_link );

			return $links;
		}
	}

	new Optimocha_Disable_Cart_Fragments();
}
