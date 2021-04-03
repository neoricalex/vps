<?php

/**
 * Class TVA_Course_V2
 * - wrapper over WP_Term
 * - assigns properties to instance read from wp term meta
 * - can init course's structure: module/chapter/lessons
 *
 * @property string     $name
 * @property string     $description
 * @property int        $term_id
 * @property string     $status
 * @property int        $topic
 * @property int        $label
 * @property int        $level
 * @property TVA_Author $author
 * @property string     $slug
 * @property string     $comment_status
 * @property bool       $has_video
 * @property array      $video
 * @property string     $cover_image
 * @property string     $message
 * @property bool       $is_private
 * @property int        $excluded
 * @property int        $published_lessons_count
 */
class TVA_Course_V2 extends TVA_Course implements JsonSerializable {

	/**
	 * Conversions for all courses
	 *
	 * @var array
	 */
	protected static $conversions;

	/**
	 * All users who enrolled to any course
	 *
	 * @var array
	 */
	protected static $enrolled_users;

	/**
	 * Allowed values for comment status
	 *
	 * @var string[]
	 */
	private $_allowed_comment_status = array(
		'open',
		'closed',
	);

	/**
	 * @var WP_Term
	 */
	protected $_wp_term;

	/**
	 * @var array
	 */
	protected $_data = array();

	/**
	 * default properties for a TA Course
	 *
	 * @var array
	 */
	protected $_defaults = array(
		'id'          => null,
		'name'        => null,
		'description' => null,
		'status'      => 'draft',
		'order'       => 0,
		'excluded'    => 0,
		'message'     => '',
	);

	/**
	 * List of Lessons/Chapters/Module
	 *
	 * @var TVA_Post[]
	 */
	protected $_structure = array();

	/**
	 * @var TVA_Topic
	 */
	protected $_topic;

	/**
	 * @var TVA_Level
	 */
	protected $_difficulty;

	/**
	 * TVA_Course_V2 constructor.
	 *
	 * @param int|array|WP_Term $data
	 */
	public function __construct( $data ) {

		if ( is_int( $data ) ) {
			$this->_init_from_db( (int) $data );
		} elseif ( true === $data instanceof WP_Term ) {
			$this->_wp_term = $data;
		} else {
			$this->_data = array_merge( $this->_defaults, (array) $data );
		}
	}

	/**
	 * Set value at key in local $_data
	 *
	 * @param string $key
	 * @param mixed  $value
	 */
	public function __set( $key, $value ) {

		$this->_data[ $key ] = $value;
	}

	public function __isset( $key ) {

		return isset( $this->_data[ $key ] ) || ( true === $this->_wp_term instanceof WP_Term && $this->_wp_term->$key );
	}

	/**
	 * Gets $key from _data or _wp_term
	 *
	 * @param string $key
	 *
	 * @return mixed
	 */
	public function __get( $key ) {

		$value = null;

		if ( isset( $this->_data[ $key ] ) ) {
			$value = $this->_data[ $key ];
		} elseif ( $this->_wp_term instanceof WP_Term && isset( $this->_wp_term->$key ) ) {
			$value = $this->_wp_term->$key;
		} elseif ( method_exists( $this, 'get_' . $key ) ) {
			$method_name = 'get_' . $key;
			$value       = $this->$method_name();
		}

		return $value;
	}

	/**
	 * Read wp_term from DB and init instance's prop
	 *
	 * @param int $id
	 */
	protected function _init_from_db( $id ) {

		$id = (int) $id;

		$this->_wp_term = get_term( $id );
	}

