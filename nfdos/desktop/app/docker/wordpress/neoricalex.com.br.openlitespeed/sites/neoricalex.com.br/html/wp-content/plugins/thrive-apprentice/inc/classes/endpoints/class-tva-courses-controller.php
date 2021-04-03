<?php

/**
 * Class TVA_Courses_Controller
 */
class TVA_Courses_Controller extends TVA_REST_Controller {
	/**
	 * @var string
	 */
	public $base = 'courses';

	/**
	 * @var int
	 */
	public $term_id;

	/**
	 * @var WP_REST_Request $request
	 */
	public $request;

	/**
	 * @var array
	 */
	public $settings = array();

	/**
	 * The course Object
	 *
	 * @var TVA_Course array
	 */
	public $course;

	/**
	 * Published items
	 *
	 * @var array
	 */
	public $published = array();

	/**
	 * Cached results of get_item_schema.
	 *
	 * @since 5.3.0
	 * @var array
	 */
	protected $schema;

	/**
	 * Register Routes
	 */
	public function register_routes() {

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'new_course' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_courses' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/getCourses',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'api_token_permission_check' ),
					'args'                => array(),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/(?P<ID>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_course' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'edit_course' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/update_order/',
			array(
				array(
					'methods'             => WP_REST_Server::ALLMETHODS,
					'callback'            => array( $this, 'update_courses_order' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/search_users',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'search_users' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/bulk_action',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'handle_bulk_action' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/update_posts_order',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_posts_order' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
			)
		);

		/**
		 * Route for getting a list of courses that can be potential candidates for moving content inside them
		 */
		register_rest_route(
			self::$namespace . self::$version,
			'/' . $this->base . '/for-selection',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_courses_for_selection' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(
						'selection_type' => array(
							'type'     => 'string',
							'required' => true,
						),
					),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		$this->register_routes_v2();
	}

	/**
	 * Registers V2 routes
	 */
	public function register_routes_v2() {

		/**
		 * GET Courses V2
		 */
		register_rest_route(
			self::$namespace . 2,
			'/' . $this->base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_courses_v2' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		register_rest_route(
			self::$namespace . 2,
			'/' . $this->base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		register_rest_route(
			self::$namespace . 2,
			'/' . $this->base . '/update_orders',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_orders' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);

		/**
		 * GET Course Item by ID
		 * POST Update Course
		 */
		register_rest_route(
			self::$namespace . 2,
			'/' . $this->base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_course' ),
					'permission_callback' => array( $this, 'courses_permissions_check' ),
					'args'                => array(),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Return all existing courses
	 *
	 * @return array
	 */
	public function get_courses() {
		return tva_get_courses();
	}

	/**
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_courses_v2( $request ) {

		$offset = $request->get_param( 'offset' );
		$offset = $offset !== null ? $offset : 0;
		$offset = (int) $offset;

		$limit = $request->get_param( 'limit' );
		$limit = ! $limit !== null ? $limit : ( class_exists( 'TVA_Admin', false ) ? TVA_Admin::ITEMS_PER_PAGE : 10 );
		$limit = (int) $limit;

		$args = array(
			'offset' => $offset,
			'limit'  => $limit,
			'filter' => $request->get_param( 'filter' ),
		);

		$response = array(
			'items' => TVA_Course_V2::get_items( $args ),
			'total' => TVA_Course_V2::get_items( $args, true ),
		);

		return new WP_REST_Response( $response );
	}

	/**
	 * Fetches a list of courses used as candidates for moving content from another course
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_courses_for_selection( $request ) {
		$all_courses = TVA_Course_V2::get_items( array(
			'offset'  => 0,
			'limit'   => 10000,
			'exclude' => $request->get_param( 'exclude' ),
		) );

		$selection_type = $request->get_param( 'selection_type' );

		foreach ( $all_courses as $key => $course ) {

			$all_course_items = TVA_Manager::get_all_content( $course->wp_term );

			/**
			 * we can add anything in an empty course
			 */
			if ( empty( $all_course_items ) ) {
				continue;
			}

			$modules = array_filter( $all_course_items, static function ( $post ) {
				return $post->post_type === TVA_Const::MODULE_POST_TYPE;
			} );

			$chapters = array_filter( $all_course_items, static function ( $post ) {
				return $post->post_type === TVA_Const::CHAPTER_POST_TYPE;
			} );

			/**
			 * if modules have been selected, we only need to return courses having modules
			 */
			if ( $selection_type === 'module' ) {
				if ( empty( $modules ) ) { // no modules found, course cannot be used as destination; continue loop
					unset( $all_courses[ $key ] );
				}
				continue;
			}

			/**
			 * Check to see if there is at least one empty module.
			 * If there is, it can receive a chapter or a lesson
			 */
			$has_empty_module = false;
			foreach ( $modules as $module ) {
				if ( ! TVA_Manager::get_all_content( $course->wp_term, $module ) ) {
					$has_empty_module = true;
					break;
				}
			}

			if ( $has_empty_module ) {
				continue; // empty module -> can place chapters or lessons inside
			}

			/**
			 * if chapters have been selected, check that the course has at least one chapter
			 */
			if ( $selection_type === 'chapter' && empty( $chapters ) ) {
				unset( $all_courses[ $key ] );
			}
		}

		foreach ( $all_courses as $course ) {
			$course->init_structure();
		}

		return rest_ensure_response( array_values( $all_courses ) );
	}

	/**
	 * @param $request WP_REST_Request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function new_course( $request ) {
		/**
		 * We should add the new course
		 *
		 * @var WP_REST_Request $request
		 */
		$this->request = $request;
		$name          = $this->request->get_param( 'name' );
		$result        = '';

		$args = array(
			'description' => $request->get_param( 'description' ),
			'slug'        => $request->get_param( 'slug' ),
		);

		$course = get_term_by( 'name', $name, TVA_Const::COURSE_TAXONOMY );

		if ( $course ) {
			$this->term_id = $course->term_id;
			$return        = array(
				'term_id'          => $course->term_id,
				'term_taxonomy_id' => $course->term_id,
			);
		} else {
			$result = wp_insert_term( $name, TVA_Const::COURSE_TAXONOMY, $args );

			if ( is_wp_error( $result ) ) {
				// If the category already exists we will import the lessons in the same category
				if ( isset( $result->error_data['term_exists'] ) ) {
					$this->term_id              = $result->get_error_data();
					$return['term_id']          = $this->term_id;
					$return['term_taxonomy_id'] = $this->term_id;
				} else {
					return new WP_Error( 'no-results', __( $result->get_error_message(), TVA_Const::T ) );
				}
			} else {
				$this->term_id = $result['term_id'];
				$return        = $result;
			}
		}

		$return['url'] = get_term_link( $this->term_id, TVA_Const::COURSE_TAXONOMY );
		$this->update_term_meta();

		/**
		 * When importing the courses, instead of endlessly  doing api
		 * calls for each lesson of the course, we're adding the lessons here
		 * (!!! a newly created course only has lessons if it's imported !!!)
		 */
		$lessons = $request->get_param( 'lessons' );
		if ( ! empty( $lessons ) ) {
			$inserted_lessons = array();
			$has_comments     = false;
			$order            = 0;
			foreach ( $lessons as $lesson ) {
				if ( $lesson['checked'] == true ) {
					$args = array(
						'post_title'    => $lesson['post_title'],
						'post_name'     => $lesson['post_title'],
						'post_type'     => TVA_Const::LESSON_POST_TYPE,
						'post_excerpt'  => $lesson['post_excerpt'],
						'post_category' => array( $this->term_id ),
						'post_status'   => 'draft',
					);

					$post_id = wp_insert_post( $args );

					if ( ! is_wp_error( $post_id ) ) {
						$inserted_lessons[] = $post_id;
						$comments           = get_comments( array( 'post_id' => $lesson['old_id'] ) );

						if ( ! empty( $comments ) ) {
							if ( $has_comments === false ) {
								$has_comments             = true;
								$return['comment_status'] = 'open';
								update_term_meta( $this->term_id, 'tva_comment_status', 'open' );
							}

							foreach ( $comments as $comment ) {
								$comment->comment_post_ID = $post_id;
								wp_update_comment( $comment->to_array() );
							}
						}

						/**
						 * Import the Featured Image
						 */
						$featured_image = has_post_thumbnail( $lesson['old_id'] ) ? get_the_post_thumbnail_url( $lesson['old_id'], 'full' ) : '';

						if ( ! empty( $featured_image ) ) {
							update_post_meta( $post_id, 'tva_cover_image', $featured_image );
						}

						/**
						 * Import the lessond type, and if it's a video import the urls and other data
						 */
						$lesson_type = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_lesson_type', true );
						$video_type  = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_type', true );
						$audio_type  = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_audio_type', true );
						$video_extra = array();
						$url         = '';

						if ( $lesson_type == 'video' ) {
							if ( $video_type == 'youtube' ) {

								$url             = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_youtube_url', true );
								$hide_related    = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_youtube_hide_related', true );
								$hide_logo       = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_youtube_hide_logo', true );
								$hide_controls   = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_youtube_hide_controls', true );
								$hide_title      = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_youtube_hide_title', true );
								$autoplay        = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_youtube_autoplay', true );
								$hide_fullscreen = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_youtube_hide_fullscreen', true );
								if ( $hide_related ) {
									$video_extra['hide-related'] = 1;
								}
								if ( $hide_logo ) {
									$video_extra['hide-logo'] = 1;
								}
								if ( $hide_controls ) {
									$video_extra['hide-controls'] = 1;
								}
								if ( $hide_title ) {
									$video_extra['hide-title'] = 1;
								}
								if ( $autoplay ) {
									$video_extra['autoplay'] = 1;
								}
								if ( $hide_fullscreen ) {
									$video_extra['hide-full-screen'] = 1;
								}
							} elseif ( $video_type == 'vimeo' ) {
								$url = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_vimeo_url', true );
							} elseif ( $video_type == 'custom' ) {
								$url = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_custom_url', true );
							} else {
								$video_type = 'custom';
								$url        = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_video_custom_embed', true );
							}

						} elseif ( $lesson_type == 'audio' ) {
							// we only import soundcloud url
							if ( $audio_type == 'soundcloud' ) {
								$video_type = '';
								$url        = get_post_meta( $lesson['old_id'], '_thrive_meta_appr_audio_soundcloud_url', true );
							}
						} else {
							$video_type = '';
						}

						/**
						 * we should update video options
						 */
						$media_type = '';

						if ( ( $lesson_type == 'audio' ) && ( $audio_type == 'soundcloud' ) ) {
							$media_type = 'soundcloud';
						} elseif ( $lesson_type == 'video' ) {
							$media_type = $video_type;
						}

						if ( ! empty( $media_type ) ) {
							$media_args = array(
								'media_type'          => $media_type,
								'media_url'           => $url,
								'media_extra_options' => $video_extra,
							);

							update_post_meta( $post_id, 'tva_post_media', $media_args );
						}

						update_post_meta( $post_id, 'tva_lesson_type', $lesson_type );
						wp_set_object_terms( $post_id, $this->term_id, TVA_Const::COURSE_TAXONOMY );

						/**
						 * Get the TCB content
						 */

						$content_before_more = get_post_meta( $lesson['old_id'], 'tve_content_before_more', true );
						$content_more_found  = get_post_meta( $lesson['old_id'], 'tve_content_more_found', true );
						$save_post           = get_post_meta( $lesson['old_id'], 'tve_save_post', true );
						$custom_css          = get_post_meta( $lesson['old_id'], 'tve_custom_css', true );
						$user_custom_css     = get_post_meta( $lesson['old_id'], 'tve_user_custom_css', true );
						$page_events         = get_post_meta( $lesson['old_id'], 'tve_page_events', true );
						$updated_post        = get_post_meta( $lesson['old_id'], 'tve_updated_post', true );
						$search_content      = get_post_meta( $lesson['old_id'], 'tve_search_content', true );
						$globals             = get_post_meta( $lesson['old_id'], 'tve_globals', true );
						$icon_pack           = get_post_meta( $lesson['old_id'], 'thrive_icon_pack', true );
						$masonry             = get_post_meta( $lesson['old_id'], 'tve_has_masonry', true );
						$typefocus           = get_post_meta( $lesson['old_id'], 'tve_has_typefocus', true );
						$wistia_popover      = get_post_meta( $lesson['old_id'], 'tve_has_wistia_popover', true );

						if ( ! empty( $lesson['post_content'] ) ) {
							$non_tcb_content = '<div class="tve_wp_shortcode thrv_wrapper"><div class="tve_shortcode_raw" style="display: none">___TVE_SHORTCODE_RAW__' . $lesson['post_content'] . '__TVE_SHORTCODE_RAW___</div></div>';
							$save_post       .= $non_tcb_content;
							$updated_post    .= $non_tcb_content;
						}

						/**
						 * put the TCB content in
						 */
						update_post_meta( $post_id, 'tve_content_before_more', $content_before_more );
						update_post_meta( $post_id, 'tve_content_more_found', $content_more_found );
						update_post_meta( $post_id, 'tve_save_post', $save_post );
						update_post_meta( $post_id, 'tve_custom_css', $custom_css );
						update_post_meta( $post_id, 'tve_user_custom_css', $user_custom_css );
						update_post_meta( $post_id, 'tve_page_events', $page_events );
						update_post_meta( $post_id, 'tve_updated_post', $updated_post );
						update_post_meta( $post_id, 'tve_search_content', $search_content );
						update_post_meta( $post_id, 'tve_globals', $globals );
						update_post_meta( $post_id, 'thrive_icon_pack', $icon_pack );
						update_post_meta( $post_id, 'tve_has_masonry', $masonry );
						update_post_meta( $post_id, 'tve_has_typefocus', $typefocus );
						update_post_meta( $post_id, 'tve_has_wistia_popover', $wistia_popover );

						/** @var WP_Post $post */
						$post               = get_post( $post_id );
						$post->course_id    = $this->term_id;
						$post->tcb_edit_url = tva_get_editor_url( $post_id );
						$post->cover_image  = $featured_image;
						$post->lesson_type  = $lesson_type;
						$post->post_media   = get_post_meta( $post_id, 'tva_post_media', $args );

						$args = array(
							'posts_per_page' => - 1,
							'post_type'      => TVA_Const::LESSON_POST_TYPE,
							'post_status'    => array( 'publish', 'draft' ),
							'tax_query'      => array(
								array(
									'taxonomy' => TVA_Const::COURSE_TAXONOMY,
									'field'    => 'term_id',
									'terms'    => array( $this->term_id ),
									'operator' => 'IN',
								),
							),
						);

						$posts = get_posts( $args );

						foreach ( $posts as $other_post ) {
							$other_post = tva_get_post_data( $other_post );
							if ( $order < $other_post->order ) {
								$order = $other_post->order;
							}
						}

						$post->order = ++ $order;
						update_post_meta( $post->ID, 'tva_lesson_order', $post->order );

						$return['lessons'][] = $post;
						update_post_meta( $lesson['old_id'], 'tva_imported', true );
					};
				}
			}

			if ( $has_comments === true ) {
				foreach ( $inserted_lessons as $lesson_id ) {
					wp_update_post(
						array( 'ID' => $lesson_id, 'comment_status' => 'open' )
					);
				}

				foreach ( $return['lessons'] as $lesson ) {
					$lesson->comment_status = 'open';
				}
			}
		}

		do_action( 'tva_after_save_course', $return, $request );

		if ( $return ) {
			return new WP_REST_Response( $return, 200 );
		}

		return new WP_Error( 'no-results', __( $result->get_error_message(), TVA_Const::T ) );
	}

	/**
	 * Update term meta
	 */
	public function update_term_meta() {
		$term_id        = $this->term_id;
		$user_settings  = TVA_Settings::instance();
		$this->settings = $user_settings->get_settings();

		update_term_meta( $term_id, 'tva_cover_image', $this->request->get_param( 'cover_image' ) );
		update_term_meta( $term_id, 'tva_order', $this->request->get_param( 'order' ) );
		update_term_meta( $term_id, 'tva_level', $this->request->get_param( 'level' ) );
		update_term_meta( $term_id, 'tva_logged_in', $this->request->get_param( 'logged_in' ) );
		update_term_meta( $term_id, 'tva_message', $this->request->get_param( 'message' ) );
		update_term_meta( $term_id, 'tva_roles', $this->request->get_param( 'roles' ) );
		update_term_meta( $term_id, 'tva_topic', $this->request->get_param( 'topic' ) );
		update_term_meta( $term_id, 'tva_author', $this->request->get_param( 'author' ) );
		update_term_meta( $term_id, 'tva_status', $this->request->get_param( 'status' ) );
		update_term_meta( $term_id, 'tva_description', $this->request->get_param( 'description' ) );
		update_term_meta( $term_id, 'tva_label', $this->request->get_param( 'label' ) );
		update_term_meta( $term_id, 'tva_label_name', $this->request->get_param( 'label_name' ) );
		update_term_meta( $term_id, 'tva_label_color', $this->request->get_param( 'label_color' ) );
		update_term_meta( $term_id, 'tva_excluded', $this->request->get_param( 'excluded' ) );
		update_term_meta( $term_id, 'tva_membership_ids', $this->request->get_param( 'membership_ids' ) );
		update_term_meta( $term_id, 'tva_bundle_ids', $this->request->get_param( 'bundle_ids' ) );
		update_term_meta( $term_id, 'tva_video_status', $this->request->get_param( 'video_status' ) );
		update_term_meta( $term_id, 'tva_term_media', $this->request->get_param( 'term_media' ) );
		update_term_meta( $term_id, 'tva_comment_status', $this->request->get_param( 'comment_status' ) );
		tva_integration_manager()->save_rules( $term_id, $this->request->get_param( 'rules' ) );

		/**
		 * Check if course comment status has benn changed, if so update comment status for all lessons within that course
		 */
		if ( TVA_Const::TVA_IS_COURSE_COMMENT_STATUS_CHANGED !== $this->request->get_param( 'comment_status_changed' ) ) {
			$ids = $this->request->get_param( 'post_ids' );

			if ( isset( $ids ) && is_array( $ids ) ) {
				TVA_Lessons_Controller::update_lessons_comment_status( $ids, $this->request->get_param( 'comment_status' ) );
			}
		}

		if ( $this->settings['membership_plugin'] ) {
			$this->handle_membership_plugin_setup();
		}
	}

	/**
	 * Update sendowl products when a course is added or removed from one products protection
	 */
	public function update_sendowl_products() {
		$products            = TVA_Products_Collection::make( TVA_Sendowl_Manager::get_products() );
		$associated_products = $products->filter_by_term( $this->request->get_param( 'ID' ) );

		/**
		 * Remove the current term from all it's previous products
		 */
		foreach ( $associated_products->get_items() as $item ) {
			/**  @var TVA_Product_Model $item */
			$item->remove_protected_term( (int) $this->request->get_param( 'ID' ) );
			$products->update_item( $item );
		}

		$stop = 'draft' === $this->request->get_param( 'status' )           // course is draft
		        || 'DELETE' === $this->request->get_method()                    // course is deleted
		        || (int) $this->request->get_param( 'logged_in' ) !== 1;    // logged_in param is not true

		if ( true === $stop ) {
			update_option( 'tva_sendowl_products', $products->prepare_for_db() );

			return;
		}

		$p_ids = $this->get_sendowl_product_ids();

		/**
		 * Add current term to selected products
		 */
		foreach ( $p_ids as $p_id ) {
			$product = $products->get_by_id( $p_id );

			if ( $product instanceof TVA_Model ) {
				/**  @var TVA_Product_Model $product */
				$product->add_protected_term( (int) $this->request->get_param( 'term_id' ) );
				$products->update_item( $product );
			}
		}

		update_option( 'tva_sendowl_products', $products->prepare_for_db() );
	}

	/**
	 * Get all product and bundle ids which protect this course
	 *
	 * @return array
	 */
	public function get_sendowl_product_ids() {

		$rules            = $this->request->get_param( 'rules' );
		$so_product_rules = wp_list_filter( $rules, array( 'integration' => 'sendowl_product' ) );
		$so_bundle_rules  = wp_list_filter( $rules, array( 'integration' => 'sendowl_bundle' ) );
		$item_ids         = array();

		if ( ! empty( $so_product_rules ) ) {
			$items = wp_list_pluck( $so_product_rules, 'items' );
			$items = array_values( $items );

			if ( isset( $items[0] ) ) {
				$item_ids = wp_list_pluck( $items[0], 'id' );
			}
		}

		if ( ! empty( $so_bundle_rules ) ) {
			$items = wp_list_pluck( $so_bundle_rules, 'items' );
			$items = array_values( $items );

			if ( isset( $items[0] ) ) {
				$item_ids = array_merge( $item_ids, wp_list_pluck( $items[0], 'id' ) );
			}
		}

		return $item_ids;
	}

	/**
	 * Handle the membership plugin setup, like adding things needed to the DB
	 */
	public function handle_membership_plugin_setup() {
		/**
		 * we have the course in the request but it's an array, and for consistency
		 * with other actions done on the $tva_db class we get the course object rather
		 * than keeping the array and doing a lot of other checks afterwords
		 */
		$course = tva_get_course_by_id( $this->term_id );

		global $tva_db;
		$settings = $this->settings;

		foreach ( $settings['membership_plugin'] as $membership ) {
			$tva_db->tva_protection_manager( $course, $membership['tag'] );
		}
	}

	/**
	 * Check if the user has permissions to do API calls
	 *
	 * @return bool
	 */
	public function courses_permissions_check() {

		return TVA_Product::has_access();
	}

	/**
	 * Delete the course
	 *
	 * @param $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function delete_course( $request ) {

		/**
		 * @var WP_REST_Request $request
		 */
		$term_id = $request->get_param( 'ID' );
		if ( empty( $term_id ) ) {
			$term_id = (int) $request->get_param( 'id' );
		}
		$this->request = $request;

		/**
		 * Also delete the course lessons
		 */
		$args = array(
			'posts_per_page' => - 1,
			'post_type'      => array(
				TVA_Const::LESSON_POST_TYPE,
				TVA_Const::CHAPTER_POST_TYPE,
				TVA_Const::MODULE_POST_TYPE,
			),
			'post_status'    => array( 'publish', 'draft' ),
			'tax_query'      => array(
				array(
					'taxonomy' => TVA_Const::COURSE_TAXONOMY,
					'field'    => 'term_id',
					'terms'    => array( $term_id ),
					'operator' => 'IN',
				),
			),
		);

		$posts = get_posts( $args );

		$this->update_sendowl_products();
		$this->delete_course_comments( $term_id );
		$result = wp_delete_term( $term_id, TVA_Const::COURSE_TAXONOMY );

		if ( ! empty( $posts ) ) {
			foreach ( $posts as $post ) {
				wp_delete_post( $post->ID, true );
			}
		}

		if ( $result ) {
			return new WP_REST_Response( $result, 200 );
		}

		return new WP_Error( 'no-results', __( 'No course was deleted!', TVA_Const::T ) );
	}

	/**
	 * Delete course comments
	 *
	 * @param $course_id
	 */
	public function delete_course_comments( $course_id ) {
		$hidden_post_id = get_option( 'tva_course_hidden_post_id' );
		$args           = array(
			'post_id'    => $hidden_post_id,
			'meta_key'   => 'tva_course_comment_term_id',
			'meta_value' => $course_id,
		);

		$comments = get_comments( $args );

		if ( ! empty( $comments ) ) {
			foreach ( $comments as $comment ) {
				wp_delete_comment( $comment->comment_ID, true );
				delete_comment_meta( $comment->comment_ID, 'tva_course_comment_term_id', $course_id );
			}
		}
	}

	/**
	 * Edit course
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function edit_course( $request ) {
		/**
		 * We should add the new course
		 */
		$this->request = $request;
		$this->term_id = $this->request->get_param( 'ID' );

		$args = array(
			'name'        => $this->request->get_param( 'name' ),
			'description' => '',
			'slug'        => $this->request->get_param( 'slug' ),
		);

		$result = wp_update_term( $this->term_id, TVA_Const::COURSE_TAXONOMY, $args );

		if ( is_wp_error( $result ) && $result->get_error_code() === 'duplicate_term_slug' ) {
			return new WP_Error( 'duplicate-term', __( 'A course with this name already exists', TVA_Const::T ) );
		}

		$result['url'] = get_term_link( $result['term_id'], TVA_Const::COURSE_TAXONOMY );

		$this->update_term_meta();

		$update_so = $this->request->get_param( 'update_sendowl_products' );

		if ( 1 === (int) $update_so && TVA_SendOwl::is_connected() ) {
			$this->update_sendowl_products();
		}

		do_action( 'tva_after_save_course', $result, $request );

		if ( $result ) {
			return new WP_REST_Response( $result, 200 );
		}

		return new WP_Error( 'no-results', __( $result, TVA_Const::T ) );
	}

