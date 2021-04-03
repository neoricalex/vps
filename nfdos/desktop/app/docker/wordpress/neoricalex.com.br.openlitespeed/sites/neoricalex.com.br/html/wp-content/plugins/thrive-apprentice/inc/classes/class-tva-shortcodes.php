<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden
}

/**
 * Class TVA_Shortcodes
 */
class TVA_Shortcodes {

	/**
	 * We should set the course to this
	 *
	 * @var WP_Term
	 */
	public $course = '';

	/**
	 * @var array
	 */
	public $settings = array();

	/**
	 * TVA_Shortcodes constructor.
	 */
	public function __construct() {
		add_shortcode( 'tva_progress_bar', array( $this, 'tva_progress_bar' ) );
		add_shortcode( 'tva_author', array( $this, 'tva_author' ) );
		add_shortcode( 'tva_lesson_list', array( $this, 'tva_lesson_list' ) );
		add_shortcode( 'tva_lesson_title', array( $this, 'tva_lesson_title' ) );
		add_shortcode( 'tva_sendowl_buy', array( $this, 'tva_checkout_link' ) );
		add_shortcode( 'tva_sendowl_product', array( $this, 'tva_sendowl_product' ) );
	}

	/**
	 * Callback for progress bar shortcode
	 *
	 * @param        $atts
	 * @param string $content
	 *
	 * @return string
	 */
	public function tva_progress_bar( $atts, $content = '' ) {
		$course_id = '';
		$progress  = 0;
		$obj       = get_queried_object();
		global $post;

		if ( isset( $atts['course_id'] ) && ! empty( $atts['course_id'] ) ) {
			$course_id = $atts['course_id'];
		}

		if ( empty( $this->settings ) ) {
			$this->set_settings();
		}

		$this->set_course( $course_id );

		if ( tva_is_course_guide( $this->course ) && tva_get_settings_manager()->is_index_page() ) {
			return $content;
		}

		$lessons_learned = $this->get_learned_lessons();

		/**
		 * Count the progress (this includes the lesson which is in progress right now)
		 */
		if ( $this->course && isset( $lessons_learned[ $this->course->term_id ] ) ) {
			$done     = count( $lessons_learned[ $this->course->term_id ] );
			$progress = $this->course->published_lessons_count == 0 ? 0 : $done / $this->course->published_lessons_count * 100;
			$progress = $progress > 100 ? 100 : $progress; // make sure we never have a progress higher then 100
		}

		/**
		 * Check on which page we're listing the shortcode.
		 * In the Lesson page we should not show the title because
		 * it can be set directly from the Title attribute
		 */
		if ( ! empty( $this->settings ) && isset( $this->settings['template']['progress_bar'] ) ) {
			$title = $this->settings['template']['progress_bar'];
		} else {
			$title = ! empty( $atts['title'] ) ? $atts['title'] : TVA_Const::TVA_SHORTCODE_PROGRESS;
		}

		/**
		 * Render the shortcode
		 */
		switch ( $progress ) {
			case 0:
				$content .= '<h3 class="tva_progress_bar">';
				$content .= $title;
				$content .= '</h3>';

				$content .= '<span class="tva_progress_bar_not_started">';
				$content .= isset( $this->settings['template']['progress_bar_not_started'] ) ? $this->settings['template']['progress_bar_not_started'] : TVA_Const::TVA_SHORTCODE_PROGRESS_NOT_STARTED;
				$content .= '</span>';
				break;
			case 100:
				$content .= '<h3 class="tva_progress_bar">';
				$content .= $title;
				$content .= '</h3>';

				$content .= '<span class="tva_progress_bar_finished">';
				$content .= isset( $this->settings['template']['progress_bar_finished'] ) ? $this->settings['template']['progress_bar_finished'] : TVA_Const::TVA_SHORTCODE_PROGRESS_FINISHED;
				$content .= '</span> <span class="tva-check"><div class="tva-checkmark-stem"></div><div class="tva-checkmark-kick"></div></span>';
				$content .= '<div class="tva-progress-bar">';
				$content .= '<div class="tva-progress-bar-colored tva_main_color_bg" style="width: ';
				$content .= $progress;
				$content .= '%"></div>';
				$content .= '</div>';
				break;
			default:
				$content .= '<h3 class="tva_progress_bar">';
				$content .= $title;
				$content .= '</h3>';

				$content .= '<div class="tva-progress-bar">';
				$content .= '<div class="tva-progress-bar-colored tva_main_color_bg" style="width: ';
				$content .= $progress;
				$content .= '%"></div>';
				$content .= '</div>';
				break;
		}

		return $content;
	}

