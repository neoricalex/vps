<?php
/**
 * Created by PhpStorm.
 * User: dan bilauca
 * Date: 29-May-19
 * Time: 01:55 PM
 */

/**
 * Class TVA_Chapter
 */
class TVA_Chapter extends TVA_Post {

	/**
	 * @var array
	 */
	protected $_defaults
		= array(
			'post_type' => TVA_Const::CHAPTER_POST_TYPE,
		);

	public function get_siblings() {

		if ( $this->post_parent ) {
			//get module children
			$posts = TVA_Manager::get_module_chapters( get_post( $this->post_parent ) );
		} else {
			//get course chapters
			$term  = TVA_Manager::get_post_term( $this->_post );
			$posts = TVA_Manager::get_course_chapters( $term );
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

	public function get_direct_children() {

		$tva_lessons = array();

		/** @var WP_Post $item */
		foreach ( TVA_Manager::get_chapter_lessons( $this->_post ) as $item ) {
			$tva_lessons[] = TVA_Post::factory( $item );
		}

		return $tva_lessons;
	}

	/**
	 * Returns all lessons from a chapter
	 *
	 * @return TVA_Lesson[]
	 */
	public function get_lessons() {
		$tva_lessons = array();

		/** @var WP_Post $item */
		foreach ( TVA_Manager::get_chapter_lessons( $this->_post ) as $item ) {
			$lesson_factory = TVA_Post::factory( $item );

			if ( ! is_editor_page_raw( true ) && ! $lesson_factory->is_published() ) {
				continue;
			}

			$tva_lessons[] = $lesson_factory;
		}

		return $tva_lessons;
	}

	/**
	 * Returns true if the chapter is completed by the user
	 *
	 * The chapter is considered completed if all the lessons have been completed by the user
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

		/**
		 * @var TVA_Lesson $item
		 */
		foreach ( $this->get_direct_children() as $item ) {
			if ( $item->is_published() && ! $item->is_completed( $learned_lessons ) ) {
				$is_completed = false;
				break;
			}
		}

		return $is_completed;
	}

	/**
	 * Init list of lessons
	 *
	 * @return TVA_Post[]
	 */
	public function init_structure() {

		foreach ( TVA_Manager::get_chapter_lessons( $this->_post ) as $post_lesson ) {
			$this->_structure[] = new TVA_Lesson( $post_lesson );
		}

		return $this->_structure;
	}
}