	/**
	 * @param $status
	 * Update comment status for all courses and lessons
	 */
	public static function tva_update_courses_comment_status( $status ) {
		$terms = get_terms( array( 'taxonomy' => TVA_Const::COURSE_TAXONOMY ) );

		foreach ( $terms as $term ) {
			update_term_meta( $term->term_id, 'tva_comment_status', $status );
		}

		$args = array(
			'post_type'      => array( TVA_Const::LESSON_POST_TYPE, TVA_Const::MODULE_POST_TYPE ),
			'posts_per_page' => - 1,
			'post_status'    => array( 'publish', 'draft' ),
		);

		$posts = get_posts( $args );

		foreach ( $posts as $post ) {
			wp_update_post( array( 'ID' => $post->ID, 'comment_status' => $status ) );
		}
	}

	/**
	 * Update courses order
	 *
	 * @param $request
	 *
	 * @return WP_REST_Response
	 */
	public function update_courses_order( $request ) {
		/**
		 * @var WP_REST_Request $request
		 */
		$new_order = $request->get_param( 'new_order' );
		foreach ( $new_order as $term_id => $order ) {
			update_term_meta( $term_id, 'tva_order', $order );
		}

		return new WP_REST_Response( true, 200 );
	}

	/**
	 * @param $request
	 *
	 * @return array
	 */
	public function search_users( $request ) {

		/**
		 * @var WP_REST_Request $request
		 */
		$term   = $request->get_param( 'term' );
		$result = array();

		$args  = array(
			'orderby'     => 'login',
			'order'       => 'ASC',
			'search'      => '*' . $term . '*',
			'count_total' => false,
			'fields'      => 'all',
		);
		$users = get_users( $args );

		/** @var WP_User $user */
		foreach ( $users as $user ) {
			$result[] = new TVA_Author( $user );
		}

		return $result;
	}

