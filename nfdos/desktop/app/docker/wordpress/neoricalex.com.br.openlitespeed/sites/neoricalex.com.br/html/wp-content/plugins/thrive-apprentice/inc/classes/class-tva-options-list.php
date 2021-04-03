<?php


/**
 * Class TVA_Options_List
 *
 * @property integer ID
 * @property integer id
 */
class TVA_Options_List implements JsonSerializable {

	/**
	 * @var array properties of model
	 */
	protected $_data = array();

	/**
	 * @var array
	 */
	protected static $_list = array();

	/**
	 * TVA_Options_List constructor.
	 *
	 * @param array $data
	 */
	public function __construct( $data ) {
		$this->_data = $data;
	}

	/**
	 * Gets a prop from current model
	 *
	 * @param {string} $key
	 *
	 * @return mixed|null
	 */
	public function __get( $key ) {

		$value = null;

		if ( isset( $this->_data[ $key ] ) ) {
			$value = $this->_data[ $key ];
		}

		return $value;
	}

	/**
	 * Which wp_option should be queried for the options list
	 *
	 * @return string
	 */
	static public function get_option_name() {
		return '';
	}

	/**
	 * @return static[]
	 */
	public static function get_items() {

		if ( static::$_list ) {
			return static::$_list;
		}

		$items   = array();
		$options = get_option( static::get_option_name(), array() );

		foreach ( $options as $index => $item ) {
			$item['id'] = isset( $item['ID'] ) ? $item['ID'] : $index;
			$item['ID'] = isset( $item['ID'] ) ? $item['ID'] : $index;
			$items[]    = new static( $item );
		}

		return $items;
	}

	/**
	 * Called when current instance has to be json encoded
	 *
	 * @return array
	 */
	public function jsonSerialize() {
		return $this->_data;
	}
}