	/**
	 * Set the user settings in this instance
	 */
	public function set_settings() {
		$this->settings = tva_get_settings_manager()->localize_values();
	}

	/**
	 * Set the course in this instance
	 *
	 * @param string $term_id
	 */
	public function set_course( $term_id = '' ) {
		$obj = get_queried_object();

		if ( tva_is_apprentice() ) {
			/** we should determine here if we're on a course or on a lesson page */
			if ( is_tax( TVA_Const::COURSE_TAXONOMY ) ) {
				$term_id = $obj->term_id;
			} elseif ( is_single() ) {
				$terms   = wp_get_post_terms( $obj->ID, TVA_Const::COURSE_TAXONOMY );
				$term_id = $terms[0]->term_id;
			}
		}
		if ( ! empty( $term_id ) ) {
			$this->course = tva_get_course_by_id( $term_id, array( 'published' => true ) );
		}
	}

	/**
	 * Returns an array of courses and lessons that the user has seen
	 *
	 * @return array|mixed|object|string
	 */
	public static function get_learned_lessons() {

		if ( is_user_logged_in() ) {
			$user_id         = get_current_user_id();
			$lessons         = get_user_meta( $user_id, 'tva_learned_lessons', true );
			$lessons_learned = $lessons ? $lessons : array();

			if ( empty( $lessons_learned ) ) {
				$lessons_learned = isset( $_COOKIE['tva_learned_lessons'] ) ? $_COOKIE['tva_learned_lessons'] : array();
				if ( ! is_array( $lessons_learned ) ) {
					$lessons_learned = stripslashes( $lessons_learned );
					$lessons_learned = json_decode( $lessons_learned, JSON_OBJECT_AS_ARRAY );
				}
			}
		} else {
			$lessons_learned = isset( $_COOKIE['tva_learned_lessons'] ) ? $_COOKIE['tva_learned_lessons'] : array();
			if ( ! is_array( $lessons_learned ) ) {
				$lessons_learned = stripslashes( $lessons_learned );
				$lessons_learned = json_decode( $lessons_learned, JSON_OBJECT_AS_ARRAY );
			}
		}

		return $lessons_learned;
	}

	/**
	 * Callback for the author shortcode
	 *
	 * @param array  $attrs
	 * @param string $content
	 *
	 * @return string
	 */
	public function tva_author( $attrs, $content = '' ) {

		$template_settings = tva_get_settings_manager()->get_setting( 'template' );

		if ( tva_course()->get_id() && ! empty( $template_settings['author'] ) ) {
			$title = $template_settings['author'];
		} else {
			$title = isset( $attrs['title'] ) ? $attrs['title'] : TVA_Const::TVA_SHORTCODE_AUTHOR;
		}

		$author_instance = new TVA_Author( null, tva_course()->get_id() );

		/**
		 * used in template
		 */
		$bio    = $author_instance->get_bio();
		$avatar = $author_instance->get_avatar();

		ob_start();
		include dirname( __FILE__ ) . './../views/author.phtml';
		$content = ob_get_clean();

		return $content;
	}

	/**
	 * Callback for the completed lessons shortcode
	 *
	 * @param        $atts
	 * @param string $content
	 *
	 * @return string
	 */
	public function tva_lesson_list( $atts, $content = '' ) {
		if ( empty( $this->course ) ) {
			$this->set_course();
		}

		if ( tva_is_course_guide( $this->course ) ) {
			return $content;
		}

		if ( empty( $this->settings ) ) {
			$this->set_settings();
		}

		if ( ! empty( $this->course->lessons ) || ! empty( $this->course->modules ) || ! empty( $this->course->chapters ) ) {
			if ( ( is_tax( TVA_Const::COURSE_TAXONOMY )
			       || ( is_singular( TVA_Const::LESSON_POST_TYPE ) || is_singular( TVA_Const::MODULE_POST_TYPE ) ) )
			     && ! empty( $this->settings )
			     && isset( $this->settings['template']['lesson_list'] )
			     && ! empty( $this->settings['template']['lesson_list'] )
			     && ( ! is_array( $atts ) || empty( $atts['title'] ) )
			) {
				$title = $this->settings['template']['lesson_list'];
			} else {
				$title = is_array( $atts ) && ! empty( $atts['title'] ) ? $atts['title'] : TVA_Const::TVA_SHORTCODE_LESSONS;
			}

			$content .= '<div class="tva-lessons-learned">';
			$content .= '<h3 class="tva_lesson_list">';
			$content .= $title;
			$content .= '</h3>';

			if ( ! empty( $this->course->lessons ) ) {
				/** @var $lesson -> put the lessons in */
				foreach ( $this->course->lessons as $lesson ) {
					$content .= $this->tva_render_lesson( $lesson );
				}
			} elseif ( ! empty( $this->course->chapters ) ) {
				foreach ( $this->course->chapters as $chapter ) {
					$content .= $this->tva_render_chapter( $chapter );
				}
			} elseif ( ! empty( $this->course->modules ) ) {
				foreach ( $this->course->modules as $module ) {
					$content .= $this->tva_single_module( $module );
				}
			}

			$content .= '</div>';
		}

		return $content;
	}