	/**
	 * @param WP_REST_Request $request
	 *
	 * @return mixed
	 */
	public function handle_bulk_action( $request ) {

		$user_settings  = TVA_Settings::instance();
		$this->settings = $user_settings->get_settings();
		$this->term_id  = $request->get_param( 'course_id' );
		$data           = $request->get_param( 'items' );
		$action         = $request->get_param( 'action' );

		$fn = $action . '_bulk_items';

		if ( $action === 'move' ) {
			$high_level = $request->get_param( 'high_level' );
			$result     = $this->$fn( $data, $high_level, $request );
		} else {
			$result = $this->$fn( $data );
		}


		if ( $this->settings['membership_plugin'] ) {
			$this->handle_membership_plugin_setup();
		}

		return $result;
	}

	/**
	 * Bulk delete items
	 *
	 * @param $items
	 *
	 * @return string
	 */
	public function delete_bulk_items( $items ) {

		foreach ( $items as $item ) {

			$item = (int) $item;

			if ( ! $item ) {
				continue;
			}

			$post     = get_post( $item );
			$tva_post = TVA_Post::factory( $post );
			$tva_post->delete();
		}

		$course = new TVA_Course_V2( (int) $this->term_id );
		$course->init_structure();

		return rest_ensure_response( $course );
	}

