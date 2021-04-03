<?php
/**
 * Created by PhpStorm.
 * User: dan bilauca
 * Date: 07-May-19
 * Time: 01:29 PM
 */

/**
 * Class TVA_Lesson
 *
 * @property string cover_image
 */
class TVA_Lesson extends TVA_Post {

	/**
	 * Type of Lesson
	 *
	 * @var string
	 */
	protected $_type = '';

	/**
	 * @var string
	 */
	protected $_tcb_content = '';

	/**
	 * @var array
	 */
	protected $_defaults
		= array(
			'post_type' => TVA_Const::LESSON_POST_TYPE,
		);

	/**
	 * Meta names, without prefix, supported by a lesson model
	 *
	 * @var string[]
	 */
	private $_meta_names
		= array(
			'lesson_type',
			'post_media',
			'cover_image',
			'video',
			'audio',
		);

	/**
	 * Types of lessons
	 *
	 * @var string[]
	 */
	public static $types = array(
		'text',
		'audio',
		'video',
	);

	/**
	 * @var int $_number in whole list of lessons
	 */
	private $_number;

	public function get_number() {

		if ( empty( $this->_number ) || false === is_int( $this->_number ) ) {

			$lessons = tva_access_manager()->get_course()->get_lessons();

			foreach ( $lessons as $key => $lesson ) {
				if ( $lesson->ID === $this->ID ) {
					$this->_number = $key + 1;
					break;
				}
			}
		}

		return $this->_number;
	}

	/**
	 * Gets the previous post from curse lessons list based on current number
	 *
	 * @return WP_Post|null
	 */
	public function get_previous_lesson() {

		$prev_lesson = null;
		$key         = $this->get_number();

		$key -= 2;

		if ( $this->get_number() > 1 ) {
			$lessons     = tva_access_manager()->get_course()->get_lessons();
			$prev_lesson = isset( $lessons[ $key ] ) ? $lessons[ $key ] : null;
		}

		return $prev_lesson;
	}

	/**
	 * @return WP_Post|null
	 */
	public function get_next_lesson() {

		$key         = $this->get_number();
		$lessons     = tva_access_manager()->get_course()->get_lessons();
		$next_lesson = isset( $lessons[ $key ] ) ? $lessons[ $key ] : null;

		return $next_lesson;
	}

	public function __get( $key ) {

		if ( in_array( $key, $this->_meta_names ) ) {
			return $this->_post->{'tva_' . $key};
		}

		return parent::__get( $key );
	}

	public function get_siblings() {

		if ( $this->post_parent ) {
			//get module or chapter children
			$posts = TVA_Manager::get_children( get_post( $this->post_parent ) );
		} else {
			//get course chapters
			$term  = TVA_Manager::get_post_term( $this->_post );
			$posts = TVA_Manager::get_course_lessons( $term );
		}

		$siblings = array();

		/** @var WP_Post $item */
		foreach ( $posts as $key => $item ) {
			if ( $item->ID !== $this->_post->ID ) {
				$siblings[] = TVA_Post::factory( $item );
			}
		}

		return $siblings;
	}

	/**
	 * Returns the Lesson Course Object
	 *
	 * @return TVA_Course
	 */
	public function get_course() {
		$terms = wp_get_post_terms( $this->ID, TVA_Const::COURSE_TAXONOMY );

		return new TVA_Course( $terms[0] );
	}

	/**
	 * Returns the lesson details
	 *
	 * @return array
	 */
	public function get_details() {

		$course = $this->get_course();

		return array(
			'lesson_id'        => $this->ID,
			'lesson_url'       => get_permalink( $this->ID ),
			'lesson_title'     => $this->post_title,
			'lesson_type'      => $this->lesson_type,
			'lesson_image_url' => $this->cover_image,
			'module_id'        => $this->post_parent ? $this->post_parent : '',
			'module_title'     => $this->post_parent ? get_the_title( $this->post_parent ) : '',
			'course_id'        => $course->get_id(),
			'course_title'     => $course->name,
		);
	}

	/**
	 * Returns the lesson module details
	 *
	 * @return array
	 */
	public function get_module_details() {
		$module_data = array();

		if ( $this->post_parent ) {
			$course         = $this->get_course();
			$lesson_modules = $course->get_modules();
			$key            = array_search( $this->post_parent, array_column( $lesson_modules, 'ID' ) );
			$lesson_module  = $lesson_modules[ $key ];

			$module_data = array(
				'module_id'          => $lesson_module->ID,
				'module_title'       => $lesson_module->post_title,
				'module_description' => $lesson_module->post_excerpt,
				'module_image_url'   => (string) get_post_meta( $lesson_module->ID, 'tva_cover_image', true ),
				'module_url'         => get_permalink( $lesson_module->ID ),
				'course_id'          => $course->get_id(),
				'course_title'       => $course->name,
			);
		}

		return $module_data;
	}