	/**
	 * Render html for a single module
	 *
	 * @param $module WP_Post
	 *
	 * @return string
	 */
	public function tva_single_module( $module ) {


		if ( false === ( $module instanceof WP_Post ) ) {
			return '';
		}

		if ( empty( $module->chapters ) && empty( $module->lessons ) ) {
			return '';
		}

		$done = tva_is_module_completed( $module ) ? 'done' : '';
		$icon = tva_get_svg_icon( 'green-check', '', true );

		ob_start();

		include dirname( dirname( __FILE__ ) ) . '/views/widget/module.phtml';

		$html = ob_get_clean();

		return $html;
	}

	/**
	 * Render html for a single chapter
	 *
	 * @param $chapter WP_Post used in included template
	 *
	 * @return string
	 */
	public function tva_render_chapter( $chapter ) {

		ob_start();
		include dirname( dirname( __FILE__ ) ) . '/views/widget/chapter.phtml';
		$html = ob_get_clean();

		return $html;
	}

	/**
	 * Build html for a single lesson
	 *
	 * @param $lesson WP_Post
	 *
	 * @return string
	 */
	public function tva_render_lesson( $lesson ) {
		/** @var $lesson -> put the lessons in */
		/** @var $viewed -> 0 is a lesson in progress 1 is a lesson which is completed */
		$allowed         = tva_access_manager()->has_access_to_post( $lesson );
		$lessons_learned = $this->get_learned_lessons();
		$viewed          = '';
		$content         = '<div class="tva-lesson-container tva_main_color" data-id="' . $lesson->ID . '">';
		if ( array_key_exists( $this->course->term_id, $lessons_learned ) && array_key_exists( $lesson->ID, $lessons_learned[ $this->course->term_id ] ) ) {
			$viewed = $lessons_learned[ $this->course->term_id ][ $lesson->ID ];
		}
		global $post;

		if ( ! $viewed && isset( $post ) && ! empty( $post ) && is_single() && $post->post_type == TVA_Const::LESSON_POST_TYPE && $post->ID === $lesson->ID ) {
			$viewed = 0;
		}

		$content .= '<div class="tva-icon-container">';
		$content .= '<div class="tva-cm-icons">';

		if ( $viewed === 1 ) {
			$icon = '<span class="tva-lesson-completed">' . tva_get_svg_icon( 'lesson-completed', '', true ) . '</span>';
		} elseif ( $viewed === 0 ) {
			$icon = '<span class="tva-lesson-in-progress ">' . tva_get_svg_icon( 'lesson-in-progress', 'tva_main_color', true ) . '</span>';
		} else {
			$icon = '<span class="tva-lesson-not-viewed">' . tva_get_svg_icon( 'sym-two', '', true ) . '</span>';
		}
		$content .= $icon;
		$content .= '</div>';
		$content .= '</div>';
		$content .= '<div class="tva-widget-lesson-info">';
		$content .= '<a class="tva_main_color" href="' . get_permalink( $lesson->ID ) . '">';
		$content .= $lesson->post_title;
		$content .= '</a>';

		if ( ! $allowed ) {
			$label = tva_get_labels( array( 'ID' => $this->course->label ) );
			$view  = ! empty( $label['title'] ) ? $label['title'] : __( 'Members Only', 'thrive-apprentice' );
			$class = TVA_Const::TVA_SHORTCODE_CLASS_NOT_VIEWED;
		} elseif ( $viewed === 1 ) {
			$view  = ! empty( $this->settings ) && isset( $this->settings['template']['lesson_list_completed'] ) ? $this->settings['template']['lesson_list_completed'] : TVA_Const::TVA_SHORTCODE_LESSONS_COMPLETED;
			$class = TVA_Const::TVA_SHORTCODE_CLASS_COMPLETED;
		} elseif ( $viewed === 0 ) {
			$view  = ! empty( $this->settings ) && isset( $this->settings['template']['lesson_list_progress'] ) ? $this->settings['template']['lesson_list_progress'] : TVA_Const::TVA_SHORTCODE_LESSONS_PROGRESS;
			$class = TVA_Const::TVA_SHORTCODE_CLASS_PROGRESS;
		} else {
			$view  = ! empty( $this->settings ) && isset( $this->settings['template']['lesson_list_not_viewed'] ) ? $this->settings['template']['lesson_list_not_viewed'] : TVA_Const::TVA_SHORTCODE_LESSONS_NOT_VIEWED;
			$class = TVA_Const::TVA_SHORTCODE_CLASS_NOT_VIEWED;
		}
		$content .= '<div class="tva-lesson-description ';
		$content .= $class;
		$content .= '">';
		$content .= $view;
		$content .= '</div>';
		$content .= '</div>';
		$content .= '</div>';

		return $content;
	}

