<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-visual-editor
 */

namespace TVA\Architect\Course;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden!
}

/**
 * Class Abstract_Sub_Element
 *
 * @package TVA\Architect\Course
 */
abstract class Abstract_Sub_Element extends \TCB_Element_Abstract {

	/**
	 * Abstract_Sub_Element constructor.
	 *
	 * @param string $tag
	 */
	public function __construct( $tag = '' ) {
		parent::__construct( $tag );

		/* add some extra configurations */
		add_filter( 'tcb_element_' . $this->tag() . '_config', array( $this, 'add_config' ) );
	}

	public function add_config( $config ) {
		$config['is_sub_element'] = $this->is_sub_element();

		return $config;
	}

	/**
	 * This is a sub-element for course-structure and we want to store this in the config
	 *
	 * @return bool
	 */
	public function is_sub_element() {
		return false;
	}

	/**
	 * All sub-elements are hidden
	 *
	 * @return bool
	 */
	public function hide() {
		return true;
	}

	/**
	 * @return array
	 */
	public function own_components() {
		$components = $this->general_components();

		foreach ( $components['typography']['config'] as $control => $config ) {
			if ( in_array( $control, array( 'css_suffix', 'css_prefix' ) ) ) {
				continue;
			}

			/* typography should apply only on the current element */
			$components['typography']['config'][ $control ]['css_suffix'] = array( '' );
		}

		$components['layout'] = array( 'disabled_controls' => array( 'Display', 'Alignment', 'Width', 'Height', 'Float', '[data-value="absolute"]', 'Overflow' ) );

		return $components;
	}

	/**
	 * Returns the course structure element config
	 *
	 * @return array
	 */
	protected function get_course_structure_element_config() {
		return array(
			'course-structure-item' => array(
				'config' => array(
					'ToggleIcon'           => array(
						'config'  => array(
							'name'  => '',
							'label' => __( 'Show Icon', \TVA_Const::T ),
						),
						'extends' => 'Switch',
					),
					'ToggleExpandCollapse' => array(
						'config'  => array(
							'name'  => '',
							'label' => __( 'Show Expand / Collapse Icon', \TVA_Const::T ),
						),
						'extends' => 'Switch',
					),
					'Height'               => array(
						'config'     => array(
							'default' => '150',
							'min'     => '1',
							'max'     => '500',
							'label'   => __( 'Height', \TVA_Const::T ),
							'um'      => array( 'px' ),
							'css'     => 'min-height',
						),
						'css_suffix' => ' .tva-course-state-content',
						'extends'    => 'Slider',
					),
					'VerticalPosition'     => array(
						'config'  => array(
							'name'      => __( 'Icon position', \TVA_Const::T ),
							'important' => true,
							'buttons'   => array(
								array(
									'icon'    => 'none',
									'default' => true,
									'value'   => '',
								),
								array(
									'icon'  => 'top',
									'value' => 'flex-start',
								),
								array(
									'icon'  => 'vertical',
									'value' => 'center',
								),
								array(
									'icon'  => 'bot',
									'value' => 'flex-end',
								),
							),
						),
						'extends' => 'ButtonGroup',
					),
				),
			),
		);
	}
}
