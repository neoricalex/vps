<?php
/**
 * Created by PhpStorm.
 * User: stork
 * Date: 10.07.2017
 * Time: 09:21
 */

/**
 * Global instance to be used allover
 */
global $tva_db;

/**
 * Encapsulates the global $wpdb object
 *
 * Class TVA_Db
 */
class TVA_Db {
	/**
	 * @var wpdb|null
	 */
	protected $wpdb = null;
	/**
	 * @var bool
	 */
	public static $withcomments = true;

	/**
	 * TVA_Db constructor.
	 */
	public function __construct() {
		global $wpdb;

		$this->wpdb = $wpdb;
	}

	/**
	 * Wrapper around $withcomments
	 */
	public static function setCommentsStatus() {
		global $withcomments;
		$withcomments = self::$withcomments;
	}

	/**
	 * Return an array of membership levels
	 *
	 * @return array|null|object
	 */
	public function get_membership_levels() {
		$table_name = $this->mm_table_name( 'membership_levels' );

		$levels = $this->wpdb->get_results( $this->wpdb->prepare( "SELECT id, name FROM `$table_name` WHERE status = %d", array( 1 ) ), ARRAY_A );

		/**
		 * It seems that wpdb returns the ID as a string instead of an int, we're transformint this into an intiger for backbone use
		 */
		foreach ( $levels as $key => $level ) {
			$levels[ $key ]['id'] = (int) $level['id'];
		}

		return $levels;
	}

	/**
	 * MemberMouse table integration
	 *
	 * @param $tablename
	 *
	 * @return string
	 */
	public function mm_table_name( $tablename ) {
		return MM_PREFIX . $tablename;
	}

	/**
	 * Get membership levels for memberpress
	 *
	 * @return array
	 */
	public function get_memberpress_membership_levels() {
		$levels   = array();
		$products = get_posts( array( 'numberposts' => - 1, 'post_type' => TVA_Const::MEMBERPRESS_MEMBERSHIP_POST_TYPE, 'post_status' => 'publish' ) );

		foreach ( $products as $level ) {
			$levels[] = array(
				'id'   => $level->ID,
				'name' => $level->post_title,
			);
		}

		return $levels;
	}

	/**
	 *  Return an array of levels from wishlist
	 */

	public function get_wish_list_leveles() {

		$tablename = $this->wishlist_table_name( 'options' );
		$levels    = $this->wpdb->get_row( $this->wpdb->prepare(
			"SELECT option_value FROM {$tablename} WHERE option_name = 'wpm_levels'", array()
		) );

		$level_array = array();
		foreach ( $levels as $level ) {
			$level = ( unserialize( $level ) );

			foreach ( $level as $key => $val ) {
				$level_array[] = array(
					'id'   => $key,
					'name' => $val['name'],
				);
			}
		}

		return $level_array;
	}

	/**
	 * Wishlist table integration
	 *
	 * @param $tablename
	 *
	 * @return string
	 */
	public function wishlist_table_name( $tablename ) {
		return $this->wpdb->prefix . 'wlm_' . $tablename;
	}

	/**
	 * Insert Membermouse protection rules in db
	 *
	 * @param $course
	 * @param $item
	 */
	public function insert_membermouse_restrictions( $course, $item ) {
		return;
		$table_name = $this->mm_table_name( 'posts_access' );

		/**
		 * Attach memberships
		 */
		foreach ( $course->membership_ids['membermouse'] as $membership_id ) {
			$this->wpdb->insert(
				$table_name,
				array(
					'post_id'          => $item->ID,
					'access_type'      => 'member_type',
					'access_id'        => $membership_id,
					'days'             => 0,
					'is_smart_content' => 0,
				),
				array(
					'%d',
					'%s',
					'%d',
					'%d',
					'%d',
				)
			);
		}

		/**
		 * Attach Bundles
		 */
		if ( ! empty( $course->bundle_ids['membermouse'] ) && $course->logged_in == 1 ) {
			foreach ( $course->bundle_ids['membermouse'] as $bundle_id ) {
				$this->wpdb->insert(
					$table_name,
					array(
						'post_id'          => $item->ID,
						'access_type'      => 'access_tag',
						'access_id'        => $bundle_id,
						'days'             => 0,
						'is_smart_content' => 0,
					),
					array(
						'%d',
						'%s',
						'%d',
						'%d',
						'%d',
					)
				);
			}
		}
	}

