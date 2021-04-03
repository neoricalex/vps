<?php

class TVA_Stacks_Controller extends TVA_REST_Controller {

	public $base = 'stacks';

	public function register_routes() {
		parent::register_routes();

		register_rest_route( self::$namespace . self::$version, '/' . $this->base . '/get_stacks/', array(
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'get_stacks' ),
				'permission_callback' => array( $this, 'get_stacks_permissions_check' ),
				'args'                => array(),
			)
		) );

	}

	public function get_stacks( $request ) {
		/** @var WP_REST_Request $request */
		$settings = $request->get_param('settings');

		$stacks = TVA_Logger::get_stacks($settings);

		if(!empty($stacks)) {
			return new WP_REST_Response( $stacks, 200 );
		}

		return new WP_Error( 'no-stacks', __( 'No more stacks found !', TVA_Const::T ), array( 'status' => 500 ) );

	}

	public function get_stacks_permissions_check( $request ) {
		return is_user_logged_in() && TVA_Product::has_access();
	}

}
