<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden!
}

class TVA_Settings_Controller_V2 extends TVA_REST_Controller {
	/**
	 * Controller base
	 *
	 * @var string
	 */
	public $base = 'settings-v2';

	/**
	 * Register the routes
	 */
	public function register_routes() {
		register_rest_route( self::$namespace . self::$version, '/' . $this->base, array(
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'save' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(),
			),
		) );

		register_rest_route( self::$namespace . self::$version, '/' . $this->base . '/switch_preview/', array(
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'switch_preview' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(),
			),
		) );

		/**
		 * Register the routes for Login page
		 */
		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/core-page/create',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_core_page' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/core-page/update/',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_core_page' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/core-page/delete/',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'delete_core_page' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(),
				),
			)
		);
	}

	/**
	 * @param $request WP_REST_Request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function save( $request ) {
		$key   = sanitize_text_field( $request->get_param( 'key' ) );
		$value = $request->get_param( 'value' );

		$return = tva_get_settings_manager()->save_setting( $key, $value );

		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * Change the preview option for the user
	 *
	 * @param $request WP_REST_Request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function switch_preview( $request ) {

		$this->save( $request );

		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function create_core_page( $request ) {

		$post_title = sanitize_text_field( $request->get_param( 'title' ) );
		$type       = sanitize_text_field( $request->get_param( 'name' ) );
		$post_id    = tva_get_settings_manager()->create( array(
				'title' => $post_title,
				'name'  => $type,
			)
		);
		$response   = $this->_handle_page_change( $type, $post_id );

		return new WP_REST_Response( $response, 200 );
	}

	/**
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function update_core_page( $request ) {

		$id       = sanitize_text_field( $request->get_param( 'value' ) );
		$type     = sanitize_text_field( $request->get_param( 'name' ) );
		$response = $this->_handle_page_change( $type, $id );

		return new WP_REST_Response( $response, 200 );
	}

	/**
	 * Remove set page from being TA login page, but the post associated with it won't be deleted
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Request
	 */
	public function delete_core_page( $request ) {

		$type = sanitize_text_field( $request->get_param( 'name' ) );

		tva_get_settings_manager()->save_setting( $type, 0 );

		return new WP_REST_Request( true, 200 );
	}

	/**
	 * Check if the user has permission to execute this ajax call
	 *
	 * @param $request
	 *
	 * @return bool
	 */
	public function permission_check( $request ) {
		return TVA_Product::has_access();
	}

	/**
	 * Update the setting for a given page and also add needed TAR element on it
	 *
	 * @param string $type
	 * @param int    $id
	 *
	 * @return array
	 */
	private function _handle_page_change( $type, $id ) {
		tva_get_settings_manager()->save_setting( $type, $id );

		switch ( $type ) {
			case 'checkout_page':
				tva_get_settings_manager()->add_checkout_element( $id );
				break;

			case 'login_page':
				tva_get_settings_manager()->add_login_element( $id );
				break;
		}

		return tva_get_settings_manager()->get_setting_array( $type );
	}
}