	/**
	 * Protect lessons on sendowl
	 *
	 * @param $course
	 * @param $lesson
	 */
	public function insert_sendowl_restrictions( $course, $lesson ) {
		update_post_meta( $lesson->ID, 'tva_sendowl_restrictions', array(
			'membeships' => $course->membership_ids['sendowl'] ? $course->membership_ids['sendowl'] : array(),
			'bundles'    => isset( $course->bundle_ids['sendowl'] ) ? $course->bundle_ids['sendowl'] : array(),
		) );
	}


	/**
	 * @param $lesson
	 */
	public function delete_sendowl_restrictions( $lesson ) {
		delete_post_meta( $lesson->ID, 'tva_sendowl_restrictions' );
	}

	/**
	 * Delete all restrictions for a given lesson
	 *
	 * @param $lesson
	 */
	public function delete_membermouse_restrictions( $lesson ) {
//		$table_name = $this->mm_table_name( 'posts_access' );
//		$this->wpdb->delete( $table_name, array( 'post_id' => $lesson->ID ) );
	}

	/**
	 * Insert protection rules in db for wishlist
	 *
	 * @param $course
	 * @param $child
	 */
	public function insert_wishlist_restrictions( $course, $child ) {
		$table_name = $this->wishlist_table_name( 'contentlevels' );

		$this->wpdb->insert( $table_name,
			array(
				'content_id' => $child->ID,
				'level_id'   => TVA_Const::WISHLIST_PROTECTION_FLAG,
				'type'       => $child->post_type,
			),
			array(
				'%d',
				'%s',
				'%s',
			)
		);

		/**
		 * Attach memberships
		 */
		foreach ( $course->membership_ids['wishlist'] as $membership_id ) {
			$this->wpdb->insert(
				$table_name,
				array(
					'content_id' => $child->ID,
					'level_id'   => $membership_id,
					'type'       => $child->post_type,
				),
				array(
					'%d',
					'%d',
					'%s',
				)
			);
		}
	}

	/**
	 * Delete all restrictions for a given item
	 */
	public function delete_wishlist_restrictions( $item ) {
		$table_name = $this->wishlist_table_name( 'contentlevels' );
		$this->wpdb->delete( $table_name, array( 'content_id' => $item->ID ) );
	}

	/*
	 * add given post type to wishlist protection settings if is not already added
	 */
	/**
	 * @param array $post_types
	 */
	public function add_post_type_to_wishlist_protection( $post_types = array() ) {
		$table_name      = $this->wishlist_table_name( 'options' );
		$protected_types = $this->wpdb->get_row(
			"SELECT `option_value` FROM `$table_name` WHERE `option_name` = 'protected_custom_post_types'"
		);

		/**
		 * Check if the option which holds protected custom post types exists in wishlist's options
		 */
		if ( null === $protected_types ) {
			$this->wpdb->insert(
				$table_name,
				array(
					'option_name'  => 'protected_custom_post_types',
					'option_value' => '',
					'autoload'     => 'yes',
				),
				array(
					'%s',
					'%s',
					'%s',
				)
			);
		}

		$protected_types_array = $protected_types !== null ? unserialize( $protected_types->option_value ) : array();

		foreach ( $post_types as $post_type ) {
			if ( ! in_array( $post_type, $protected_types_array ) ) {
				$protected_types_array[] = $post_type;

				$this->wpdb->update(
					$table_name,
					array(
						'option_value' => maybe_serialize( $protected_types_array ),
					),
					array(
						'option_name' => 'protected_custom_post_types',
					)
				);
			}
		}
	}

