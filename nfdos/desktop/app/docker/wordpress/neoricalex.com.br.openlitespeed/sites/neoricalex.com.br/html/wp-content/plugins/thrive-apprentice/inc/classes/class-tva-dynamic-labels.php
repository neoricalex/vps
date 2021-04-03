<?php

class TVA_Dynamic_Labels {
	const OPT = 'tva_dynamic_labels';

	/**
	 * Holds a cache of logged user's relation with an array of courses
	 *
	 * @var array
	 */
	protected static $USER_COURSE_CACHE = array();

	/**
	 * Available options for users that have access to the course
	 *
	 * @return array
	 */
	public static function get_user_switch_contexts() {
		return array(
			'not_started' => __( 'If user has access but not started the course', TVA_Const::T ),
			'in_progress' => __( 'If user has started the course', TVA_Const::T ),
			'finished'    => __( 'If user has finished the course', TVA_Const::T ),
		);
	}

	/**
	 * Available options for CTA buttons depending on user context and relation to the course
	 *
	 * @return array
	 */
	public static function get_cta_contexts() {
		return array(
			'view'               => __( 'View course details', TVA_Const::T ),
			'not_started'        => __( 'If user has access to the course but not started it yet', TVA_Const::T ),
			'in_progress'        => __( 'If user is midway through a course', TVA_Const::T ),
			'finished'           => __( 'If user has finished a course', TVA_Const::T ),
			'needs_registration' => __( 'If user must register to access the course', TVA_Const::T ),
			'needs_purchase'     => __( 'If user must purchase the course to get access', TVA_Const::T ),
		);
	}

	/**
	 * Store the settings to the wp_options table
	 *
	 * @param array $settings
	 *
	 * @return array the saved array of settings
	 */
	public static function save( $settings ) {
		$defaults = static::defaults();
		$settings = array_replace_recursive( $defaults, $settings );

		/**
		 * Make sure no extra keys are saved.
		 */
		$settings = array_intersect_key( $settings, $defaults );

		update_option( static::OPT, $settings );

		return $settings;
	}

	/**
	 * Get the stored settings, with some default values
	 *
	 * @param string $key allows retrieving only a single setting
	 *
	 * @return bool|mixed|void
	 */
	public static function get( $key = null ) {
		$defaults = static::defaults();

		$settings = get_option( static::OPT, $defaults );

		if ( isset( $key ) ) {
			return isset( $settings[ $key ] ) ? $settings[ $key ] : null;
		}

		return $settings;
	}

	/**
	 * Check if a dynamic label applies to the $course
	 * If nothing found, just output the regular selected label
	 *
	 * @param WP_Term|TVA_Course_V2 $course
	 *
	 * @return null|array containing label ID, color and title
	 */
	public static function get_course_label( $course ) {
		if ( $course instanceof WP_Term ) {
			$course = new TVA_Course_V2( $course );
		}

		/**
		 * No access restriction labels needed on public courses
		 */
		if ( ! $course->is_private() && ! get_current_user_id() ) {
			return null;
		}

		$settings = static::get();

		if ( ! empty( $settings['switch_labels'] ) && get_current_user_id() && tva_access_manager()->has_access_to_course( $course ) ) {
			/* switch label based on user's relation to the course */
			/* check if user has started the course */
			$label_key = static::get_user_course_context( $course );

			/**
			 * This should always exist, however, just to make sure no warnings will be generated, perform this extra check
			 */
			$label = isset( $settings['labels'][ $label_key ] ) ? $settings['labels'][ $label_key ] : array();

			if ( empty( $label ) || $label['opt'] === 'hide' ) {
				return null;
			}

			/**
			 * For public courses, show the "In progress" or "Completed" labels for logged users where possible
			 * Do not show the "Not started yet" label
			 */
			$should_hide = $label_key !== 'in_progress' && $label_key !== 'finished';
			if ( ! $course->is_private() && ( $should_hide || $label['opt'] !== 'show' ) ) {
				return null;
			}

			if ( $label['opt'] === 'show' ) {
				$label['ID'] = $label_key;

				return $label;
			}
		}

		/* if course is public at this point, we should not display any label on it */
		if ( ! $course->is_private() ) {
			return null;
		}

		/* at this point, return the selected course label - no dynamic label found, or the dynamic label has the "nochange" option selected. */

		return tva_get_labels( array( 'ID' => $course->label ) );
	}