	/**
	 * Insert new wp_term into db
	 *
	 * @return int|WP_Error
	 */
	protected function _insert() {

		$data = array(
			'name'        => $this->name,
			'description' => $this->description,
		);

		$result = wp_insert_term( $this->name, TVA_Const::COURSE_TAXONOMY, $data );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$id = $result['term_id'];

		$this->_init_from_db( $id );

		update_term_meta( $this->term_id, 'tva_status', $this->_data['status'] );
		update_term_meta( $this->term_id, 'tva_order', (int) $this->_data['order'] );
		update_term_meta( $this->term_id, 'tva_description', trim( $this->description ) );
		update_term_meta( $this->term_id, 'tva_video_status', (bool) $this->has_video );
		update_term_meta( $this->term_id, 'tva_term_media', $this->video );
		update_term_meta( $this->term_id, 'tva_message', $this->_data['message'] );
		update_term_meta( $this->term_id, TVA_Topic::COURSE_TERM_NAME, $this->topic );
		update_term_meta( $this->term_id, 'tva_excluded', $this->_data['excluded'] );
		update_term_meta( $this->term_id, TVA_Level::COURSE_TERM_NAME, $this->level );

		return $id;
	}

	/**
	 * Saves data for an existing course
	 *
	 * @return bool
	 */
	public function _update() {

		update_term_meta( $this->term_id, TVA_Topic::COURSE_TERM_NAME, $this->topic );
		update_term_meta( $this->term_id, 'tva_label', $this->label );
		update_term_meta( $this->term_id, TVA_Level::COURSE_TERM_NAME, $this->level );
		update_term_meta( $this->term_id, 'tva_description', trim( $this->description ) );
		update_term_meta( $this->term_id, 'tva_comment_status', trim( $this->comment_status ) );
		update_term_meta( $this->term_id, 'tva_video_status', (bool) $this->has_video );
		update_term_meta( $this->term_id, 'tva_term_media', $this->video );
		update_term_meta( $this->term_id, 'tva_cover_image', $this->cover_image );
		update_term_meta( $this->term_id, 'tva_logged_in', ! empty( $this->_data['is_private'] ) );
		update_term_meta( $this->term_id, 'tva_excluded', $this->_data['excluded'] );
		update_term_meta( $this->term_id, 'tva_message', $this->_data['message'] );
		update_term_meta( $this->term_id, 'tva_status', $this->_data['status'] );

		if ( ! empty( $this->_data['author'] ) && $this->_data['author'] instanceof TVA_Author ) {
			update_term_meta( $this->term_id, TVA_Author::COURSE_TERM_NAME, $this->_data['author']->jsonSerialize() );
		}

		$saved = wp_update_term( $this->term_id, TVA_Const::COURSE_TAXONOMY, $this->_data );

		return ! is_wp_error( $saved );
	}

	/**
	 * Inserts or updates a WP_Term
	 *
	 * @return bool|int|WP_Error
	 */
	public function save() {

		if ( $this->get_id() ) {
			return $this->_update();
		}

		return $this->_insert();
	}

	/**
	 * Returns WP_Term id
	 *
	 * @return int
	 */
	public function get_id() {

		return (int) $this->term_id;
	}

	/**
	 * Assign a lesson to a course
	 *
	 * @param TVA_Lesson $lesson
	 *
	 * @return bool
	 */
	public function assign_lesson( TVA_Lesson $lesson ) {

		return $this->assign_post( $lesson->get_the_post() );
	}

	/**
	 * Assign a post to this Course Term
	 *
	 * @param WP_Post $post
	 *
	 * @return bool
	 */
	public function assign_post( WP_Post $post ) {

		$assigned = wp_set_object_terms( $post->ID, $this->get_id(), TVA_Const::COURSE_TAXONOMY );

		return ! is_wp_error( $assigned );
	}

	/**
	 * Returns all the courses used for TAR Integration
	 *
	 * @return array
	 */
	public static function get_items_for_architect_integration() {
		$courses = self::get_items();

		$return = array();

		/**
		 * @var $course TVA_Course_V2
		 */
		foreach ( $courses as $course ) {
			$return[ $course->id ] = array(
				'id'             => $course->get_id(),
				'admin_edit_url' => $course->get_edit_link(),
				'name'           => $course->name,
				'status'         => $course->get_status(), //Needed for the "Not Published Warning" -> Course Element
			);
		}

		return $return;
	}