	/**
	 * Bulk publish items
	 *
	 * @param $items
	 *
	 * @return WP_REST_Response
	 */
	public function publish_bulk_items( $items ) {
		$this->course = new TVA_Course( $this->term_id );

		foreach ( $items as $item ) {
			wp_update_post( array( 'ID' => $item, 'post_status' => 'publish' ) );
			$this->published[] = (int) $item;

			$post = get_post( $item );
			if ( $post && $post->post_parent > 0 ) {
				$this->publish_parent( $post->post_parent );
			}
		}

		tva_integration_manager()->save_rules( $this->term_id, tva_integration_manager()->get_rules( $this->course ) );

		return new WP_REST_Response( $this->published, 200 );
	}

	/**
	 * Bulk unpublish items
	 *
	 * @param $items
	 *
	 * @return WP_REST_Response
	 */
	public function unpublish_bulk_items( $items ) {
		foreach ( $items as $item ) {
			wp_update_post( array( 'ID' => $item, 'post_status' => 'draft' ) );
			$this->published[] = (int) $item;
			$post              = get_post( $item );

			if ( $post && $post->post_parent > 0 ) {
				$this->unpublish_parent( $post->post_parent );

			}
		}

		return new WP_REST_Response( $this->published, 200 );
	}

	/**
	 * Recursively unpublish parents
	 *
	 * @param $parent_id
	 */
	public function unpublish_parent( $parent_id ) {
		$this->course = new TVA_Course( $this->term_id );
		$children     = $this->course->get_element_children( $parent_id );
		$published    = false;

		foreach ( $children as $child ) {
			if ( $child->post_status == 'publish' ) {
				$published = true;
			}
		}

		if ( ! $published ) {
			$parent = get_post( $parent_id );
			if ( $parent instanceof WP_Post ) {

				wp_update_post( array( 'ID' => $parent->ID, 'post_status' => 'draft' ) );
				$this->published[] = (int) $parent_id;

				if ( $parent->post_parent > 0 ) {
					$this->unpublish_parent( $parent->post_parent );
				}
			}
		}
	}