	/**
	 * Get the course CTA button text
	 *
	 * @param WP_Term|TVA_Course_V2 $course
	 * @param string                $context
	 * @param string                $default string to use in case no suitable CTA text is found
	 *
	 * @return mixed
	 */
	public static function get_course_cta( $course, $context = 'list', $default = null ) {
		/**
		 * The current implementation only supports the `list` $context. Moving forward, other contexts will be added.
		 * on the list of courses, the default text should be the one defined for 'view'.
		 * only possible options are:
		 *      - view
		 *      - not_started
		 *      - in_progress
		 *      - finished
		 */
		$button_key = 'view';
		if ( $context === 'list' ) {
			if ( get_current_user_id() && tva_access_manager()->has_access_to_course( $course ) ) {
				$button_key = static::get_user_course_context( $course );
			} else {
				$button_key = 'view';
			}
		}

		return static::get_cta_label( $button_key, $default );
	}

	/**
	 * Get the logged user's relation to the course. This does not check for access. To be used when user has access to a course
	 *
	 * @param WP_Term|TVA_Course_V2 $course
	 *
	 * @return string 'not_started' / 'in_progress' / 'finished'
	 */
	public static function get_user_course_context( $course ) {
		if ( $course instanceof WP_Term ) {
			$course = new TVA_Course_V2( $course );
		}

		$course_id = $course->get_id();
		if ( ! isset( static::$USER_COURSE_CACHE[ $course_id ] ) ) {
			$lessons_learnt = TVA_Shortcodes::get_learned_lessons();

			if ( empty( $lessons_learnt[ $course_id ] ) ) {
				static::$USER_COURSE_CACHE[ $course_id ] = 'not_started';
			} else {
				static::$USER_COURSE_CACHE[ $course_id ] = count( $lessons_learnt[ $course->get_id() ] ) === $course->published_lessons_count ? 'finished' : 'in_progress';
			}
		}

		return static::$USER_COURSE_CACHE[ $course_id ];
	}

	/**
	 * Output the CSS required for each dynamic label
	 */
	public static function output_css() {
		$options = static::get();
		if ( ! empty( $options['switch_labels'] ) ) {
			foreach ( $options['labels'] as $id => $label ) {
				echo sprintf(
					'.tva_members_only-%1$s { background: %2$s }.tva_members_only-%1$s:before { border-color: %2$s transparent transparent transparent }',
					$id,
					$label['color']
				);
			}
		}
	}

	/**
	 * Return the CTA set for a user context ($key)
	 *
	 * @param string $key     identifier for the value
	 * @param null   $default default value to return if nothing is found
	 *
	 * @return string
	 */
	public static function get_cta_label( $key, $default = null ) {
		$buttons = static::get( 'buttons' );

		if ( empty( $default ) ) {
			$default = $buttons['view']['title'];
		}

		return isset( $buttons[ $key ]['title'] ) ? $buttons[ $key ]['title'] : $default;
	}

	/**
	 * Get the default values for dynamic settings
	 *
	 * @return array
	 */
	public static function defaults() {
		//backwards compat -> "Start course" should read from an existing setting
		$template = TVA_Setting::get( 'template' );

		$defaults = array(
			'start_course' => isset( $template['start_course'] ) ? $template['start_course'] : TVA_Const::TVA_START,
		);

		return array(
			'switch_labels' => false,
			'labels'        => array(
				'not_started' => array(
					'opt'   => 'show',
					'title' => __( 'Not started yet', TVA_Const::T ),
					'color' => '#58a545',
				),
				'in_progress' => array(
					'opt'   => 'show',
					'title' => __( 'In progress', TVA_Const::T ),
					'color' => '#58a545',
				),
				'finished'    => array(
					'opt'   => 'show',
					'title' => __( 'Course complete!', TVA_Const::T ),
					'color' => '#58a545',
				),
			),
			'buttons'       => array(
				'view'               => array(
					'title' => __( 'Learn more', TVA_Const::T ),
				),
				'not_started'        => array(
					'title' => $defaults['start_course'],
				),
				'in_progress'        => array(
					'title' => __( 'Continue course', TVA_Const::T ),
				),
				'finished'           => array(
					'title' => __( 'Revisit the course', TVA_Const::T ),
				),
				'needs_registration' => array(
					'title' => __( 'Register now', TVA_Const::T ),
				),
				'needs_purchase'     => array(
					'title' => __( 'Get instant access', TVA_Const::T ),
				),
			),
		);
	}
}