	/**
	 * Get courses/wp_terms from db
	 *
	 * @param array $args
	 * @param bool  $count
	 *
	 * @return TVA_Course_V2[]|int
	 */
	public static function get_items( $args = array(), $count = false ) {

		$arguments = array(
			'taxonomy'   => TVA_Const::COURSE_TAXONOMY,
			'hide_empty' => false,
			'meta_query' => array(
				'relation'         => 'AND',
				'tva_order_clause' => array(
					'key' => 'tva_order',
				),
			),
			'orderby'    => 'meta_value',
			'order'      => 'DESC', // backwards compat ordering
		);

		/**
		 * exclude private items which are the demo courses
		 */
		$arguments['meta_query']['tva_status'] = array(
			'key'     => 'tva_status',
			'value'   => 'private',
			'compare' => '!=',
		);

		/**
		 * Filter by status
		 */
		if ( ! empty( $args['status'] ) ) {
			$arguments['meta_query']['tva_status'] = array(
				'key'     => 'tva_status',
				'value'   => $args['status'],
				'compare' => '=',
			);
		}

		if ( ! empty( $args['rule'] ) ) {
			$arguments['meta_query']['tva_rules'] = array(
				'key'     => 'tva_rules',
				'value'   => $args['rule'],
				'compare' => 'LIKE',
			);
		}

		/**
		 * Exclusions
		 */
		if ( ! empty( $args['exclude'] ) && is_array( $args['exclude'] ) ) {
			$arguments['exclude'] = $args['exclude'];
		}

		if ( isset( $args['filter']['topic'] ) && '' !== $args['filter']['topic'] && - 1 !== (int) $args['filter']['topic'] ) {
			$arguments['meta_query']['tva_topic'] = array(
				'key'   => 'tva_topic',
				'value' => $args['filter']['topic'],
			);
		}

		/**
		 * Inclusions
		 *
		 * If an array of IDs is provided it will return the terms with the corresponding IDs
		 */
		if ( ! empty( $args['include'] ) && is_array( $args['include'] ) ) {
			$arguments['include'] = $args['include'];
		}

		if ( false === $count ) {
			$limit               = ! empty( $args['limit'] ) ? (int) $args['limit'] : 0;
			$arguments['offset'] = ! empty( $args['offset'] ) ? (int) $args['offset'] : 0;
			$arguments['number'] = $limit;
		}

		$terms = get_terms( $arguments );

		if ( true === $count ) {
			return count( $terms );
		}

		$data = array();

		/** @var WP_Term $term */
		foreach ( $terms as $term ) {

			$course = new TVA_Course_V2(
				array(
					'wp_term'     => $term,
					'term_id'     => $term->term_id,
					'name'        => $term->name,
					'description' => $term->description,
				)
			);
			$course->set_wp_term( $term );

			$data[] = $course;
		}

		return $data;
	}

	/**
	 * Gets wp term meta
	 *
	 * @return array
	 */
	public function get_rules() {

		return get_term_meta( $this->get_id(), 'tva_rules', true );
	}

	/**
	 * Loops through a set of rules and check if there is one of $rule_slug
	 *
	 * @param string $rule_slug
	 *
	 * @return bool
	 */
	public function has_rule( $rule_slug ) {

		$has_rule = false;
		$rules    = $this->get_rules();

		if ( ! empty( $rules ) && is_array( $rules ) ) {
			foreach ( $rules as $rule ) {
				if ( ! $has_rule && ! empty( $rule['integration'] ) && $rule['integration'] === $rule_slug ) {
					$has_rule = true;
				}
			}
		}

		return $has_rule;
	}

	/**
	 * Gets term meta value
	 *
	 * @param string $meta
	 *
	 * @return mixed
	 */
	public function get_meta( $meta ) {

		return get_term_meta( $this->get_id(), $meta, true );
	}

	/**
	 * Gets status value from term meta
	 *
	 * @return string
	 */
	public function get_status() {

		return $this->get_meta( 'tva_status' );
	}