	/**
	 * Recursively publish parents
	 *
	 * @param $parent_id
	 */
	private function publish_parent( $parent_id ) {
		foreach ( $this->course->posts as $post ) {

			if ( $post->ID === (int) $parent_id ) {
				wp_update_post( array(
					'ID'          => $post->ID,
					'post_status' => 'publish',
				) );
				$this->published[] = (int) $parent_id;
				if ( $post->post_parent > 0 ) {
					$this->publish_parent( $post->post_parent );
				}
			}
		}
	}

	/**
	 * Bulk move items
	 * - set new term
	 * - review destination status/order
	 * - review source status/order
	 *
	 * @param array           $items
	 * @param string          $high_level
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function move_bulk_items( $items, $high_level, $request ) {

		$new_course_id = '';
		$old_parents   = array();
		$new_parents   = array();
		$course_term   = null;

		foreach ( $items as $item ) {
			try {

				if ( strpos( $item['post_type'], $high_level ) === false ) {
					continue;
				}

				$new_course_id = (int) $item['course_id'];

				if ( $item['old_post_parent'] ) { //it might be zero
					$old_parents[] = (int) $item['old_post_parent'];
				}

				$tva_item = TVA_Post::factory( $item );

				$order = count( $tva_item->get_siblings() );

				if ( $tva_item->post_parent ) { //we move this into a new module / chapter
					$order         = $tva_item->get_parent()->get_order() . $order;
					$new_parents[] = $tva_item->post_parent;
				}

				$tva_item->order = $order;

				$tva_item->save();

				TVA_Manager::review_children_order( $tva_item->ID );

			} catch ( Exception $e ) {

				return new WP_REST_Response( $e->getMessage(), 400 );
			}
		}

		/**
		 * Review status for new parents where items where moved into
		 */
		$new_parents = array_unique( $new_parents );
		foreach ( $new_parents as $new_parent_id ) {
			TVA_Manager::review_status( (int) $new_parent_id );
		}

