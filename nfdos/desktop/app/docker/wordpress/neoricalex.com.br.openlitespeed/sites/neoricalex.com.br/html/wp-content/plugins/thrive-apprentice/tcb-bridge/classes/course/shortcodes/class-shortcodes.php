<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

namespace TVA\Architect\Course\Shortcodes;

use TVA\Architect\Course as Course;
use TVA\Architect\Course\Utils as Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden!
}

/**
 * Class Shortcodes
 *
 * @package  TVA\Architect\Course
 * @project  : thrive-apprentice
 */
class Shortcodes {
	const TVA_NO_DRAG_CLASS = 'tva-course-no-drag';
	const TVE_NO_DRAG_CLASS = 'tve_no_drag'; /* used to be compatible with TAR dragging logic */

	const THRV_WRAPPER_CLASS = 'thrv_wrapper';

	/**
	 * Contains the List of Shortcodes
	 *
	 * @var array
	 */
	protected $shortcodes = array();

	/**
	 * @var \TVA_Post - Can be Module, Chapter or Lesson
	 */
	protected $active_item;

	/**
	 * States identifiers
	 *
	 * @var int[]
	 */
	private $states = array(
		'not_completed' => 0,
		'no_access'     => 1,
		'completed'     => 2,
	);

	/**
	 * Shortcodes constructor.
	 *
	 * @param string $type
	 */
	public function __construct( $type = '' ) {

		$this->type = $type;

		$this->shortcodes = array(
			'tva_course_' . $type . '_children_count'     => 'children_count',
			'tva_course_' . $type . '_children_completed' => 'children_completed',
			'tva_course_' . $type . '_list'               => 'items',
			'tva_course_' . $type . '_begin'              => 'item_begin',
			'tva_course_' . $type . '_end'                => 'item_end',
			'tva_course_' . $type . '_title'              => 'title',
			'tva_course_' . $type . '_description'        => 'description',
			'tva_course_' . $type . '_url'                => 'url',
			'tva_course_' . $type . '_index'              => 'index',
			'tva_course_' . $type . '_status'             => 'status', //Completed | Not Completed
		);

		foreach ( $this->shortcodes as $shortcode => $function ) {
			add_shortcode( $shortcode, array( $this, $function ) );
		}
	}

	/**
	 * Renders the title shortcode
	 *
	 * @param array  $attr
	 * @param string $content
	 *
	 * @return string
	 */
	public function title( $attr = array(), $content = '' ) {
		if ( empty( $this->active_item ) ) {
			return '';
		}

		$title = $this->active_item->post_title;

		if ( ! empty( $attr['link'] ) ) {
			$attributes = array(
				'href' => get_permalink( $this->active_item->ID ),
			);

			if ( ! empty( $attr['target'] ) ) {
				$attributes['target'] = '_blank';
			}

			if ( ! empty( $attr['rel'] ) ) {
				$attributes['rel'] = 'nofollow';
			}

			if ( ! empty( $attr['link-css-attr'] ) ) {
				$attributes['data-css'] = $attr['link-css-attr'];
			}

			$title = \TCB_Utils::wrap_content( $title, 'a', '', array(), $attributes );
		} else {
			$title = \TVD_Global_Shortcodes::maybe_link_wrap( $title, $attr );
		}

		return $title;
	}

	/**
	 * Renders the description shortcode
	 *
	 * @param array  $attr
	 * @param string $content
	 *
	 * @return string
	 */
	public function description( $attr = array(), $content = '' ) {
		if ( empty( $this->active_item ) ) {
			return '';
		}

		$post_excerpt = strip_tags( $this->active_item->post_excerpt );
		$post_excerpt = \TVD_Global_Shortcodes::maybe_link_wrap( $post_excerpt, $attr );

		return $post_excerpt;
	}

	/**
	 * Renders the URL shortcode
	 *
	 * @param array  $attr
	 * @param string $content
	 * @param string $tag
	 *
	 * @return string
	 */
	public function url( $attr = array(), $content = '', $tag = '' ) {

		if ( empty( $this->active_item ) ) {
			return '[' . $tag . ']';
		}

		return get_permalink( $this->active_item->ID );
	}

	/**
	 * Index shortcode callback
	 *
	 * @param array  $attr
	 * @param string $content
	 * @param string $tag
	 *
	 * @return mixed|string|null
	 */
	public function index( $attr = array(), $content = '', $tag = '' ) {
		if ( empty( $this->active_item ) ) {
			return '';
		}

		return $this->active_item->index;
	}

	/**
	 * Render the status shortcode
	 *
	 * @param array  $attr
	 * @param string $content
	 *
	 * @return string
	 */
	public function status( $attr = array(), $content = '' ) {
		if ( empty( $this->active_item ) ) {
			return '';
		}

		return $this->active_item->is_completed() ? __( 'Completed', \TVA_Const::T ) : __( 'Not Completed', \TVA_Const::T );
	}