	/**
	 * Return true if the course is published
	 *
	 * @return bool
	 */
	public function is_published() {
		return $this->get_meta( 'tva_status' ) === 'publish';
	}

	/**
	 * Gets course topic id from term meta
	 *
	 * @return int
	 */
	public function get_topic_id() {

		return (int) $this->get_meta( TVA_Topic::COURSE_TERM_NAME );
	}

	/**
	 * Based on current topic id gets a topic instance
	 *
	 * @return TVA_Topic
	 */
	public function get_topic() {

		if ( $this->_topic instanceof TVA_Topic ) {
			return $this->_topic;
		}

		$current_topic_id = $this->get_topic_id();
		$topics           = TVA_Topic::get_items();

		foreach ( $topics as $item ) {
			if ( $item->id === $current_topic_id ) {
				$this->_topic = $item;

				return $this->_topic;
			}
		}

		return current( $topics );
	}

	/**
	 * Based on current difficulty id gets a difficulty instance
	 * - first level difficulty is return by default
	 *
	 * @return TVA_Level
	 */
	public function get_difficulty() {
		if ( $this->_difficulty instanceof TVA_Level ) {
			return $this->_difficulty;
		}

		$current_level_id = $this->get_level_id();
		$levels           = TVA_Level::get_items();

		foreach ( $levels as $item ) {
			if ( $item->id === $current_level_id ) {
				$this->_difficulty = $item;

				return $this->_difficulty;
			}
		}

		return current( $levels );
	}

	/**
	 * Gets course label id from term meta
	 *
	 * @return int
	 */
	public function get_label_id() {

		return (int) $this->get_meta( 'tva_label' );
	}

	/**
	 * Gets course level of difficulty
	 *
	 * @return int
	 */
	public function get_level_id() {

		return (int) $this->get_meta( TVA_Level::COURSE_TERM_NAME );
	}

	/**
	 * Gets author instance which has been set for current course
	 *
	 * @return TVA_Author
	 */
	public function get_author() {

		return new TVA_Author( null, $this->get_id() );
	}

	/**
	 * Checks if the current course has a specific status
	 *
	 * @param string $status
	 *
	 * @return bool
	 */
	public function has_status( $status ) {

		return $this->get_status() === $status;
	}

	/**
	 * Gets access type visitors have to course
	 *
	 * @return int
	 * @example 1 it's a private course
	 * @example 0 all visitors have access to the course
	 */
	public function get_access() {

		return (int) $this->get_meta( 'tva_logged_in' );
	}

	/**
	 * Gets conversions for all courses
	 *
	 * @return array
	 */
	public static function get_conversions() {

		if ( null === self::$conversions ) {
			self::$conversions = get_option( 'tva_conversions', array() );
		}

		return self::$conversions;
	}

	/**
	 * Gets conversions count for current course
	 *
	 * @return int
	 */
	public function count_conversions() {

		$count       = 0;
		$conversions = self::get_conversions();

		if ( ! empty( $conversions[ $this->get_id() ] ) ) {
			$count = (int) $conversions[ $this->get_id() ];
		}

		return $count;
	}

	/**
	 * Gets all enrolled users for all courses
	 *
	 * @return array
	 */
	public static function get_enrolled_users() {

		if ( null === self::$enrolled_users ) {
			self::$enrolled_users = get_option( 'tva_enrolled_users', array() );
		}

		return self::$enrolled_users;
	}

	/**
	 * Counts all enrolled users for current course
	 *
	 * @return int
	 */
	public function count_enrolled_users() {

		$count          = 0;
		$enrolled_users = $this->get_enrolled_users();

		if ( ! empty( $enrolled_users[ $this->get_id() ] ) ) {
			$count = count( $enrolled_users[ $this->get_id() ] );
		}

		return $count + $this->count_conversions();
	}

	/**
	 * Checks if current course is private for visitors
	 *
	 * @return bool
	 */
	public function is_private() {

		return $this->get_access() === 1;
	}

