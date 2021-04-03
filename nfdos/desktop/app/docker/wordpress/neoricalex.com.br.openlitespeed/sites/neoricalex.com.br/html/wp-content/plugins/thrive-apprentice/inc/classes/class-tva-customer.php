<?php

/**
 * Class TVA_Customer Model
 * - WP_User wrapper which has specific properties for TA
 * - ThriveCart Customer
 * - SendOwl Customer
 */
class TVA_Customer implements JsonSerializable {

	/**
	 * @var WP_User
	 */
	protected $_user;

	/**
	 * @var string
	 */
	static protected $_admin_url;

	/**
	 * @var null|integer[]
	 */
	private $_purchased_item_ids;

	/**
	 * TVA_Customer constructor.
	 *
	 * @param int $id
	 */
	public function __construct( $id ) {

		$this->_user = new WP_User( (int) $id );
	}

	/**
	 * Data which is encoded at localize
	 *
	 * @return array
	 */
	public function json_serialize() {

		if ( false === $this->_user instanceof WP_User ) {
			return array();
		}

		return array(
			'ID'           => $this->_user->ID,
			'display_name' => $this->_user->display_name,
			'user_email'   => $this->_user->user_email,
			'user_login'   => $this->_user->user_login,
			'edit_url'     => $this->get_edit_url(),
			'avatar_url'   => get_avatar_url( $this->_user->ID ),
		);
	}

	/**
	 * Called on this instance has to be serialized/localized
	 *
	 * @return array
	 */
	public function jsonSerialize() {

		return $this->json_serialize();
	}

	/**
	 * Returns a list of vendor item ids
	 *
	 * @param bool $force where to fetch them again from DB
	 *
	 * @return integer[]|null
	 */
	protected function _get_purchased_item_ids( $force = false ) {

		if ( $this->_purchased_item_ids === null || $force === true ) {
			$this->_purchased_item_ids = TVA_Order_Item::get_purchased_items(
				array(
					'user_id' => (int) $this->_user->ID,
				)
			);
		}

		return $this->_purchased_item_ids;
	}

	/**
	 * List of course IDs user has access to for buying a ThriveCart product(s)
	 *
	 * @return integer[]
	 */
	public function get_thrivecart_courses() {

		return TVA_Order_Item::get_purchased_items( array(
			'user_id' => $this->_user->ID,
			'gateway' => TVA_Const::THRIVECART_GATEWAY,
		) );
	}

	/**
	 * All SendOwl Simple Product IDs user bought
	 *
	 * @return integer[]
	 */
	public function get_sendowl_products() {

		$intersect = array_intersect( $this->_get_purchased_item_ids(), TVA_SendOwl::get_products_ids() );

		return array_values( $intersect );
	}

	/**
	 * All SendOwl Bundle Product IDs user bought
	 *
	 * @return integer[]
	 */
	public function get_sendowl_bundles() {

		$intersect = array_intersect( $this->_get_purchased_item_ids(), TVA_SendOwl::get_bundle_ids() );

		return array_values( $intersect );
	}

	/**
	 * Returns the edit user for current user
	 *
	 * @return string
	 */
	public function get_edit_url() {

		$admin_url = $this->_get_admin_url();

		return add_query_arg( 'user_id', $this->_user->ID, $admin_url );
	}

	/**
	 * Lazy loading for admin user
	 *
	 * @return string
	 */
	protected function _get_admin_url() {

		if ( ! self::$_admin_url ) {
			self::$_admin_url = self_admin_url( 'user-edit.php' );
		}

		return self::$_admin_url;
	}

