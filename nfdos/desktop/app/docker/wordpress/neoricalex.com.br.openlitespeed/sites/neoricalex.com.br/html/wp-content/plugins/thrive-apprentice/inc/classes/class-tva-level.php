<?php

/**
 * Class TVA_Level
 * Defines a level property for a course
 */
class TVA_Level extends TVA_Options_List {

	const COURSE_TERM_NAME = 'tva_level';

	/**
	 * @return string
	 */
	static public function get_option_name() {
		return 'tva_difficulty_levels';
	}

	/**
	 * @return array[]|TVA_Level[]
	 */
	public static function get_items() {

		$items = parent::get_items();

		return ! empty( $items ) ? $items : self::get_defaults();
	}

	/**
	 * Get default levels
	 *
	 * @return array[]
	 */
	public static function get_defaults() {
		return array(
			array(
				'ID'   => 0,
				'id'   => 0,
				'name' => 'None',
			),
			array(
				'ID'   => 1,
				'id'   => 1,
				'name' => 'Easy',
			),
			array(
				'ID'   => 2,
				'id'   => 2,
				'name' => 'Intermediate',
			),
			array(
				'ID'   => 3,
				'id'   => 3,
				'name' => 'Advanced',
			),
		);
	}

}