	/**
	 * @return null|array of data needed for admin course card
	 */
	public function jsonSerialize() {

		return $this->to_array();
	}

	/**
	 * Init list of modules/chapter/lessons
	 *
	 * @return TVA_Post[]
	 */
	public function init_structure() {

		/**
		 * Init lessons at level courses
		 */
		$course_level_lessons = TVA_Manager::get_course_lessons( $this->get_wp_term() );
		if ( ! empty( $course_level_lessons ) ) {
			foreach ( $course_level_lessons as $post_lesson ) {
				$this->_structure[] = new TVA_Lesson( $post_lesson );
			}

			return $this->_structure;
		}

		/**
		 * Init chapters at level courses
		 */
		$course_level_chapters = TVA_Manager::get_course_chapters( $this->get_wp_term() );
		if ( ! empty( $course_level_chapters ) ) {
			foreach ( $course_level_chapters as $post_chapter ) {
				$chapter = new TVA_Chapter( $post_chapter );
				$chapter->init_structure();
				$this->_structure[] = $chapter;
			}

			return $this->_structure;
		}

		/**
		 * Init modules at level courses
		 */
		$course_level_modules = TVA_Manager::get_course_modules( $this->get_wp_term() );
		if ( ! empty( $course_level_modules ) ) {
			foreach ( $course_level_modules as $post_module ) {
				$module = new TVA_Module( $post_module );
				$module->init_structure();
				$this->_structure[] = $module;
			}
		}

		return $this->_structure;
	}

	/**
	 * List os course items
	 *
	 * @return TVA_Post[]
	 */
	public function get_structure() {

		return $this->_structure;
	}

	/**
	 * @return WP_Term|null
	 */
	public function get_wp_term() {
		return $this->_wp_term;
	}

	/**
	 * @param WP_Term $term
	 *
	 * @return $this
	 */
	public function set_wp_term( $term ) {
		$this->_wp_term = $term;

		return $this;
	}

	/**
	 * Gets course description
	 *
	 * @return string
	 */
	public function get_description() {

		return $this->get_meta( 'tva_description' );
	}

	/**
	 * Gets comment status
	 *
	 * @return string "open"|"closed"
	 */
	public function get_comment_status() {

		$status = $this->get_meta( 'tva_comment_status' );

		if ( ! in_array( $status, $this->_allowed_comment_status, true ) ) {
			$status = 'closed'; //todo: make sure this method returns a default value which might be a general settings after Luca implements general settings
		}

		return $status;
	}

	/**
	 * Where comments are allowed for current course
	 *
	 * @return bool
	 */
	public function allows_comments() {

		return $this->get_comment_status() === 'open';
	}

	/**
	 * Checks if the current courses has video description
	 *
	 * @return bool
	 */
	public function has_video() {

		return (bool) $this->get_meta( 'tva_video_status' );
	}

	/**
	 * @return TVA_Video
	 */
	public function get_video() {

		$_defaults = array(
			'options' => array(),
			'source'  => '',
			'type'    => 'youtube',
		);

		$video = array_merge( $_defaults, array_filter( (array) $this->get_meta( 'tva_term_media' ) ) );

		return new TVA_Video(
			array(
				'options' => ! empty( $video['media_extra_options'] ) ? $video['media_extra_options'] : $video['options'],
				'source'  => ! empty( $video['media_url'] ) ? $video['media_url'] : $video['source'],
				'type'    => ! empty( $video['media_type'] ) ? $video['media_type'] : $video['type'],
			)
		);
	}

	/**
	 * Gets current's course cover image from term meta
	 *
	 * @return string
	 */
	public function get_cover_image() {

		return $this->get_meta( 'tva_cover_image' );
	}

	/**
	 * Gets the amount of lessons which are being excluded from protection
	 * and visitors have access to
	 *
	 * @return int
	 */
	public function get_excluded() {

		return (int) $this->get_meta( 'tva_excluded' );
	}

