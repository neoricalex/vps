<?php

class TVA_Levels_Controller extends TVA_REST_Controller {

	public $base = 'levels';

	/**
	 * Register Routes
	 */
	public function register_routes() {

		register_rest_route( self::$namespace . self::$version, '/' . $this->base, array(
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'save_levels' ),
				'permission_callback' => array( $this, 'levels_permissions_check' ),
				'args'                => array(),
			),
		) );

		register_rest_route( self::$namespace . self::$version, '/' . $this->base . '/(?P<ID>[\d]+)', array(
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_level' ),
				'permission_callback' => array( $this, 'levels_permissions_check' ),
				'args'                => array(),
			),
		) );
	}

	public function save_levels( $request ) {
		/**
		 * We should add the new level
		 */
		$levels = get_option( 'tva_difficulty_levels', TVA_Level::get_defaults() );
		$id     = 0;
		if ( ! empty( $levels ) ) {
			/**
			 * Get the biggest ID so we can create our new one
			 */
			foreach ( $levels as $level ) {
				if ( $level['ID'] > $id ) {
					$id = $level['ID'];
				}
			}
		}

		$id ++;

		$model = array(
			'ID'   => $id,
			'id'   => $id,
			'name' => $request->get_param( 'name' ),
		);

		$levels[] = $model;
		$result   = update_option( 'tva_difficulty_levels', $levels );

		if ( $result ) {
			return new WP_REST_Response( $model, 200 );
		}

		return new WP_Error( 'no-results', __( 'No level was updated!', TVA_Const::T ) );
	}

	public function levels_permissions_check( $request ) {
		return TVA_Product::has_access();
	}

	public function delete_level( $request ) {
		$id = $request->get_param( 'ID' );

		$levels = get_option( 'tva_difficulty_levels', array() );
		foreach ( $levels as $key => $level ) {
			if ( $level['ID'] == $id ) {
				unset( $levels[ $key ] );
			}
		}
		$levels = array_values( $levels );

		$result = update_option( 'tva_difficulty_levels', $levels );

		if ( $result ) {
			return new WP_REST_Response( $result, 200 );
		}

		return new WP_Error( 'no-results', __( 'No level was deleted!', TVA_Const::T ) );
	}
}