		/**
		 * Review status and order for old parents/source
		 */
		$old_parents = array_unique( $old_parents );
		foreach ( $old_parents as $parent_id ) {
			TVA_Manager::review_children_order( (int) $parent_id );
			TVA_Manager::review_status( (int) $parent_id );
		}

		/**
		 * review source course direct children
		 * - for the new order which items should get
		 */
		$source_term = get_term( $this->term_id );
		$children    = TVA_Manager::get_course_modules( $source_term );
		if ( empty( $children ) ) {
			$children = TVA_Manager::get_course_chapters( $source_term );
		}
		if ( empty( $children ) ) {
			$children = TVA_Manager::get_course_lessons( $source_term );
		}

		/** @var WP_Post $child */
		foreach ( $children as $key => $child ) {

			$tva_post        = new TVA_Post( $child );
			$tva_post->order = $key; //performs save

			TVA_Manager::review_children_order( $child );
		}

		if ( $request->get_param( 'v' ) === '2' ) {
			$course = new TVA_Course_V2( (int) $request->get_param( 'course_id' ) );
			$course->init_structure();

			return rest_ensure_response( $course );
		}
		/**
		 * prepare response
		 */
		$response[] = tva_get_course_by_id( $this->term_id );
		if ( $new_course_id != $this->term_id ) {
			$response[] = tva_get_course_by_id( $new_course_id );
		}

