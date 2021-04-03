<?php
/**
 * Created by PhpStorm.
 * User: dan bilauca
 * Date: 06-May-19
 * Time: 01:18 PM
 */

/**
 * Class TVA_Manager
 * - models manager
 */
class TVA_Manager {

	/**
	 * @return array of WP_Term(s)
	 */
	public static function get_courses() {

		$courses = array();

		$args = array(
			'taxonomy'   => TVA_Const::COURSE_TAXONOMY,
			'hide_empty' => false,
			'meta_key'   => 'tva_order',
			'orderby'    => 'meta_value',
			'order'      => 'DESC',
		);

		$terms = get_terms( $args );

		if ( false === is_wp_error( $terms ) ) {
			$courses = $terms;
		}

		return $courses;
	}

	/**
	 * Gets and returns lessons at course level
	 *
	 * @param WP_Term $course
	 * @param array   $filters which will be passed to WP_Query
	 *
	 * @return array of WP_Posts
	 */
	public static function get_course_lessons( $course, $filters = array() ) {

		$lessons = array();

		if ( true === $course instanceof WP_Term ) {

			$_defaults = array(
				'posts_per_page' => - 1,
				'post_status'    => array( 'publish', 'draft' ),
				'post_type'      => array( TVA_Const::LESSON_POST_TYPE ),
				'meta_key'       => 'tva_lesson_order',
				'post_parent'    => 0,
				'tax_query'      => array(
					array(
						'taxonomy' => TVA_Const::COURSE_TAXONOMY,
						'field'    => 'term_id',
						'terms'    => array( $course->term_id ),
						'operator' => 'IN',
					),
				),
				'orderby'        => 'meta_value_num', //because tva_order_item is int
				'order'          => 'ASC',
			);

			$args = wp_parse_args( $filters, $_defaults );

			$posts   = get_posts( $args );
			$lessons = $posts;
		}

		return $lessons;
	}

	/**
	 * Gets and return lessons at module level
	 *
	 * @param $module  WP_post
	 * @param $filters array
	 *
	 * @return array
	 */
	public static function get_module_lessons( $module, $filters = array() ) {

		$lessons = array();

		if ( true === $module instanceof WP_Post ) {
			$_defaults = array(
				'posts_per_page' => - 1,
				'post_status'    => array( 'publish', 'draft' ),
				'post_type'      => array( TVA_Const::LESSON_POST_TYPE ),
				'meta_key'       => 'tva_lesson_order',
				'post_parent'    => $module->ID,
				'orderby'        => 'meta_value_num',
				'order'          => 'ASC',
			);

			$args = wp_parse_args( $filters, $_defaults );

			$posts   = get_posts( $args );
			$lessons = $posts;
		}

		return $lessons;
	}

	/**
	 * Get all lessons of a module, even the module has chapters
	 *
	 * @param WP_Post $module
	 * @param array   $filters
	 *
	 * @return array
	 */
	public static function get_all_module_lessons( $module, $filters = array() ) {

		$lessons = array();

		if ( true === $module instanceof WP_Post ) {

			$lessons = self::get_module_lessons( $module, $filters );

			/**
			 * check in chapters
			 */
			if ( empty( $lessons ) ) {

				$chapters = self::get_module_chapters( $module );

				foreach ( $chapters as $chapter ) {

					$chapter_lessons = self::get_chapter_lessons( $chapter, $filters );
					$lessons         = array_merge( $lessons, $chapter_lessons );
				}
			}
		}

		return $lessons;
	}

	public static function get_module_chapters( $module ) {

		$chapters = array();

		if ( true === $module instanceof WP_Post ) {
			$args     = array(
				'posts_per_page' => - 1,
				'post_status'    => array( 'publish', 'draft' ),
				'post_type'      => array( TVA_Const::CHAPTER_POST_TYPE ),
				'meta_key'       => 'tva_chapter_order',
				'post_parent'    => $module->ID,
				'orderby'        => 'meta_value_num',
				'order'          => 'ASC',
			);
			$posts    = get_posts( $args );
			$chapters = $posts;
		}

		return $chapters;
	}

	/**
	 * Gets and return lessons at chapter level
	 *
	 * @param $chapter WP_Post
	 * @param $filters array
	 *
	 * @return array
	 */
	public static function get_chapter_lessons( $chapter, $filters = array() ) {

		$lessons = array();

		if ( true === $chapter instanceof WP_Post ) {
			$_defaults = array(
				'posts_per_page' => - 1,
				'post_status'    => array( 'publish', 'draft' ),
				'post_type'      => array( TVA_Const::LESSON_POST_TYPE ),
				'meta_key'       => 'tva_lesson_order',
				'post_parent'    => $chapter->ID,
				'orderby'        => 'meta_value_num',
				'order'          => 'ASC',
			);
			$args      = wp_parse_args( $filters, $_defaults );
			$posts     = get_posts( $args );
			$lessons   = $posts;
		}

		return $lessons;
	}