	/**
	 * Message which is displayed when a lesson is protected and
	 * the visitor does not have access
	 *
	 * @return string
	 */
	public function get_message() {

		return (string) $this->get_meta( 'tva_message' );
	}

	/**
	 * Preview URL for current course term
	 *
	 * @return string
	 */
	public function get_preview_url() {

		return add_query_arg(
			array(
				'preview' => 'true',
			),
			get_term_link( $this->get_id() )
		);
	}

	/**
	 * Counts all lessons from current course
	 *
	 * @param array $args allows modifying the behaviour, such as counting only published lessons
	 *
	 * @return int
	 */
	public function count_lessons( $args = array() ) {

		$defaults = array(
			'posts_per_page' => - 1,
			'post_status'    => array( 'publish', 'draft' ),
			'post_type'      => array( TVA_Const::LESSON_POST_TYPE ),
			'tax_query'      => array(
				array(
					'taxonomy' => TVA_Const::COURSE_TAXONOMY,
					'field'    => 'term_id',
					'terms'    => array( $this->get_id() ),
					'operator' => 'IN',
				),
			),
		);

		$args = wp_parse_args( $args, $defaults );

		return count( get_posts( $args ) );
	}

	/**
	 * Lazy getter for published lessons count
	 *
	 * @return int
	 */
	public function get_published_lessons_count() {
		return $this->count_lessons( array( 'post_status' => 'publish' ) );
	}

	/**
	 * Gets course order
	 *
	 * @return int
	 */
	public function get_order() {

		return (int) $this->get_meta( 'tva_order' );
	}

	/**
	 * Export class data to array
	 *
	 * @return array
	 */
	public function to_array() {

		return array(
			'id'              => $this->get_id(),
			'status'          => $this->get_status(),
			'topic'           => $this->get_topic_id(),
			'level'           => $this->get_level_id(),
			'label'           => $this->get_label_id(),
			'name'            => $this->name,
			'access'          => $this->get_access(),
			'is_private'      => $this->is_private(),
			'conversions'     => $this->count_conversions(),
			'enrolled_users'  => $this->count_enrolled_users(),
			'rules'           => $this->get_rules(),
			'author'          => $this->get_author(),
			'structure'       => $this->get_structure(),
			'slug'            => $this->slug,
			'description'     => $this->get_description(),
			'allows_comments' => $this->allows_comments(),
			'has_video'       => $this->has_video(),
			'video'           => $this->get_video(),
			'cover_image'     => $this->get_cover_image(),
			'excluded'        => $this->get_excluded(),
			'message'         => $this->get_message(),
			'preview_url'     => $this->get_preview_url(),
			'count_lessons'   => $this->count_lessons(),
			'order'           => $this->get_order(),
		);
	}

	/**
	 * Returns the course edit URL
	 *
	 * @return string
	 */
	private function get_edit_link() {
		return get_admin_url() . 'admin.php?page=thrive_apprentice#courses/' . $this->get_id();
	}
}

global $tva_course;

/**
 * Depending on the current request
 * - tries to instantiate a course only once
 *
 * @return TVA_Course_V2
 */
function tva_course() {

	global $tva_course;

	/**
	 * if we have a course then return it
	 */
	if ( $tva_course instanceof TVA_Course_V2 && $tva_course->get_id() ) {
		return $tva_course;
	}

	/**
	 * instantiate it empty to be able to use ti
	 */
	$tva_course = new TVA_Course_V2( array() );

	/**
	 * After WP is ready
	 * - try getting the course term
	 */
	add_action(
		'wp',
		function () {

			global $tva_course;

			$queries_object = get_queried_object();
			$terms          = get_the_terms( $queries_object, TVA_Const::COURSE_TAXONOMY );

			if ( $queries_object instanceof WP_Term ) {
				//this should enter only once
				$tva_course = new TVA_Course_V2( $queries_object );
			} elseif ( ! empty( $terms ) ) {
				$tva_course = new TVA_Course_V2( $terms[0] );
			}

		}
	);

	return $tva_course;
}

tva_course();