		return new WP_REST_Response( $response, 200 );
	}

	/**
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function update_posts_order( $request ) {

		$items         = $request->get_param( 'items' );
		$this->term_id = (int) $request->get_param( 'course_id' );
		$old_posts     = array();

		if ( false === is_array( $items ) ) {
			$items = array();
		}

		/**
		 * update posts with new order
		 * and with new parent, if applicable
		 */
		foreach ( $items as $item ) {

			/** @var WP_Post $post */
			$post        = get_post( $item['ID'] );
			$old_posts[] = $post; //for later use

			/**
			 * set the post to new parent because
			 * it was moved to another parent
			 */
			if ( true === $post instanceof WP_Post && $post->post_parent !== (int) $item['post_parent'] ) {
				wp_update_post( array(
					'ID'          => $item['ID'],
					'post_parent' => $item['post_parent'],
				) );
			}

			$order = $item['order'];

			/** @var WP_Post $parent */
			$parent = get_post( $item['post_parent'] );
			if ( true === $parent instanceof WP_Post ) {
				$parent_order = $parent->post_type === TVA_Const::CHAPTER_POST_TYPE ? $parent->tva_chapter_order : $parent->tva_module_order;
				$order        = $parent_order . $order;
			}

			/**
			 * update the post with new $order
			 */
			update_post_meta( (int) $item['ID'], $item['post_type'] . '_order', $order );

			$this->update_children_order( $post );

			/**
			 * Update the status of the parent which received the item
			 */
			if ( true === $parent instanceof WP_Post ) {
				$this->change_post_status( $parent );
				if ( $parent->post_parent > 0 ) {
					$module = get_post( $parent->post_parent );
					$this->change_post_status( $module );
				}
			}
		}

		$old_parents_update = array();

		/**
		 * Update the status for the post/s from which the item has been moved out
		 * Update the old parents with new status:
		 * - maybe a single published lesson has been moved and the chapter/module has to be set on draft
		 */
		foreach ( $old_posts as $post ) {

			if ( ! $post->post_parent ) {
				continue;
			}

			$parent = get_post( $post->post_parent );

			if ( false === $parent instanceof WP_Post ) {
				continue;
			}

			if ( true === in_array( $parent->ID, $old_parents_update ) ) {
				continue;
			}

			$this->change_post_status( $parent );

			/**
			 * store it here to avoiding loop on the same ID
			 */
			$old_parents_update[] = $parent->ID;

			if ( $parent->post_parent > 0 ) {
				$module = get_post( $parent->post_parent );
				$this->change_post_status( $module );
				$old_parents_update[] = $module->ID;
			}
		}

		$term = new TVA_Course( $this->term_id );

		return new WP_REST_Response( $term->get_term(), 200 );
	}

	/**
	 * Based on it children if there are any with publish status
	 * - then update the post status
	 *
	 * @param WP_Post $post
	 */
	public function change_post_status( $post ) {

		$status   = 'draft';
		$children = TVA_Manager::get_children( $post );

		/** @var WP_Post $child */
		foreach ( $children as $child ) {
			if ( $child->post_status === 'publish' ) {
				$status = 'publish';
				break; //if there is at least one published post then it is enough to make the parent's status publish
			}
		}

		wp_update_post( array(
			'ID'          => $post->ID,
			'post_status' => $status,
		) );
	}

	/**
	 * @param WP_Post $post
	 *
	 * @return bool
	 */
	public function update_children_order( $post ) {

		if ( false === $post instanceof WP_Post ) {
			return false;
		}

		/**
		 * it may be a list o chapters or a list of lessons
		 */
		$children        = TVA_Manager::get_children( $post );
		$order_meta_name = $post->post_type === TVA_Const::CHAPTER_POST_TYPE ? 'tva_chapter_order' : 'tva_module_order';

		/**
		 * @var int     $key
		 * @var WP_Post $child
		 */
		foreach ( $children as $key => $child ) {
			$meta_name = $child->post_type === TVA_Const::CHAPTER_POST_TYPE ? 'tva_chapter_order' : 'tva_lesson_order';
			$order     = $post->{$order_meta_name} . $key;
			update_post_meta( $child->ID, $meta_name, $order );

			if ( $child->post_type === TVA_Const::CHAPTER_POST_TYPE ) {
				$this->update_children_order( $child );
			}
		}

		return true;
	}

	/**
	 * Callback for getCourses endpoint
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_items( $request ) {

		$data    = array();
		$filters = array(
			'status' => 'publish',
		);

		$rule = $request->get_param( 'rule' );
		if ( ! empty( $rule ) ) {
			$filters['rule'] = $rule;
		}

		$courses = TVA_Course_V2::get_items( $filters );

		foreach ( $courses as $course ) {
			$response = $this->prepare_item_for_response( $course, $request );
			$data[]   = $this->prepare_response_for_collection( $response );
		}

		TVA_Logger::set_type( 'REQUEST GetCourses' );
		TVA_Logger::log(
			'/getCourses',
			array_merge( $request->get_params(), $_SERVER ),
			true
		);

		return rest_ensure_response( $data );
	}

	/**
	 * @param WP_REST_Request $request
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_item( $request ) {

		$id     = (int) $request->get_param( 'id' );
		$course = new TVA_Course_V2( $id );

		$course->init_structure();

		return rest_ensure_response( $course->jsonSerialize() );
	}

	/**
	 * Based on schema prepare and item to be served
	 *
	 * @param TVA_Course_V2   $item
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function prepare_item_for_response( $item, $request ) {

		$data = array();

		$schema = $this->get_item_schema();

		if ( isset( $schema['properties']['id'] ) ) {
			$data['id'] = $item->get_id();
		}

		if ( isset( $schema['properties']['title'] ) ) {
			$data['title'] = $item->name;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Schema for a course
	 *
	 * @return array
	 */
	public function get_item_schema() {

		if ( $this->schema ) {
			return $this->schema;
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'tva_curse',
			'type'       => 'object',
			'properties' => array(
				'id'    => array(
					'description' => esc_html__( 'Unique identifier of Thrive Apprentice Course', 'thrive-apprentice' ),
					'type'        => 'integer',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'title' => array(
					'description' => esc_html__( 'Title of Thrive Apprentice Course', 'thrive-apprentice' ),
					'type'        => 'string',
				),
			),
		);

		return $this->schema;
	}

	/**
	 * Updates/Saves an existing course
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {

		$id     = (int) $request->get_param( 'id' );
		$course = new TVA_Course_V2( $id );

		$course->name        = $request->get_param( 'name' );
		$course->topic       = $request->get_param( 'topic' );
		$course->label       = $request->get_param( 'label' );
		$course->level       = $request->get_param( 'level' );
		$course->description = $request->get_param( 'description' );
		$course->slug        = $request->get_param( 'slug' );
		$course->cover_image = $request->get_param( 'cover_image' );
		$course->has_video   = (bool) $request->get_param( 'has_video' );
		$course->is_private  = (bool) $request->get_param( 'is_private' );
		$course->excluded    = (int) $request->get_param( 'excluded' );
		$course->message     = $request->get_param( 'message' );
		$course->status      = $request->get_param( 'status' );

		/**
		 * Prepare video
		 */
		$video            = $request->get_param( 'video' );
		$video_options    = ! empty( $video['options'] ) ? $video['options'] : array();
		$video['options'] = array_filter( $video_options );
		$course->video    = $video;

		/**
		 * Prepare status comment
		 */
		$comment_status         = (bool) $request->get_param( 'allows_comments' );
		$course->comment_status = $comment_status ? 'open' : 'closed';

		/**
		 * Prepare author
		 */
		$author = $request->get_param( 'author' );
		if ( ! empty( $author['ID'] ) ) {
			$authorInstance = new TVA_Author( (int) $author['ID'] );
			$authorInstance->set_details( array(
				'avatar_url'       => $author['avatar_url'],
				'biography_type'   => $author['biography_type'],
				'custom_biography' => $author['custom_biography'],
			) );
			$course->author = $authorInstance;
		}

		/**
		 * Save the course
		 */
		$saved = $course->save();

		if ( is_wp_error( $saved ) ) {
			return rest_ensure_response( $saved );
		}

		$rules = $request->get_param( 'rules' );
		if ( empty( $rules ) ) {
			$rules = array();
		}
		tva_integration_manager()->save_rules( $course->get_id(), $rules );

		return rest_ensure_response( $course );
	}

	/**
	 * Creates a new course and saves it in DB
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return void|WP_Error|WP_REST_Response
	 */
	public function create_item( $request ) {
		$course = new TVA_Course_V2( array(
			'name'        => $request->get_param( 'name' ),
			'description' => $request->get_param( 'description' ),
			'cover_image' => $request->get_param( 'cover_image' ),
			'message'     => $request->get_param( 'message' ),
			'order'       => (int) $request->get_param( 'order' ),
			'topic'       => (int) $request->get_param( 'topic' ),
			'excluded'    => (int) $request->get_param( 'excluded' ),
			'has_video'   => (bool) $request->get_param( 'has_video' ),
			'level'       => (int) $request->get_param( 'level' ),
		) );

		/**
		 * Prepare video
		 */
		$video            = $request->get_param( 'video' );
		$video_options    = ! empty( $video['options'] ) ? $video['options'] : array();
		$video['options'] = array_filter( $video_options );
		$course->video    = $video;

		/**
		 * Prepare status comment
		 */
		$comment_status         = (bool) $request->get_param( 'allows_comments' );
		$course->comment_status = $comment_status ? 'open' : 'closed';

		/**
		 * save course
		 */
		$course_id = $course->save();

		if ( is_wp_error( $course_id ) ) {
			return $course_id;
		}

		/**
		 * Prepare author
		 */
		$author = $request->get_param( 'author' );
		if ( ! empty( $author['ID'] ) ) {
			$authorInstance = new TVA_Author( (int) $author['ID'] );
			$authorInstance->set_details( array(
				'avatar_url'       => $author['avatar_url'],
				'biography_type'   => $author['biography_type'],
				'custom_biography' => $author['custom_biography'],
			) );
			$course->author = $authorInstance;
		}

		$course->save();

		return rest_ensure_response( $course );
	}

	/**
	 * Updates orders for courses
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return true
	 */
	public function update_orders( $request ) {
		foreach ( $request->get_params() as $course_id => $order ) {
			update_term_meta( (int) $course_id, 'tva_order', (int) $order );
		}

		return true;
	}
}