	/**
	 * Fetches a list of users from DB based on orders
	 * - usually users are being made by ThriveCart and SendOwl
	 *
	 * @param array $args
	 * @param bool  $count
	 *
	 * @return TVA_Customer[]|int
	 */
	public static function get_list( $args = array(), $count = false ) {

		global $wpdb;

		$defaults = array(
			'offset' => 0,
			'limit'  => class_exists( 'TVA_Admin', false ) ? TVA_Admin::ITEMS_PER_PAGE : 10,
		);

		$args = array_merge( $defaults, $args );

		$offset            = (int) $args['offset'];
		$limit             = (int) $args['limit'];
		$users_table       = $wpdb->base_prefix . 'users';
		$orders_table      = $wpdb->prefix . 'tva_orders';
		$order_items_table = $wpdb->prefix . 'tva_order_items';
		$usermeta_table    = $wpdb->base_prefix . 'usermeta';
		$join              = '';

		$params = array();

		if ( empty( $args['product_id'] ) ) {
			$where = 'WHERE orders.status IS NOT NULL';
		} else {
			$where    = 'WHERE orders.status = %d';
			$params[] = TVA_Const::STATUS_COMPLETED;
		}

		if ( ! empty( $args['s'] ) ) {
			$where .= " AND ( users.display_name LIKE '%%%s%%' OR users.user_email LIKE '%%%s%%' ) ";

			$params[] = $args['s'];
			$params[] = $args['s'];
		}

		if ( ! empty( $args['product_id'] ) ) {
			$where .= ' AND order_items.product_id = %d';

			$params[] = (int) $args['product_id'];
		}

		if ( is_multisite() ) {
			$where .= " AND $usermeta_table.meta_key = '$wpdb->prefix" . 'capabilities\'';
			$join  .= "INNER JOIN $usermeta_table ON users.ID = $usermeta_table.user_id";
		}

		$sql = "SELECT " . ( $count ? "count(DISTINCT users.ID) as count" : "DISTINCT users.ID" ) . " FROM $orders_table AS orders
        		INNER JOIN $users_table AS users ON users.ID = orders.user_id
        		LEFT JOIN $order_items_table AS order_items ON orders.ID = order_items.order_id
        		$join
				$where
				ORDER BY users.ID DESC
				";

		$limit_sql = '';

		if ( ! $count ) {
			$limit_sql = 'LIMIT %d , %d';
			$params[]  = $offset;
			$params[]  = $limit;
		}

		$sql .= $limit_sql;

		$results = $wpdb->get_col( empty( $params ) ? $sql : $wpdb->prepare( $sql, $params ) );

		if ( $count ) {
			return $results[0];
		}

		$users = array();
		foreach ( $results as $item ) {
			$user = new TVA_Customer( $item );

			$users[] = $user;
		}

		return $users;
	}

	/**
	 * Fetches a list of users from DB who do not have any products
	 * - usually users are being made by ThriveCart and SendOwl
	 *
	 * @param array $args
	 * @param bool  $count
	 *
	 * @return TVA_Customer[]|int
	 */
	public static function get_customers_with_no_products( $args = array(), $count = false ) {

		global $wpdb;

		$defaults = array(
			'offset' => 0,
			'limit'  => class_exists( 'TVA_Admin', false ) ? TVA_Admin::ITEMS_PER_PAGE : 10,
		);

		$args = array_merge( $defaults, $args );

		$offset            = (int) $args['offset'];
		$limit             = (int) $args['limit'];
		$users_table       = $wpdb->base_prefix . 'users';
		$orders_table      = $wpdb->prefix . 'tva_orders';
		$order_items_table = $wpdb->prefix . 'tva_order_items';
		$usermeta_table    = $wpdb->base_prefix . 'usermeta';
		$join              = '';

		$where  = '';
		$params = array();

		if ( ! empty( $args['s'] ) ) {
			$where .= " AND ( users.display_name LIKE '%%%s%%' OR users.user_email LIKE '%%%s%%' ) ";

			$params[] = $args['s'];
			$params[] = $args['s'];
		}

		if ( is_multisite() ) {
			$where .= " AND $usermeta_table.meta_key = '$wpdb->prefix" . 'capabilities\'';
			$join  .= "INNER JOIN $usermeta_table ON users.ID = $usermeta_table.user_id";
		}

		$sql = "SELECT " . ( $count ? 'count(DISTINCT users.ID) as count' : "DISTINCT users.ID" ) . " FROM $orders_table AS orders
        		INNER JOIN $users_table AS users ON users.ID = orders.user_id
        		LEFT JOIN $order_items_table AS order_items ON orders.ID = order_items.order_id
        		$join
        		WHERE ( orders.status = 4 OR orders.status = 2 OR orders.status = 0 ) AND orders.user_id NOT IN 
        		(
        		    SELECT DISTINCT user_id FROM $orders_table AS orders
        		    INNER JOIN $users_table AS users ON users.ID = orders.user_id
        		    LEFT JOIN $order_items_table AS order_items ON orders.ID = order_items.order_id
                    WHERE orders.status = 1
                )
				$where
				ORDER BY users.ID DESC
				";

		$limit_sql = '';

		if ( ! $count ) {
			$limit_sql = 'LIMIT %d , %d';
			$params[]  = $offset;
			$params[]  = $limit;
		}

		$sql .= $limit_sql;

		$results = $wpdb->get_col( empty( $params ) ? $sql : $wpdb->prepare( $sql, $params ) );

		if ( $count ) {
			return $results[0];
		}

		$users = array();
		foreach ( $results as $item ) {
			$users[] = new TVA_Customer( $item );
		}

		return $users;
	}
}