	/**
	 * Added the Children Count ShortCode
	 *
	 * @param array  $attr
	 * @param string $content
	 * @param string $tag
	 *
	 * @return string
	 */
	public function children_count( $attr = array(), $content = '', $tag = '' ) {
		if ( empty( $this->active_item ) ) {
			return '';
		}

		return count( $this->active_item->get_lessons() );
	}

	/**
	 * Renders the children completed shortcode
	 *
	 * @param array  $attr
	 * @param string $content
	 * @param string $tag
	 *
	 * @return int
	 */
	public function children_completed( $attr = array(), $content = '', $tag = '' ) {
		if ( empty( $this->active_item ) ) {
			return '';
		}

		return tva_count_completed_lessons( $this->active_item->get_lessons() );
	}

	/**
	 * Renders the list shortcode
	 *
	 * @param array  $attr
	 * @param string $content
	 *
	 * @return string
	 */
	public function items( $attr = array(), $content = '' ) {
		$return = '';

		$structure = $this->get_structure();
		$counter   = 0;

		/**
		 * @var $post \TVA_Post
		 */
		foreach ( $structure as $post ) {

			$this->set_active_item( null );

			if ( $post->post_type === $this->get_post_type() ) {
				$this->set_active_item( $post );

				if ( ! Course\Main::$is_editor_page && ! $post->is_published() ) {
					continue;
				}

				$this->active_item->index = ++ $counter;

				if ( ! empty( Course\Main::$display_level ) ) {

					if ( $this->active_item->ID === Course\Main::$display_level->post_parent ) {
						/**
						 * If the display_level is a chapter, and the active item is a module,
						 * we must render the active item content to skipp the module
						 */
						$this->set_active_item( null );
						break;
					}

					$ancestors = get_post_ancestors( $this->active_item->get_the_post() );
					if ( $this->active_item->ID !== Course\Main::$display_level->ID && ! in_array( Course\Main::$display_level->ID, $ancestors ) ) {
						continue;
					}
				}

				$attributes = array(
					'data-index'        => $this->active_item->index,
					'data-id'           => $post->ID,
					'data-type'         => str_replace( 'tva_', '', $post->post_type ),
					'data-course-state' => $this->get_active_state(),
				);

				$classes = array( "tva-course-$this->type", static::THRV_WRAPPER_CLASS, static::TVA_NO_DRAG_CLASS, static::TVE_NO_DRAG_CLASS );

				if ( empty( $content ) ) {
					$content = $this->get_default_content( $content );
				}

				/**
				 * We make a clone of the content not to affect the original content
				 */
				$prepared_content = $content;

				if ( count( $this->active_item->get_structure() ) === 0 ) {
					/**
					 * If there are no children, we render the item content.
					 *
					 * Handles the use case for dynamic links inside the item content
					 */
					$prepared_content = $this->prepare_content( $prepared_content );
				}

				$return .= \TCB_Utils::wrap_content( do_shortcode( $prepared_content ), 'div', '', $classes, $attributes );
			}
		}

		if ( empty( $this->active_item ) && $this->get_post_type() !== \TVA_Const::LESSON_POST_TYPE ) {

			/**
			 * If the system reaches this point it means that there is no (module|chapter|lesson) for the defined structure
			 * We must render the content to display the List
			 */
			$return .= do_shortcode( $content );
		} else {
			/**
			 * We have the active item, we need to wrap the content inside the active item wrapper
			 */
			$classes    = array( "tva-course-$this->type-list", static::THRV_WRAPPER_CLASS, static::TVA_NO_DRAG_CLASS, static::TVE_NO_DRAG_CLASS );
			$attributes = array();
			$return     = \TCB_Utils::wrap_content( $return, 'div', '', $classes, $attributes );
		}

		return $return;
	}

	/**
	 * Can be extended by the child classes
	 *
	 * @param string $content
	 *
	 * @return mixed
	 */
	public function get_default_content( $content ) {
		return $content;
	}

	/**
	 * Renders the dropzone before the element
	 *
	 * @param array  $attr
	 * @param string $content
	 *
	 * @return string
	 */
	public function item_begin( $attr = array(), $content = '' ) {

		if ( empty( $this->active_item ) ) {
			return '';
		}

		$classes = array( "tva-course-$this->type-dropzone", 'tva-course-dropzone', static::THRV_WRAPPER_CLASS, static::TVA_NO_DRAG_CLASS, static::TVE_NO_DRAG_CLASS );

		if ( ! empty( Course\Main::$course_attr["default-state"] ) && empty( Course\Main::$course_attr["deny-collapse-$this->type"] ) ) {
			$classes[] = 'tve-state-expanded';
		}

		$attributes = array();

		if ( empty( $content ) ) {
			$item_type = str_replace( 'tva_', '', $this->active_item->post_type );
			$content   = static::get_default_template( $item_type );
		}

		$content = $this->prepare_content( $content );

		return \TCB_Utils::wrap_content( do_shortcode( $content ), 'div', '', $classes, $attributes );
	}

