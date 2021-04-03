<?php
/**
 * Created by PhpStorm.
 * User: dan bilauca
 * Date: 15-Apr-19
 * Time: 04:51 PM
 */

/**
 * Class TVA_MemberPress_Integration
 * - implements TVA_Integration methods
 */
class TVA_MemberPress_Integration extends TVA_Integration {

	protected function init_items() {

		$items        = array();
		$all_products = MeprProduct::get_all();

		if ( ! empty( $all_products ) && is_array( $all_products ) ) {
			/** @var MeprProduct $product */
			foreach ( $all_products as $product ) {
				$values = $product->get_values();

				try {
					$item    = new TVA_Integration_Item( $values['ID'], $values['post_title'] );
					$items[] = $item;
				} catch ( Exception $e ) {

				}
			}
		}

		$this->set_items( $items );
	}

	protected function _get_item_from_membership( $key, $value ) {

		$product = MeprProduct::get_one( $value );

		if ( $product instanceof MeprProduct ) {
			$product = $product->get_values();
		}

		return new TVA_Integration_Item( $product['ID'], $product['post_title'] );
	}

	/**
	 * Checks if current logged in user has a memberpress membership
	 *
	 * @param array $rule
	 *
	 * @return bool
	 */
	public function is_rule_applied( $rule ) {

		$current_user = wp_get_current_user();
		if ( ! is_user_logged_in() || false === $current_user instanceof WP_User ) {
			return false;
		}

		$applied = false;
		$user    = new MeprUser( $current_user->ID );
		$ids     = $user->active_product_subscriptions();

		foreach ( $rule['items'] as $item ) {
			$applied = in_array( $item['id'], $ids );
			if ( $applied ) {
				break;
			}
		}

		return $applied;
	}

	public function trigger_no_access() {
		//do nothing and let login for be displayed
	}

	public function get_customer_access_items( $customer ) {
		return array();
	}
}
