<?php

/**
 * Main point for the admin
 * - enqueues scripts and styles
 * - localise what is necessary
 * - defines Thrive Apprentice admin page with its Thrive Dashboard product hooks
 *
 * Class TVA_Admin
 */
class TVA_Admin {

	/**
	 * full ID of the current screen on the main admin apprentice page
	 */
	const SCREEN_ID = 'thrive-dashboard_page_thrive_apprentice';

	/**
	 * General constant for how many items should be displayed on any page of any list
	 * - this constant is localized to JS
	 */
	const ITEMS_PER_PAGE = 10;

	/**
	 * @var TVA_Admin
	 */
	private static $_instance;

	/**
	 * TVA_Admin constructor.
	 */
	private function __construct() {
		add_filter( 'tve_dash_admin_product_menu', array( $this, 'add_admin_menu' ) );
		add_filter( 'tve_dash_menu_products_order', array( $this, 'set_admin_menu_order' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );


		/**
		 * set the folded class on body on page render, to avoid flickering from javascript on domready
		 */
		add_filter( 'admin_body_class', array( $this, 'body_class' ) );
	}

	/**
	 * Push Thrive Apprentice submenu item into Thrive Dashboard Admin menu
	 *
	 * @param array $menus
	 *
	 * @return array
	 */
	public function add_admin_menu( $menus = array() ) {

		$menus['apprentice'] = array(
			'parent_slug' => 'tve_dash_section',
			'page_title'  => esc_html__( 'Thrive Apprentice', 'thrive-apprentice' ),
			'menu_title'  => esc_html__( 'Thrive Apprentice', 'thrive-apprentice' ),
			'capability'  => TVA_Product::cap(),
			'menu_slug'   => 'thrive_apprentice',
			'function'    => array( $this, 'page_callback' ),
		);

		return $menus;
	}

	/**
	 * Push the new Thrive Apprentice submenu item into an array at a specific order
	 *
	 * @param array $items
	 *
	 * @return array
	 */
	public function set_admin_menu_order( $items ) {

		$items[11] = 'apprentice';

		return $items;
	}

	/**
	 * Displays Admin page content html
	 */
	public function page_callback() {
		global $wp_version;

		if ( floatval( $wp_version ) < 4.6 ) {
			return tva_wp_version_warning();
		}

		if ( ! tva_license_activated() ) {
			return tva_license_warning();
		}

		if ( ! tva_check_tcb_version() ) {
			return include dirname( __FILE__ ) . '/templates/incompatible-architect.php';
		}

		include dirname( __FILE__ ) . '/templates/new-dashboard.php';
	}

	/**
	 * Enqueue admin scripts
	 *
	 * @param string $screen_id
	 */
	public function enqueue_scripts( $screen_id ) {

		if ( static::SCREEN_ID !== $screen_id ) {
			return;
		}

		tve_dash_enqueue();
		wp_enqueue_media();

		$apprentice_js_file      = defined( 'TVE_DEBUG' ) && TVE_DEBUG ? 'apprentice.js' : 'apprentice.min.js';
		$apprentice_js_file_deps = array(
			'jquery',
			'backbone',
		);
		wp_enqueue_script( 'thrive-admin-apprentice', $this->url( 'dist/' . $apprentice_js_file ), $apprentice_js_file_deps, TVA_Const::PLUGIN_VERSION, true );
		wp_localize_script( 'thrive-admin-apprentice', 'TVA', apply_filters( 'tva_admin_localize', $this->get_localize_data() ) );

		/**
		 * Include the spectrum Script & Style
		 */
		wp_enqueue_script( 'thrive-apprentice-spectrum-script', $this->url( 'libs/spectrum.js' ), array( 'jquery' ), TVA_Const::PLUGIN_VERSION, true );
		wp_enqueue_style( 'thrive-apprentice-spectrum-style', $this->url( 'libs/spectrum.css' ), array(), TVA_Const::PLUGIN_VERSION );

		/**
		 * Enqueue jQuery Scrollbar script
		 */
		wp_enqueue_script( 'thrive-dash-jquery-scrollbar', TVE_DASH_URL . '/js/util/jquery.scrollbar.min.js', array( 'jquery' ) );

		wp_enqueue_style(
			'thrive-admin-apprentice',
			$this->url( 'dist/tva-admin-styles.css' ),
			array(),
			TVA_Const::PLUGIN_VERSION
		);

		if ( function_exists( 'wp_enqueue_code_editor' ) ) {
			/**
			 * @since 4.9.0
			 */
			wp_enqueue_code_editor( array( 'type' => 'text/plain' ) );
		}

		/**
		 * Enqueue WP File Uploader
		 */
		wp_enqueue_script( 'plupload' );

		/**
		 * To enable post search functionality
		 */
		wp_enqueue_script( 'jquery-ui-autocomplete' );
		wp_enqueue_script( 'jquery-ui-sortable' );
		wp_enqueue_script( 'jquery-ui-droppable' );

		/**
		 * Icomoon icon styles, if any
		 */
		if ( class_exists( 'TCB_Icon_Manager' ) ) {
			TCB_Icon_Manager::enqueue_icon_pack();
		}

		add_action( 'admin_print_footer_scripts', array( $this, 'print_backbone_templates' ) );
		add_action( 'admin_print_footer_scripts', array( $this, 'print_icons' ) );
	}

	/**
	 * Gets data to be localized
	 *
	 * @return array
	 */
	public function get_localize_data() {

		$logged_in_user = wp_get_current_user();

		return array(
			'items_per_page'       => self::ITEMS_PER_PAGE,
			'routes'               => array(
				'email_template' => tva_get_route_url( 'emailTemplate' ),
				'logs'           => tva_get_route_url( 'logs' ),
				'customer'       => tva_get_route_url( 'customer' ),
				'settings'       => tva_get_route_url( 'settings' ),
				'settings_v2'    => tva_get_route_url( 'settings-v2' ),
				'sendowl'        => tva_get_route_url( 'so_settings' ),
				'token'          => tva_get_route_url( 'token' ),
				'topics'         => tva_get_route_url( 'topics' ),
				'labels'         => tva_get_route_url( 'labels' ),
				'courses'        => tva_get_route_url( 'courses' ),
				'chapters'       => tva_get_route_url( 'chapters' ),
				'modules'        => tva_get_route_url( 'modules' ),
			),
			'apiSettings'          => array(
				'nonce' => wp_create_nonce( 'wp_rest' ),
				'root'  => get_rest_url(),
				'v1'    => TVA_Const::REST_NAMESPACE,
				'v2'    => 'tva/v2',
			),
			'menuItems'            => include __DIR__ . '/configs/menu.php',
			'courses'              => array(
				'items' => TVA_Course_V2::get_items( array( 'limit' => 10000 ) ),
				'total' => TVA_Course_V2::get_items( array(), true ),
			),
			'customers'            => array(
				'total' => TVA_Customer::get_list( array(), true ),
				'items' => TVA_Customer::get_list(),
			),
			'design'               => array(
				'demo_courses' => TVA_Course_V2::get_items( array( 'status' => 'private' ) ),
				'fonts'        => array(
					'safe'   => tve_dash_font_manager_get_safe_fonts(),
					'google' => array(), //Populated from front
				),
			),
			'tokens'               => TVA_Token::get_items(),
			'logs'                 => array(
				'types' => TVA_Logger::get_log_types(),
				'items' => TVA_Logger::fetch_logs( array(
						'offset' => 0,
						'limit'  => TVA_Admin::ITEMS_PER_PAGE,
					)
				),
				'total' => TVA_Logger::fetch_logs( array(), true ),
			),
			't'                    => include __DIR__ . '/../../i18n.php',
			'sendowl'              => array(
				'is_available' => TVA_SendOwl::is_connected(),
				'bundles'      => TVA_SendOwl::get_bundles(),
				'products'     => TVA_SendOwl::get_products(),
				'discounts'    => TVA_SendOwl::get_discounts_v2(),
			),
			'tar_active'           => (int) is_plugin_active( 'thrive-visual-editor/thrive-visual-editor.php' ),
			'topics'               => TVA_Topic::get_items(),
			'levels'               => TVA_Level::get_items(),
			'labels'               => tva_get_labels(),
			'defaults'             => array(
				'course_topic_icon' => TVA_Const::get_default_course_icon_url(),
			),
			'defaultAuthor'        => new TVA_Author( $logged_in_user->ID ),
			'lessonTypes'          => TVA_Lesson::$types,
			'postAcceptedStatuses' => TVA_Post::$accepted_statuses,
			'licenseActivated'     => tva_license_activated(),
			'dynamicLabelSetup'    => array(
				'settings'          => TVA_Dynamic_Labels::get(),
				'userLabelContexts' => TVA_Dynamic_Labels::get_user_switch_contexts(),
				'ctaLabelContexts'  => TVA_Dynamic_Labels::get_cta_contexts(),
			),
		);
	}

	/**
	 * Gets the singleton instance
	 *
	 * @return TVA_Admin
	 */
	public static function instance() {

		if ( ! self::$_instance ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}

	/**
	 * Calculates url to $file for admin context
	 *
	 * @param string $file
	 *
	 * @return string
	 */
	public function url( $file = '' ) {

		return plugin_dir_url( __FILE__ ) . ltrim( $file, '\\/' );
	}

	/**
	 * Calculates file path tp $file for admin context
	 *
	 * @param string $file
	 *
	 * @return string
	 */
	public static function path( $file = '' ) {

		return plugin_dir_path( __FILE__ ) . ltrim( $file, '\\/' );
	}

	/**
	 * Prints backbone templates onto print footer script action
	 */
	public function print_backbone_templates() {

		$templates = tve_dash_get_backbone_templates( $this->path( '/templates' ), 'templates' );
		tve_dash_output_backbone_templates( $templates );
	}

	/**
	 * Prints admin SVG icons in admin footer before body end tag
	 */
	public function print_icons() {
		include __DIR__ . '/assets/admin-icons.svg';
	}

	/**
	 * Setup the `folded` body class for the main apprentice admin app page
	 *
	 * @param string $classes
	 *
	 * @return string
	 */
	public function body_class( $classes ) {
		global $current_screen;

		if ( $current_screen && $current_screen->id === static::SCREEN_ID ) {
			$classes = trim( 'folded ' . $classes );
		}

		return $classes;
	}
}

/**
 * Shortcut for getting the admin instance
 *
 * @return TVA_Admin
 */
function tva_admin() {
	return TVA_Admin::instance();
}

/**
 * Initialise the admin
 */
tva_admin();