	/**
	 * @param string $item_type
	 *
	 * @return string
	 */
	public static function get_default_template( $item_type ) {
		ob_start();

		require_once( Utils::get_integration_path( "classes/course/default-content/$item_type.php" ) );

		$content = ob_get_contents();

		ob_end_clean();

		return $content;
	}

	/**
	 * Renders the dropzone after the element
	 *
	 * @param array  $attr
	 * @param string $content
	 *
	 * @return string
	 */
	public function item_end( $attr = array(), $content = '' ) {
		/**
		 * For now we do not render this shortcode
		 *
		 * In the future, extra functionality will be added here
		 */
		return '';
	}

	/**
	 * Returns the class shortcodes names as a list
	 *
	 * @return array
	 */
	public function get_shortcodes() {
		return array_keys( $this->shortcodes );
	}

	/**
	 * Sets the Class Active Item
	 *
	 * Should be extended by child classes
	 *
	 * @param $data null|\TVA_Post
	 */
	protected function set_active_item( $data ) {
		$this->active_item = $data;

		if ( $data ) {
			Course\Main::$parent_item = $data;
		}
	}

	/**
	 * Returns the structure
	 *
	 * Extended in child classes
	 *
	 * @return array
	 */
	protected function get_structure() {
		return Course\Main::$parent_item->get_structure();
	}

	/**
	 * Returns the shortcode post type
	 *
	 * Should be extended by child classes
	 *
	 * @return string
	 */
	protected function get_post_type() {
		return '';
	}

	/**
	 * Construct the inline shortcodes after the brackets have been replace with entities
	 *
	 * Used for constructing back the dynamic links shortcodes
	 *
	 * @param string $content
	 *
	 * @return string
	 */
	private function construct_inline_shortcodes( $content = '' ) {
		$trans = array(
			'&#091;' => '[',
			'&#093;' => ']',
		);

		return strtr( $content, $trans );
	}

	/**
	 * Builds the state content
	 *
	 * 1. If is_editor_page -> output all the states with default state displayed
	 * 2. If is on frontend -> output only the active user state
	 *
	 * @param string $content
	 *
	 * @return string
	 */
	private function parse_states_content( $content = '' ) {

		if ( Course\Main::$is_editor_page ) {
			$search  = array( 'data-course-state="1"', 'data-course-state="2"' );
			$replace = array( 'data-course-state="1" style="display:none;"', 'data-course-state="2" style="display:none;"' );

			$content = str_replace( $search, $replace, $content );
		} else {
			$active_state = $this->get_active_state();

			foreach ( array_values( $this->states ) as $state ) {
				if ( $active_state === $state ) {
					continue;
				}

				$search  = array( 'data-course-state="' . $state . '"' );
				$replace = array( 'data-course-state="' . $state . '" style="display:none;" data-tva-remove-state="1"' );

				$content = str_replace( $search, $replace, $content );

				/*
				preg_match( '/<div class="tva-course-state" data-course-state="' . $state . '">((\n)*|(\t)*|.)*(<div class="tva-course-state|<\/div>$)/is', $content, $m );

				if ( ! empty( $m[0] ) ) {

					$exploded = explode( '<div class="tva-course-state', $m[0] );

					if ( count( $exploded ) === 3 ) {
						array_pop( $exploded );
					}

					$state_to_remove = join( '<div class="tva-course-state', $exploded );


					$content = str_replace( $state_to_remove, '', $content );
				}
				*/
			}
		}

		return $content;
	}

	/**
	 * Returns the user active state
	 *
	 * @return int
	 */
	private function get_active_state() {

		if ( Course\Main::$is_editor_page ) {
			/**
			 * If is_editor_page, we return the not completed state
			 */
			return $this->states['not_completed'];
		}

		if ( is_numeric( $this->active_item->active_state ) ) {
			return $this->active_item->active_state;
		}

		$state = $this->states['not_completed'];

		if ( $this->active_item->is_completed() ) {
			$state = $this->states['completed'];
		}

		if ( ! tva_access_manager()->has_access_to_post( $this->active_item->get_the_post() ) ) {
			$state = $this->states['no_access'];
		}

		/**
		 * Cache the active state to avoid the same logic called multiple times
		 */
		$this->active_item->active_state = $state;

		return $state;
	}

	/**
	 * Prepares the content for display
	 *
	 * @param string $content
	 *
	 * @return string
	 */
	private function prepare_content( $content = '' ) {

		$content = $this->construct_inline_shortcodes( $content );

		$content = $this->parse_states_content( $content );

		return $content;
	}
}
