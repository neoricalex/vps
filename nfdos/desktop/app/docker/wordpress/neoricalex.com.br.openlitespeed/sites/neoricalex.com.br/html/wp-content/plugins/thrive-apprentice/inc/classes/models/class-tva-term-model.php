<?php
/**
 * Created by PhpStorm.
 * User: User
 * Date: 4/24/2019
 * Time: 15:02
 */

/**
 * Class TVA_Term_Model
 *
 * @property string $name
 * @property string $description
 * @property string $slug
 * @property array  $membership_ids
 * @property array  $bundle_ids
 */
class TVA_Term_Model extends TVA_Model {

	const TAXONOMY = TVA_Const::COURSE_TAXONOMY;

	/**
	 * @var
	 */
	public $term_id;

	/**
	 * TVA_Term_Model constructor.
	 *
	 * @param WP_Term|array $data
	 */
	public function __construct( $data ) {

		$this->data = $data;

		foreach ( $this->get_public_fields() as $field ) {
			if ( $data instanceof WP_Term || $data instanceof self ) {
				$this->$field = isset( $data->$field ) ? $data->$field : '';
			} elseif ( is_array( $data ) ) {
				$this->$field = isset( $data[ $field ] ) ? $data[ $field ] : '';
			}
		}

		$this->_set_protection_fields();

		return $this;
	}

	/**
	 * @return array|mixed
	 */
	public function get_public_fields() {
		return array(
			'term_id',
			'name',
			'slug',
			'term_group',
			'term_taxonomy_id',
			'taxonomy',
			'description',
			'parent',
			'count',
			'filter',
		);
	}

	/**
	 * Return all extra fields for this term
	 *
	 * @return array
	 */
	public function get_extra_fields() {
		return array(
			'cover_image',
			'order',
			'level',
			'logged_in',
			'message',
			'roles',
			'topic',
			'author',
			'status',
			'description',
			'label',
			'label_name',
			'label_color',
			'excluded',
			'membership_ids',
			'bundle_ids',
			'video_status',
			'term_media',
			'comment_status',
		);
	}

	private function _set_extra_fields() {
		foreach ( $this->get_extra_fields() as $field ) {
			$this->$field = isset( $this->data[ $field ] ) ? $this->data[ $field ] : '';
		}
	}

	private function _save_extra_fields() {
		foreach ( $this->get_extra_fields() as $field ) {
			update_term_meta( $this->term_id, 'tva_' . $field, $this->data[ $field ] );
		}
	}

	private function _set_protection_fields() {
		$this->membership_ids = isset( $this->membership_ids )
			? $this->membership_ids
			: get_term_meta( $this->term_id, 'tva_membership_ids', true );
		$this->bundle_ids     = isset( $this->bundle_ids )
			? $this->bundle_ids
			: get_term_meta( $this->term_id, 'tva_bundle_ids', true );
	}

	/**
	 * Check if current instance is protected by sendowl
	 *
	 * @return bool
	 */
	public function is_protected_by_sendowl() {
		return is_array( $this->membership_ids ) && array_key_exists( 'sendowl', $this->membership_ids ) && ! empty( $this->membership_ids['sendowl'] )
		       || is_array( $this->bundle_ids ) && array_key_exists( 'sendowl', $this->bundle_ids ) && ! empty( $this->bundle_ids['sendowl'] );
	}

	/**
	 * @return array|mixed
	 */
	public function get_sendowl_products_ids() {
		return isset( $this->membership_ids['sendowl'] ) ? $this->membership_ids['sendowl'] : array();
	}

	/**
	 * @return array|mixed
	 */
	public function get_sendowl_bundles_ids() {
		return isset( $this->bundle_ids['sendowl'] ) ? $this->bundle_ids['sendowl'] : array();
	}

	/**
	 * @return mixed
	 */
	public function get_id() {
		return $this->term_id;
	}

	public function save() {
		$this->term_id
			? $this->_update()
			: $this->_create();

		if ( ! empty( $this->errors ) ) {
			return $this->errors[0];
		}

		return $this->prepare_response();
	}

	private function _create() {
		$result = wp_insert_term(
			$this->name,
			TVA_Const::COURSE_TAXONOMY,
			array(
				'description' => $this->description,
				'slug'        => $this->slug,
			)
		);

		if ( $result instanceof WP_Error ) {
			$this->errors[] = $result;

			return;
		}

		$this->term_id = $result['term_id'];
		$this->_set_extra_fields();
		$this->_save_extra_fields();
	}

	private function _update() {
		$result = wp_update_term(
			$this->term_id,
			TVA_Const::COURSE_TAXONOMY,
			array(
				'description' => $this->description,
				'slug'        => $this->slug,
			)
		);

		$this->_set_extra_fields();
	}

	public function prepare_response() {
		$response = $this->to_array();

		foreach ( $this->get_extra_fields() as $field ) {
			$response[ $field ] = $this->$field;
		}

		return $response;
	}
}
