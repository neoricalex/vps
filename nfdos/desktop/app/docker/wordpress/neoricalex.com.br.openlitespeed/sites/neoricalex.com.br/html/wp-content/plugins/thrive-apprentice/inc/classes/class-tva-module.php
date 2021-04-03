<?php
/**
 * Created by PhpStorm.
 * User: dan bilauca
 * Date: 29-May-19
 * Time: 01:55 PM
 */

/**
 * Class TVA_Module
 * - wrapper over WP_Post to handle Chapter Logic
 *
 * @property int        ID       post id
 * @property int        course_id
 * @property array      item_ids used for grouping into chapters
 * @property int|string order
 * @property int        post_parent
 */
class TVA_Module extends TVA_Post {

	/**
	 * @var array
	 */
	protected $_defaults
		= array(
			'post_type' => TVA_Const::MODULE_POST_TYPE,
		);

	public function get_siblings() {

		$siblings = array();
		$term     = TVA_Manager::get_post_term( $this->_post );

		/** @var WP_Post $item */
		foreach ( TVA_Manager::get_course_modules( $term ) as $key => $item ) {
			if ( $item->ID !== $this->_post->ID ) {
				$siblings[] = TVA_Post::factory( $item );
			}
		}

		return $siblings;
	}

	/**
	 * @return TVA_Post[]
	 */
	public function get_direct_children() {

		$tva_children = array();
		$children     = TVA_Manager::get_module_chapters( $this->_post );

		if ( true === empty( $children ) ) {
			$children = TVA_Manager::get_module_lessons( $this->_post );
		}

		foreach ( $children as $child ) {
			$tva_children[] = TVA_Post::factory( $child );
		}

		return $tva_children;
	}

	/**
	 * Returns all lessons from current module even they are in chapters
	 *
	 * @return array
	 */
	public function get_lessons() {
		$lessons = TVA_Manager::get_all_module_lessons( $this->_post );

		$lessons_objects = array();

		foreach ( $lessons as $lesson ) {
			$lesson_factory = TVA_Post::factory( $lesson );

			if ( ! is_editor_page_raw( true ) && ! $lesson_factory->is_published() ) {
				continue;
			}
			
			$lessons_objects[] = $lesson_factory;
		}

		return $lessons_objects;
	}

	/**
	 * Return true if the module is completed by the user
	 *
	 * A module is completed by the user if satisfy one of the following
	 *
	 * 1. If a module has chapters -> all the chapters must be completed by the user
	 * or
	 * 2. If a module has only lessons -> all the lessons must be completed by the user
	 *
	 * @param array $learned_lessons
	 *
	 * @return bool
	 */
	public function is_completed( $learned_lessons = array() ) {
		$is_completed = true;

		if ( ! is_array( $learned_lessons ) || empty( $learned_lessons ) ) {
			$learned_lessons = tva_get_learned_lessons();
		}

		$children = $this->get_direct_children();

		/**
		 * @var TVA_Chapter|TVA_Lesson
		 */
		foreach ( $children as $child ) {
			if ( $child->is_published() && ! $child->is_completed( $learned_lessons ) ) {
				$is_completed = false;
				break;
			}
		}

		return $is_completed;
	}

	/**
	 * Init list of lessons or chapters
	 *
	 * @return TVA_Post[]
	 */
	public function init_structure() {

		$module_lessons = TVA_Manager::get_module_lessons( $this->_post );

		/**
		 * Module has only lessons as his children
		 */
		if ( ! empty( $module_lessons ) ) {

			foreach ( $module_lessons as $post_lesson ) {
				$tva_lesson         = new TVA_Lesson( $post_lesson );
				$this->_structure[] = $tva_lesson;
			}

			return $this->_structure;
		}

		$module_chapters = TVA_Manager::get_module_chapters( $this->_post );

		/**
		 * Init chapters and their structure
		 */
		if ( ! empty( $module_chapters ) ) {
			foreach ( $module_chapters as $post_chapter ) {
				$chapter = new TVA_Chapter( $post_chapter );
				$chapter->init_structure();
				$this->_structure[] = $chapter;
			}
		}

		return $this->_structure;
	}

	/**
	 * Serialize specific module data rather than parent wp post
	 *
	 * @return array
	 */
	public function jsonSerialize() {

		return array_merge( parent::jsonSerialize(), array(
			'cover_image' => $this->_post->tva_cover_image,
		) );
	}

	/**
	 * Inherit from parent save with some meta
	 *
	 * @return true
	 * @throws Exception
	 */
	public function save() {

		parent::save();

		if ( isset( $this->_data['cover_image'] ) ) {
			update_post_meta( $this->_post->ID, 'tva_cover_image', $this->_data['cover_image'] );
		}

		return true;
	}
}