	/**
	 * Which type of lesson: text/video/etc
	 *
	 * @return string
	 */
	public function get_type() {

		if ( empty( $this->_type ) ) {
			$this->_type = get_post_meta( $this->_post->ID, 'tva_lesson_type', true );
		}

		return $this->_type;
	}

	/**
	 * Based on lesson type return a specific media
	 *
	 * @return TVA_Audio|TVA_Video|null
	 */
	public function get_media() {

		$type = $this->get_type();

		if ( $type === 'text' ) {
			return null;
		}

		return $this->{"get_" . $type}();
	}

	/**
	 * @return string
	 */
	public function get_tcb_content() {

		if ( empty( $this->_tcb_content ) ) {
			$this->_tcb_content = get_post_meta( $this->_post->ID, 'tve_updated_post', true );
		}

		return $this->_tcb_content;
	}

	/**
	 * Extends the parent save with
	 * - saving post meta
	 *
	 * @return true
	 * @throws Exception
	 */
	public function save() {

		parent::save();

		foreach ( $this->_meta_names as $meta_name ) {
			if ( isset( $this->_data[ $meta_name ] ) ) {
				update_post_meta( $this->ID, 'tva_' . $meta_name, $this->_data[ $meta_name ] );
			}
		}

		return true;
	}

	/**
	 * Reads video meta
	 *
	 * @return TVA_Video
	 */
	public function get_video() {

		$_defaults = array(
			'options' => array(),
			'type'    => 'youtube',
			'source'  => '',
		);

		$video = $this->_post->tva_video;


		if ( empty( $video ) ) {
			$video = array_merge( $_defaults, $this->_get_media() );
		}

		return new TVA_Video( $video );
	}

	/**
	 * Gets media meta for current lesson
	 * - should be empty for new items
	 *
	 * @return array
	 * @since 3.0
	 */
	private function _get_media() {

		$meta = $this->_post->tva_post_media;

		$media = array();

		if ( ! empty( $meta['media_extra_options'] ) ) {
			$media['options'] = $meta['media_extra_options'];
		}

		if ( ! empty( $meta['media_type'] ) ) {
			$media['type'] = $meta['media_type'];
		}

		if ( ! empty( $meta['media_url'] ) ) {
			$media['source'] = $meta['media_url'];
		}

		return $media;
	}

	/**
	 * Gets audio meta for current lesson
	 *
	 * @return TVA_Audio
	 */
	public function get_audio() {

		$_defaults = array(
			'options' => array(),
			'type'    => 'soundcloud',
			'source'  => '',
		);

		$audio = $this->_post->tva_audio;

		if ( empty( $audio ) ) {
			$audio = array_merge( $_defaults, $this->_get_media() );
		}

		return new TVA_Audio( $audio );
	}

	/**
	 * Serialize specific lesson data
	 * - rather than parent wp post
	 *
	 * @return array
	 */
	public function jsonSerialize() {
		return array_merge( parent::jsonSerialize(), array(
			'lesson_type'     => $this->get_type(),
			'has_tcb_content' => ! ! $this->get_tcb_content(),
			'video'           => $this->get_video(),
			'audio'           => $this->get_audio(),
			'cover_image'     => $this->cover_image,
		) );
	}

	/**
	 * Returns true if the lesson is completed by the user
	 *
	 * @param array $learned_lessons
	 *
	 * @return bool
	 */
	public function is_completed( $learned_lessons = array() ) {
		if ( is_user_logged_in() && TVA_Product::has_access() ) {
			/**
			 * This will be valid if the admin will view the lesson
			 */
			return false;
		}

		if ( ! is_array( $learned_lessons ) || empty( $learned_lessons ) ) {
			$learned_lessons = tva_get_learned_lessons();
		}

		if ( empty( $learned_lessons ) ) {
			return false;
		}

		$course_id = $this->get_course_v2()->get_id();

		$course_learned_lessons = isset( $learned_lessons[ $course_id ] ) ? $learned_lessons[ $course_id ] : null;

		if ( isset( $course_learned_lessons ) && is_array( $course_learned_lessons ) && in_array( $this->ID, array_keys( $course_learned_lessons ) ) ) {
			return true;
		}

		return false;
	}
}