	/**
	 * Insert memebrpress protection rules in db
	 *
	 * @param $course
	 * @param $item
	 *
	 * @throws Exception
	 */
	public function insert_memberpress_restrictions( $course, $item ) {
		$post_data = array(
			'post_title'  => 'A Single Thrive Apprentice: ' . $item->post_title,
			'post_type'   => TVA_Const::MEMBERPRESS_RULES_POST_TYPE,
			'post_status' => 'publish',
		);

		$post_id = wp_insert_post( $post_data, true );

		if ( is_wp_error( $post_id ) ) {
			throw new Exception( $post_id->get_error_message(), 400 );
		}

		MeprRuleAccessCondition::delete_all_by_rule( $post_id );

		$this->update_memberpress_meta( $post_id, $item );

		if ( ! $this->is_mepr_rule_valid( $post_id ) ) {
			wp_delete_post( $post_id );

			return;
		}

		$table_name = $this->wpdb->prefix . 'mepr_rule_access_conditions';
		foreach ( $course->membership_ids['memberpress'] as $membership_id ) {
			$this->wpdb->insert(
				$table_name,
				array(
					'rule_id'          => $post_id,
					'access_type'      => 'membership',
					'access_operator'  => 'is',
					'access_condition' => $membership_id,
				),
				array(
					'%d',
					'%s',
					'%s',
					'%s',
				)
			);
		}
	}

	/**
	 * Make sure that the rule is properly inserted. If by any chance db fails to add the required meta for the rule
	 * it will become global, which is a very bad thing!!!!
	 *
	 * @param $post_id
	 *
	 * @return bool
	 */
	public function is_mepr_rule_valid( $post_id ) {
		$content_id = get_post_meta( $post_id, '_mepr_rules_content', true );

		if ( ! $content_id ) {
			return false;
		}

		return true;
	}

	/**
	 * Delete Posts for rules
	 *
	 * @param $item
	 */
	public function delete_memberpress_restrictions( $item ) {
		$args  = array(
			'post_type'  => TVA_Const::MEMBERPRESS_RULES_POST_TYPE,
			'meta_query' => array(
				array(
					'key'     => '_mepr_rules_content',
					'value'   => $item->ID,
					'compare' => '=',
				),
			),
		);
		$posts = get_posts( $args );

		if ( $posts ) {
			foreach ( $posts as $post ) {
				$post_id = $post->ID;
				wp_delete_post( $post->ID );
				MeprRulesCtrl::delete_access_rules( $post_id );
				MeprProductsCtrl::nullify_records_on_delete( $post_id );

				$models = get_transient( 'mepr_all_models_for_class_meprrule' );
				foreach ( $models as $key => $model ) {
					$rec = json_decode( $model->__toString() );
					if ( $rec->ID === $post_id ) {
						unset( $models[ $key ] );
					}
				}

				set_transient( 'mepr_all_models_for_class_meprrule', $models );

			}
		}
	}

	/**
	 * Update Meta
	 *
	 * @param $post_id
	 * @param $item
	 */
	public function update_memberpress_meta( $post_id, $item ) {
		update_post_meta( $post_id, '_mepr_rules_type', 'single_' . $item->post_type );
		update_post_meta( $post_id, '_mepr_rules_content', $item->ID );
		update_post_meta( $post_id, '_is_mepr_rules_content_regexp', false );

		update_post_meta( $post_id, '_mepr_rules_drip_enabled', false );
		update_post_meta( $post_id, '_mepr_rules_drip_amount', 0 );
		update_post_meta( $post_id, '_mepr_rules_drip_unit', 'days' );
		update_post_meta( $post_id, '_mepr_rules_drip_after_fixed', '' );
		update_post_meta( $post_id, '_mepr_rules_drip_after', 'registers' );
		update_post_meta( $post_id, '_mepr_rules_expires_enabled', false );
		update_post_meta( $post_id, '_mepr_rules_expires_amount', 0 );
		update_post_meta( $post_id, '_mepr_rules_expires_unit', 'days' );
		update_post_meta( $post_id, '_mepr_rules_expires_after', 'registers' );
		update_post_meta( $post_id, '_mepr_rules_expires_after_fixed', '' );
		update_post_meta( $post_id, '_mepr_rules_unauth_excerpt_type', 'default' );
		update_post_meta( $post_id, '_mepr_rules_unauth_excerpt_size', 100 );
		update_post_meta( $post_id, '_mepr_rules_unauth_message_type', 'default' );
		update_post_meta( $post_id, '_mepr_rules_unath_message', '' );
		update_post_meta( $post_id, '_mepr_rules_unath_login', 'default' );
		update_post_meta( $post_id, '_mepr_auto_gen_title', true );
	}

