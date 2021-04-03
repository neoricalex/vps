<?php
/**
 * Created by PhpStorm.
 * User: dan bilauca
 * Date: 12-Apr-19
 * Time: 04:50 PM
 */

/**
 * Class TVA_WL_Integration
 * - implements TVA_Integration methods
 */
class TVA_WL_Integration extends TVA_Integration {

	/**
	 * Wishlist instance class name
	 *
	 * @var $_wl_classname
	 */
	private $_wl_classname;

	/**
	 * Set Wishlist instance class name
	 *
	 * @param string $name
	 */
	public function set_wl_classname( $name ) {
		$this->_wl_classname = $name;
	}

	/**
	 * Init WL Instance Class
	 *
	 * @throws Exception
	 */
	public function before_init_items() {
		if ( class_exists( 'WishListMember_Level', false ) ) {
			$this->set_wl_classname( 'WishListMember_Level' );
		} elseif ( class_exists( '\WishListMember\Level', false ) ) { // Wishlist v 3+
			$this->set_wl_classname( '\WishListMember\Level' );
		} else {
			throw new Exception( 'Failed to init Wishlist main instance' );
		}
	}

	protected function init_items() {
		$instance = $this->_wl_classname;
		$items    = array();

		if ( method_exists( $instance, 'get_all_levels' ) ) {
			$levels = $instance::get_all_levels( true );
		} else {
			$levels = $instance::GetAllLevels( true );
		}

		foreach ( $levels as $level ) {

			try {

				if ( $level instanceof $instance ) {
					$items[] = new TVA_Integration_Item( $level->ID, $level->name );
				}
			} catch ( Exception $e ) {

			}
		}

		$this->set_items( $items );
	}

	protected function _get_item_from_membership( $key, $value ) {

		$level = new $this->_wl_classname( $value );

		return new TVA_Integration_Item( $level->ID, $level->name );
	}

	/**
	 * Gets user's WishList Levels and checks if one of them can be found in rule
	 *
	 * @param array $rule
	 *
	 * @return bool
	 */
	public function is_rule_applied( $rule ) {

		$user  = tva_access_manager()->get_logged_in_user();
		$allow = false;

		if ( false === $user instanceof WP_User || false === class_exists( 'WishListMember3', false ) ) {
			return false;
		}

		global $WishListMemberInstance;
		$user_active_levels = $WishListMemberInstance->GetMemberActiveLevels( $user->ID );

		foreach ( $rule['items'] as $item ) {

			if ( in_array( $item['id'], $user_active_levels ) ) {
				$allow = true;
				break;
			}
		}

		return $allow;
	}

	public function trigger_no_access() {

		if ( class_exists( 'WishListMember', false ) ) {
			$wl       = new WishListMember();
			$redirect = is_user_logged_in() ? $wl->WrongLevelURL() : $wl->NonMembersURL();
			wp_redirect( $redirect );
			die( 'asd' );
		}
	}

	public function get_customer_access_items( $customer ) {
		return array();
	}
}