	/**
	 * Callback for lesson title shortcode
	 *
	 * @param        $atts
	 * @param string $content
	 *
	 * @return string
	 */
	public function tva_lesson_title( $atts, $content = '' ) {
		$lesson = '';

		if ( isset( $atts['lesson_id'] ) ) {
			$lesson_id = $atts['lesson_id'];
			$lesson    = get_post( $lesson_id );
		}

		if ( isset( $atts['lesson_url'] ) ) {
			$lesson_id = url_to_postid( $atts['lesson_url'] );
			$lesson    = get_post( $lesson_id );
		}

		if ( $lesson != null ) {
			$content = '<div class="tva-lesson-title">';

			$content .= '<a class="tva-shortcode-lesson-title" href="' . get_permalink( $lesson->ID ) . '" >';
			$content .= $lesson->post_title . '</a>';
			$content .= '<div>';
		}

		return $content;
	}

	/**
	 * @param        $atts
	 * @param string $content
	 *
	 * @return string
	 */
	public function tva_checkout_link( $atts, $content = '' ) {
		$checkout_url = tva_get_settings_manager()->factory( 'checkout_page' )->get_link();

		if ( ! isset( $atts['pp'] ) || empty( $checkout_url ) ) {
			return $content;
		}

		if ( ! isset( $atts['title'] ) ) {
			$atts['title'] = 'Buy Now';
		}

		$product_id = isset( $atts['product'] ) ? $atts['product'] : ( isset( $atts['pid'] ) ? $atts['pid'] : null );
		$bundle_id  = isset( $atts['bundle'] ) ? $atts['bundle'] : ( isset( $atts['bid'] ) ? $atts['bid'] : null );
		$query_url  = ! empty( $product_id ) ? '&pid=' . $product_id : '&bid=' . $bundle_id;
		$discount   = isset( $atts['thrv_so_discount'] ) ? '&thrv_so_discount=' . $atts['thrv_so_discount'] : '';
		$content    = '<a href="' . $checkout_url . '?pp=' . $atts['pp'] . $query_url . $discount . '">' . $atts['title'] . '</a>';

		return $content;
	}

	/**
	 * Purchased Product shortcode
	 *
	 * @return string
	 */
	public function tva_sendowl_product() {
		$data = array();
		if ( isset( $_COOKIE[ TVA_Const::TVA_SENDOWL_COOKIE_NAME ] ) ) {
			$cookie = stripslashes( $_COOKIE[ TVA_Const::TVA_SENDOWL_COOKIE_NAME ] );
			$data   = maybe_unserialize( $cookie );
		}

		if ( ! isset( $_REQUEST['pp'] ) && ! isset( $cookie ) ) {
			return '';
		}

		if ( ! isset( $_REQUEST['pid'] ) && ! isset( $_REQUEST['bid'] ) && ! isset( $cookie ) ) {
			return '';
		}

		if ( isset( $_REQUEST['pid'] ) ) {
			$data['type'] = 'pid';
			$data['id']   = (int) $_REQUEST['pid'];
		} elseif ( isset( $_REQUEST['bid'] ) ) {
			$data['type'] = 'bid';
			$data['id']   = (int) $_REQUEST['bid'];
		}

		if ( $data['type'] === 'pid' ) {
			$product = TVA_SendOwl::get_product_by_id( $data['id'] );
		} else {
			$product = TVA_SendOwl::get_bundle_by_id( $data['id'] );
		}

		return $product['name'];
	}
}