	/**
	 * Protection manager.. main entry point for items protection
	 *
	 * @param $course
	 * @param $tag
	 */
	public function tva_protection_manager( $course, $tag ) {
		return; // This logic is no longer used. On long term we should remove this code
		$tag === 'wishlist' ?
			$this->add_post_type_to_wishlist_protection( array( TVA_Const::LESSON_POST_TYPE, TVA_Const::MODULE_POST_TYPE ) ) : '';

		if ( count( (array) $course->lessons ) > 0 ) {
			$this->bulk_delete_restrictions( (array) $course->lessons, $tag );
			$this->tva_protect_lessons( $course, (array) $course->lessons, $tag );
		} elseif ( count( (array) $course->chapters ) > 0 ) {
			$this->bulk_delete_restrictions( (array) $course->chapters, $tag );
			$this->tva_protect_chapters( $course, (array) $course->chapters, $tag );
		} elseif ( (array) $course->modules > 0 ) {
			$this->bulk_delete_restrictions( (array) $course->modules, $tag );
			$this->tva_protect_modules( $course, $tag );
		}
	}

	/**
	 * Insert protection rules for modules
	 *
	 * @param $course
	 * @param $tag
	 */
	public function tva_protect_modules( $course, $tag ) {
		foreach ( (array) $course->modules as $key => $module ) {
			if ( $module->post_status === 'draft' ) {
				continue;
			}

			$levels = ( ! empty( $course->membership_ids[ $tag ] ) || ( ( isset( $course->bundle_ids[ $tag ] ) ) && ! empty( $course->bundle_ids[ $tag ] ) ) );

			if ( count( (array) $module->chapters ) > 0 ) {
				$first_pb_chapter = $this->tva_protect_chapters( $course, (array) $module->chapters, $tag, $module );

				// we only protect the module if its first published chapter is protected
				if ( $levels && $first_pb_chapter && ! $first_pb_chapter->allowed ) {
					$module->allowed         = false;
					$course->modules[ $key ] = $module;
					$fn                      = 'insert_' . $tag . '_restrictions';
					$this->$fn( $course, $module );
				}
			} elseif ( count( (array) $module->lessons ) > 0 ) {
				$first_pb_lesson = $this->tva_protect_lessons( $course, (array) $module->lessons, $tag, $module );

				// we only protect the module if its first published lesson is protected
				if ( $levels && $first_pb_lesson && ! $first_pb_lesson->allowed ) {
					$module->allowed         = false;
					$course->modules[ $key ] = $module;
					$fn                      = 'insert_' . $tag . '_restrictions';
					$this->$fn( $course, $module );
				}
			}
		}
	}

	/**
	 * Protect chapters
	 *
	 * @param      $course
	 * @param      $chapters
	 * @param null $module
	 *
	 * @return null|WP_Post
	 */
	public function tva_protect_chapters( $course, $chapters, $tag, $module = null ) {
		$first_pb_chapter = null;
		$extra            = $module ? $module->post_status === 'publish' : true;

		foreach ( $chapters as $chapter ) {
			if ( $chapter->post_status === 'draft' ) {
				continue;
			}

			if ( ! $first_pb_chapter ) {
				$first_pb_chapter = $chapter;
			}

			$first_pb_lesson = $this->tva_protect_lessons( $course, $chapter->lessons, $tag, $extra ? $chapter : null );
			$levels          = ( ! empty( $course->membership_ids[ $tag ] ) || ( ( isset( $course->bundle_ids[ $tag ] ) ) && ! empty( $course->bundle_ids[ $tag ] ) ) );
			/**
			 * we only protect the chapter if its first published lesson need to be protected
			 * and its module parent is published
			 */
			if ( $levels && ( $course->logged_in == 1 ) && $first_pb_lesson && ! $first_pb_lesson->allowed && $extra ) {
				$chapter->allowed = false; //just for internal use
				$fn               = 'insert_' . $tag . '_restrictions';

				$this->$fn( $course, $chapter );
			}
		}


		return $first_pb_chapter;
	}