	/**
	 * All lessons for a Course
	 *
	 * @param $course  WP_Term
	 * @param $filters array
	 *
	 * @return array
	 */
	public static function get_all_lessons( $course, $filters = array() ) {

		$lessons = array();

		if ( true === $course instanceof WP_Term ) {

			/**
			 * get direct lessons
			 */
			$posts = self::get_course_lessons( $course, $filters );

			/**
			 * if there are no direct course lessons
			 */
			if ( empty( $posts ) ) { //check modules and chapters

				$modules = self::get_course_modules( $course );

				foreach ( $modules as $module ) {

					$module_chapters = self::get_module_chapters( $module );

					foreach ( $module_chapters as $module_chapter ) {
						$posts = array_merge( $posts, self::get_chapter_lessons( $module_chapter, $filters ) );
					}

					if ( empty( $module_chapters ) ) {
						$posts = array_merge( $posts, self::get_module_lessons( $module, $filters ) );
					}
				}

				if ( empty( $modules ) ) {

					$course_chapters = self::get_course_chapters( $course );

					foreach ( $course_chapters as $course_chapter ) {
						$posts = array_merge( $posts, self::get_chapter_lessons( $course_chapter, $filters ) );
					}
				}
			}

			foreach ( $posts as $post ) {
				$post->order = get_post_meta( $post->ID, 'tva_lesson_order', true );
			}

			$lessons = $posts;
		}

		return $lessons;
	}

	/**
	 * Gets and returns the modules of a course
	 *
	 * @param $course WP_Term
	 *
	 * @return array
	 */
	public static function get_course_modules( $course ) {

		$modules = array();

		if ( true === $course instanceof WP_Term ) {
			$args    = array(
				'posts_per_page' => - 1,
				'post_type'      => array( TVA_Const::MODULE_POST_TYPE ),
				'post_status'    => array( 'publish', 'draft' ),
				'meta_key'       => 'tva_module_order',
				'post_parent'    => 0,
				'tax_query'      => array(
					array(
						'taxonomy' => TVA_Const::COURSE_TAXONOMY,
						'field'    => 'term_id',
						'terms'    => array( $course->term_id ),
						'operator' => 'IN',
					),
				),
				'orderby'        => 'meta_value_num',
				'order'          => 'ASC',
			);
			$modules = get_posts( $args );
		}

		return $modules;
	}

	/**
	 * Gets chapters at course level
	 *
	 * @param WP_Term $course
	 *
	 * @return array
	 */
	public static function get_course_chapters( $course ) {

		$chapters = array();

		if ( true === $course instanceof WP_Term ) {
			$args = array(
				'posts_per_page' => - 1,
				'post_type'      => array( TVA_Const::CHAPTER_POST_TYPE ),
				'post_status'    => array( 'publish', 'draft' ),
				'meta_key'       => 'tva_chapter_order',
				'post_parent'    => 0,
				'tax_query'      => array(
					array(
						'taxonomy' => TVA_Const::COURSE_TAXONOMY,
						'field'    => 'term_id',
						'terms'    => array( $course->term_id ),
						'operator' => 'IN',
					),
				),
				'orderby'        => 'meta_value_num',
				'order'          => 'ASC',
			);

			$chapters = get_posts( $args );
		}

		return $chapters;
	}

	/**
	 * @param WP_Post $post
	 *
	 * @return array
	 */
	public static function get_children( $post ) {

		$children           = array();
		$allowed_post_types = array(
			TVA_Const::CHAPTER_POST_TYPE,
			TVA_Const::MODULE_POST_TYPE,
		);

		if ( true === $post instanceof WP_Post && true === in_array( $post->post_type, $allowed_post_types ) ) {

			switch ( $post->post_type ) {

				case TVA_Const::CHAPTER_POST_TYPE:
					$children = self::get_chapter_lessons( $post );
					break;

				case TVA_Const::MODULE_POST_TYPE:
					$children = self::get_module_chapters( $post );

					if ( empty( $children ) ) {
						$children = self::get_module_lessons( $post );
					}
					break;
			}
		}

		return $children;
	}

	/**
	 * Review status for a post
	 * - based on published children
	 * - updates status for its parent
	 *
	 * @param int|WP_Post $post
	 */
	public static function review_status( $post ) {

		if ( is_numeric( $post ) ) {
			$post = get_post( $post );
		}

		if ( false === $post instanceof WP_Post ) {
			return;
		}

		$_has_children = self::has_published_children( $post );

		$new_status = $_has_children ? 'publish' : 'draft';

		wp_update_post(
			array(
				'ID'          => $post->ID,
				'post_status' => $new_status,
			)
		);

		if ( $post->post_parent ) {
			self::review_status( get_post( $post->post_parent ) );
		}
	}

	public static function has_published_children( $post ) {

		$_has = false;

		$children = self::get_children( $post );

		foreach ( $children as $child ) {
			if ( $child->post_status === 'publish' ) {
				$_has = true;
				break;
			}
		}

		return $_has;
	}

