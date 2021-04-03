<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

namespace TVA\Architect\Course;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden!
}

/**
 * Class Utils
 *
 * @package  TVA\Architect\Course
 * @project  : thrive-apprentice
 */
class Utils {
	/**
	 * @param string $subpath
	 *
	 * @return string
	 */
	public static function get_integration_path( $subpath = '' ) {
		return \TVA_Const::plugin_path( 'tcb-bridge/' ) . $subpath;
	}

	/**
	 * @param string $root_path
	 * @param string $path
	 */
	public static function get_course_tcb_elements( $root_path, $path = null ) {
		/* if it's not a recursive call, use the root path */
		$path = ( $path === null ) ? $root_path : $path;

		$items    = array_diff( scandir( $path ), [ '.', '..' ] );
		$elements = array();

		foreach ( $items as $item ) {
			$item_path = $path . '/' . $item;
			/* if the item is a folder, enter it and do recursion */
			if ( is_dir( $item_path ) ) {
				$elements = array_merge( $elements, static::get_course_tcb_elements( $item_path ) );
			}

			/* if the item is a file, include it */
			if ( is_file( $item_path ) ) {
				$element = require_once $item_path;

				if ( ! empty( $element ) ) {
					$elements[ $element->tag() ] = $element;
				}
			}
		}

		return $elements;
	}

	/**
	 * Check if the array contains at least one published object
	 *
	 * @param Object[] $children_array
	 *
	 * @return bool
	 */
	public static function has_published_children( $children_array ) {
		$has_published_children = false;

		if ( ! empty( $children_array ) ) {
			foreach ( $children_array as $child ) {
				if ( $child->post_status === 'publish' ) {
					$has_published_children = true;
					break;
				}
			}
		}

		return $has_published_children;
	}
}