	/**
	 * Protect lessons
	 *
	 * @param      $course
	 * @param      $lessons
	 * @param null $parent
	 *
	 * @return mixed|null
	 */
	public function tva_protect_lessons( $course, $lessons, $tag, $parent = null ) {
		$first_pb_lesson = null;
		$extra           = $parent ? $parent->post_status === 'publish' : true;

		foreach ( (array) $lessons as $key => $lesson ) {
			if ( ! $first_pb_lesson && $lesson->post_status === 'publish' ) {
				$first_pb_lesson = $lesson;
			}

			$levels = ( ! empty( $course->membership_ids[ $tag ] ) || ( ( isset( $course->bundle_ids[ $tag ] ) ) && ! empty( $course->bundle_ids[ $tag ] ) ) );

			/**
			 * We only protect the lesson if:
			 * - its parent chapter is published, if has one
			 * - parent module of its parent chapter is published if has one
			 * - its course order is higher then excluded lesson
			 */
			if ( $levels && $course->logged_in == 1 && $lesson->post_status == 'publish' && ( $lesson->course_order >= $course->excluded ) && $extra ) {
				$lesson->allowed = false;
				$lessons[ $key ] = $lessons;
				$fn              = 'insert_' . $tag . '_restrictions';
				$this->$fn( $course, $lesson );
			}
		}

		return $first_pb_lesson;
	}

	/**
	 * Delete all restrictions for all items
	 *
	 * @param $items
	 */
	public function bulk_delete_restrictions( $items, $tag ) {
		$fn = 'delete_' . $tag . '_restrictions';
		foreach ( $items as $key => $child ) {
			$this->$fn( $child );

			if ( $child->post_type === TVA_Const::MODULE_POST_TYPE ) {
				if ( count( (array) $child->chapters ) > 0 ) {

					foreach ( (array) $child->chapters as $chapter ) {
						$this->$fn( $chapter );

						foreach ( $chapter->lessons as $lesson ) {
							$this->$fn( $lesson );
						}
					}
				} elseif ( count( (array) $child->lessons ) > 0 ) {
					foreach ( $child->lessons as $lesson ) {
						$this->$fn( $lesson );
					}
				}
			} elseif ( $child->post_type === TVA_Const::CHAPTER_POST_TYPE ) {

				foreach ( $child->lessons as $lesson ) {
					$this->$fn( $lesson );
				}
			}
		}
	}

	public function tva_handle_excluded_content( $post, $allowed, $excluded ) {
		if ( ! $allowed ) {
			if ( ( $post->post_type === TVA_Const::LESSON_POST_TYPE ) && ( (int) $post->course_order < (int) $excluded ) ) {
				$allowed = true;
			}

			if ( $post->post_type === TVA_Const::MODULE_POST_TYPE ) {
				$first_lesson = count( $post->chapters ) > 0 ? $post->chapters[0]->lessons[0] : $post->lessons[0];
				$allowed      = (int) $first_lesson->course_order < (int) $excluded;
			}
		}

		return $allowed;
	}