	/**
	 * Based on $parent review its children order
	 *
	 * @param int|WP_Post $parent
	 */
	public static function review_children_order( $parent ) {

		if ( false === $parent instanceof WP_Post ) {
			$parent = get_post( (int) $parent );
		}

		if ( false === $parent instanceof WP_Post ) {
			return;
		}

		$post_order = $parent->{$parent->post_type . '_order'};

		$children = TVA_Manager::get_children( $parent );

		/**
		 * @var int      $index
		 * @var  WP_Post $child
		 */
		foreach ( $children as $index => $child ) {

			$child_order_meta = $child->post_type . '_order';

			$new_order = $post_order . $index;

			update_post_meta( $child->ID, $child_order_meta, $new_order );

			self::review_children_order( $child );
		}
	}

	/**
	 * Based on post returns post's wp_term instance
	 *
	 * @param WP_Post $post
	 *
	 * @return WP_Term|null
	 */
	public static function get_post_term( $post ) {

		$term = null;

		if ( true === $post instanceof WP_Post ) {
			$terms = wp_get_post_terms( $post->ID, TVA_Const::COURSE_TAXONOMY );

			$term = ! empty( $terms ) ? $terms[0] : null;
		}

		return $term;
	}

	/**
	 * Fetches all the course's posts and returns it's IDs as array
	 *
	 * @param int $course_id
	 *
	 * @return array
	 */
	public static function get_course_item_ids( $course_id ) {

		$course_id = (int) $course_id;

		if ( ! $course_id ) {
			return array();
		}

		$args = array(
			'posts_per_page' => - 1,
			'post_type'      => array( TVA_Const::LESSON_POST_TYPE, TVA_Const::CHAPTER_POST_TYPE, TVA_Const::MODULE_POST_TYPE ),
			'post_status'    => array( 'publish', 'draft' ),
			'tax_query'      => array(
				array(
					'taxonomy' => TVA_Const::COURSE_TAXONOMY,
					'field'    => 'term_id',
					'terms'    => array( $course_id ),
					'operator' => 'IN',
				),
			),
			'order'          => 'ASC',
		);

		/** @var WP_Post[] $posts */
		$posts = get_posts( $args );
		$ids   = array();

		if ( $posts ) {
			foreach ( $posts as $post ) {
				$ids[] = $post->ID;
			}
		}

		return $ids;
	}

	/**
	 * Loops through the whole lists of lessons and exclude a specific amount of ids from the beginning
	 * Lessons parents are also excluded(pushed) into excluded ids
	 *
	 * @param int $course_id
	 *
	 * @return array with Post IDs which are excluded: contains TVA_Module, TVA_Chapter, TVA_Lessons
	 */
	public static function get_excluded_course_ids( $course_id ) {

		$course_id = (int) $course_id;

		$course   = get_term( $course_id );
		$excluded = (int) get_term_meta( $course_id, 'tva_excluded', true );

		if ( ! $excluded || false === $course instanceof WP_Term ) {
			return array();
		}

		$lessons = self::get_all_lessons( $course );
		$ids     = array();

		/**
		 * loop only for exclusions
		 */
		for ( $i = 0; $i < $excluded; $i ++ ) {

			if ( ! isset( $lessons[ $i ] ) || false === $lessons[ $i ] instanceof WP_Post ) {
				break;
			}

			$lesson = TVA_Post::factory( $lessons[ $i ] );

			/**
			 * Parent can be Nothing / Module / Chapter
			 */
			$parent = $lesson->get_parent();
			if ( $parent->ID ) {
				//exclude module/chapter
				$ids[] = $parent->ID;
			}

			/**
			 * If Parent is Chapter we should get the Module's ID so that it can be set to MM access table
			 * Module Page can be accessed in frontend by visitors
			 */
			$module = $parent && $parent instanceof TVA_Chapter ? $parent->get_parent() : null;
			if ( $module ) {
				//exclude module
				$ids[] = $module->ID;
			}

			/**
			 * Push lesson to excluded IDs
			 */
			$ids[] = $lessons[ $i ]->ID;
		}

		return $ids;
	}

	/**
	 * Get all modules, chapters, lessons for a course as a flat array
	 *
	 * @param WP_Term $course
	 * @param WP_Post $post_parent optional, if set it will only get child items for that $post
	 *
	 * @return WP_Post[]
	 */
	public static function get_all_content( $course, $post_parent = null ) {
		$items = array();

		if ( true === $course instanceof WP_Term ) {
			$args = array(
				'posts_per_page' => - 1,
				'post_type'      => array( TVA_Const::MODULE_POST_TYPE, TVA_Const::CHAPTER_POST_TYPE, TVA_Const::LESSON_POST_TYPE ),
				'post_status'    => array( 'publish', 'draft' ),
				'tax_query'      => array(
					array(
						'taxonomy' => TVA_Const::COURSE_TAXONOMY,
						'field'    => 'term_id',
						'terms'    => array( $course->term_id ),
						'operator' => 'IN',
					),
				),
			);
			if ( ! empty( $post_parent ) ) {
				$args['post_parent'] = $post_parent->ID;
			}
			$items = get_posts( $args );
		}

		return $items;
	}
}
