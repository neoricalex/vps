<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden
}

/**
 * Class TVA_Payment_Init
 */
final class TVA_Payment_Init {
	/**
	 * Database object
	 *
	 * @var wpdb $wpdb
	 */
	private $wpdb;

	/**
	 * Orders table
	 *
	 * @var
	 */
	public $orders_table;

	/**
	 * Orders table
	 *
	 * @var
	 */
	public $order_items_table;

	/**
	 * Transactions table
	 *
	 * @var
	 */
	public $transactions_table;

	/**
	 * IPN Tale
	 *
	 * @var
	 */
	public $IPN_table;

	/**
	 * TVA_Payment_Init constructor.
	 */
	public function __construct() {
		global $wpdb;

		$this->wpdb = $wpdb;

		$this->IPN_table          = $this->wpdb->prefix . TVA_Const::DB_PREFIX . TVA_Const::IPN_TABLE_NAME;
		$this->orders_table       = $this->wpdb->prefix . TVA_Const::DB_PREFIX . TVA_Const::ORDERS_TABLE_NAME;
		$this->order_items_table  = $this->wpdb->prefix . TVA_Const::DB_PREFIX . TVA_Const::ORDER_ITEMS_TABLE_NAME;
		$this->transactions_table = $this->wpdb->prefix . TVA_Const::DB_PREFIX . TVA_Const::TRANSACTIONS_TABLE_NAME;

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

		$this->create_orders_table();
		$this->create_order_items_table();
		$this->create_transactions_table();
		$this->create_IPN_table();
	}

	/**
	 * Create the IPN table
	 */
	private function create_IPN_table() {
		if ( $this->wpdb->get_var( "SHOW TABLES LIKE '" . $this->IPN_table . "'" ) != $this->IPN_table ) {
			$charset_collate = $this->wpdb->get_charset_collate();

			$sql = 'CREATE TABLE IF NOT EXISTS ' . $this->IPN_table . ' (
				ID BIGINT NOT NULL AUTO_INCREMENT,
				order_id BIGINT,
				gateway_order_id BIGINT ,
				gateway varchar(80),
				`status` TINYINT NOT NULL,
				payment_status varchar(80),
				transaction_id TEXT,
				ipn_content TEXT,
				created_at DATETIME DEFAULT "0000-00-00 00:00:00" NOT NULL,
				PRIMARY KEY  (id)
			)' . $charset_collate . ';';

			dbDelta( $sql );
		}
	}

	/**
	 * Create the orders table
	 */
	private function create_orders_table() {
		if ( $this->wpdb->get_var( "SHOW TABLES LIKE '" . $this->orders_table . "'" ) != $this->orders_table ) {
			$charset_collate = $this->wpdb->get_charset_collate();

			$sql = 'CREATE TABLE IF NOT EXISTS ' . $this->orders_table . ' (
				ID BIGINT NOT NULL AUTO_INCREMENT,
				user_id BIGINT(9) NOT NULL,
				`status` TINYINT NOT NULL,
				payment_id VARCHAR(30),
				gateway_order_id BIGINT,
				gateway VARCHAR(80),
				payment_method varchar(80),
				gateway_fee VARCHAR(20) DEFAULT 0,
				buyer_email TEXT,
				buyer_name TEXT,
				buyer_address1 TEXT,
				buyer_address2 TEXT,
				buyer_city TEXT,
				buyer_region TEXT,
				buyer_postcode TEXT,
				buyer_country CHAR(2),
				billing_address1 TEXT,
				billing_address2 TEXT,
				billing_city TEXT,
				billing_region TEXT,
				billing_postcode TEXT,
				billing_country CHAR(2),
				shipping_address1 TEXT,
				shipping_address2 TEXT,
				shipping_city TEXT,
				shipping_region TEXT,
				shipping_postcode TEXT,
				shipping_country CHAR(2),
				buyer_ip_address VARCHAR(64),
				is_gift TINYINT DEFAULT 0,
				price VARCHAR(20) DEFAULT 0,
				price_gross VARCHAR(20) DEFAULT 0,
				currency CHAR(3),
				created_at datetime DEFAULT "0000-00-00 00:00:00" NOT NULL,
				updated_at datetime DEFAULT "0000-00-00 00:00:00" NOT NULL,
				PRIMARY KEY  (id)
			)' . $charset_collate . ';';

			dbDelta( $sql );
		}
	}

	/**
	 * Create order items table
	 */
	private function create_order_items_table() {
		if ( $this->wpdb->get_var( "SHOW TABLES LIKE '" . $this->order_items_table . "'" ) != $this->order_items_table ) {
			$charset_collate = $this->wpdb->get_charset_collate();

			$sql = 'CREATE TABLE IF NOT EXISTS ' . $this->order_items_table . ' (
				ID BIGINT NOT NULL AUTO_INCREMENT,
				order_id BIGINT,
				gateway_order_id BIGINT,
				gateway_order_item_id BIGINT ,
				product_id BIGINT,
				product_type VARCHAR(64),
				product_name TEXT NOT NULL,
				product_price VARCHAR(20) NOT NULL,
				currency CHAR(3),
				quantity SMALLINT DEFAULT 1,
				unit_price VARCHAR(20) DEFAULT 0,
				total_price VARCHAR(20) DEFAULT 0,
				valid_until datetime DEFAULT "0000-00-00 00:00:00" NOT NULL,
				created_at datetime DEFAULT "0000-00-00 00:00:00" NOT NULL,
				PRIMARY KEY (id)
			)' . $charset_collate . ';';

			dbDelta( $sql );
		}
	}

	/**
	 * Create the transactions table
	 */
	private function create_transactions_table() {
		if ( $this->wpdb->get_var( "SHOW TABLES LIKE '" . $this->transactions_table . "'" ) != $this->transactions_table ) {
			$charset_collate = $this->wpdb->get_charset_collate();

			$sql = 'CREATE TABLE IF NOT EXISTS ' . $this->transactions_table . ' (
				ID BIGINT NOT NULL AUTO_INCREMENT,
				order_id BIGINT,
				transaction_id TEXT,
				currency CHAR(3),
				price VARCHAR(20) DEFAULT 0,
				price_gross VARCHAR(20) DEFAULT 0,
				gateway_fee VARCHAR(20) DEFAULT 0,
				transaction_type TINYINT NOT NULL,
				gateway varchar(80),
				card_last_4_digits CHAR(4),
				card_expires_at DATE DEFAULT "0000-00-00" NOT NULL,
				created_at datetime DEFAULT "0000-00-00 00:00:00" NOT NULL,
				PRIMARY KEY (id)
			)' . $charset_collate . ';';

			dbDelta( $sql );
		}
	}


}