	/**
	 * @param $post
	 *
	 * @return bool
	 */
	public function tva_handle_membermouse_protection( $post, $excluded ) {
		return;
		$allowed = false;
		if ( class_exists( 'MM_User' ) && is_user_logged_in() ) {
			$table_name          = $this->mm_table_name( 'posts_access' );
			$post_levels         = $this->wpdb->get_results( $this->wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE post_id = %d AND `access_type` = %s", array(
					'post_id'     => $post->ID,
					'access_type' => 'member_type',
				)
			) );
			$post_bundles        = $this->wpdb->get_results( $this->wpdb->prepare(
				"SELECT * FROM {$table_name} WHERE post_id = %d AND `access_type` = %s", array(
					'post_id'     => $post->ID,
					'access_type' => 'access_tag',
				)
			) );
			$user_id             = get_current_user_id();
			$mm_user             = new MM_User( $user_id );
			$user_membership_ids = $mm_user->getMembershipId();
			$user_bundles        = $mm_user->getAppliedBundles();
			$membership_ids      = wp_list_pluck( $post_levels, 'access_id' );
			$bundle_ids          = wp_list_pluck( $post_bundles, 'access_id' );
			$user_bundle_ids     = array();

			foreach ( $user_bundles as $bundle ) {
				$user_bundle_ids[] = $bundle->getBundleId();
			}

			$has_correct_bundle = array_intersect( $user_bundle_ids, $bundle_ids );
			$allowed            = in_array( $user_membership_ids, $membership_ids ) || ! empty( $has_correct_bundle );
		}

		return $this->tva_handle_excluded_content( $post, $allowed, $excluded );
	}


	/**
	 * @param $post
	 *
	 * @return bool
	 */
	public function tva_handle_memberpress_protection( $post, $excluded ) {
		$allowed = class_exists( 'MeprRule' ) ? ! MeprRule::is_locked( $post ) : false;

		return $this->tva_handle_excluded_content( $post, $allowed, $excluded );
	}


	/**
	 * @param $post
	 *
	 * @return bool
	 */
	public function tva_handle_wishlist_protection( $post, $excluded ) {
		$allowed       = false;
		$content_table = $this->wishlist_table_name( 'contentlevels' );
		$user_table    = $this->wishlist_table_name( 'userlevels' );
		$post_levels   = $this->wpdb->get_results( $this->wpdb->prepare(
			"SELECT level_id FROM {$content_table} WHERE content_id = %d", array( $post->ID )
		) );
		$user_id       = get_current_user_id();
		$user_levels   = $this->wpdb->get_results( $this->wpdb->prepare(
			"SELECT level_id FROM {$user_table} WHERE user_id = %d", array( $user_id )
		) );
		$user_levels   = wp_list_pluck( $user_levels, 'level_id' );

		if ( empty( $post_levels ) ) {
			$allowed = true;
		} else {
			foreach ( $post_levels as $level ) {
				if ( isset( $level->level_id ) && ( in_array( $level->level_id, $user_levels ) ) ) {
					$allowed = true;
					break;
				}
			}
		}

		return $this->tva_handle_excluded_content( $post, $allowed, $excluded );
	}


	/**
	 * @param $post
	 *
	 * @return bool
	 */
	public function tva_handle_sendowl_protection( $post, $excluded ) {
		$allowed      = false;
		$restrictions = get_post_meta( $post->ID, 'tva_sendowl_restrictions', true );

		if ( empty( $restrictions ) ) {
			return true;
		}

		$user_id = get_current_user_id();

		if ( ! empty( $restrictions ) && ! $user_id ) {
			return false;
		}

		$tva_user         = new TVA_User( $user_id );
		$completed_orders = $tva_user->get_orders_by_status( TVA_Const::STATUS_COMPLETED );

		foreach ( $completed_orders as $order ) {
			/** @var TVA_Order $order */
			$order_items = $order->get_order_items();

			foreach ( $order_items as $order_item ) {
				/** @var TVA_Order_Item $order_item */
				$product_id = $order_item->get_product_id();
				if ( is_array( $restrictions ) && ( in_array( $product_id, $restrictions['membeships'] ) || in_array( $product_id, $restrictions['bundles'] ) ) ) {
					$allowed = true;
					break;
				}
			}
		}

		return $this->tva_handle_excluded_content( $post, $allowed, $excluded );
	}
}

/**
 * Set the db object
 */
$tva_db = new TVA_Db();
