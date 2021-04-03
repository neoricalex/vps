<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-university
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden
}

/**
 * Add TA Product to Thrive Dashboard
 */
add_filter( 'tve_dash_installed_products', 'tva_add_to_dashboard' );

/**
 * Clean the iframe of unused data
 */
add_action( 'wp', 'tva_clean_inner_frame' );

/**
 * Enqueue front-end scripts
 */
add_action( 'wp_enqueue_scripts', 'tva_frontend_enqueue_scripts', 100 );

/**
 * Add the template styles to the head
 */
add_action( 'wp_head', 'tva_add_head_styles' );

/**
 * Register required post types
 */
add_action( 'init', 'tva_init' );

/**
 * On template redirect, fire the TVA HOOKS needed by the third party developers
 */
add_action( 'template_redirect', 'tva_hooks' );

/**
 * Create the initial rest routes
 */
add_action( 'rest_api_init', 'tva_create_initial_rest_routes' );

/**
 * After plugin is loaded load ThriveDashboard Section
 */
add_action( 'plugins_loaded', 'tva_load_dash_version' );

/**
 * include the correct template
 */
add_action( 'template_include', 'tva_template', 99, 1 );

/**
 * Redirect users in specific cases
 */
add_filter( 'template_redirect', 'tva_template_redirect' );

/**
 * Restrict access to demo courses
 */
add_filter( 'template_redirect', 'tva_redirect_if_private' );

/**
 * Modifies the admin bar before render by hiding some pages
 */
add_action( 'wp_before_admin_bar_render', 'tva_modify_admin_bar_before_render', PHP_INT_MAX );

/**
 * Create a sidebar for apprentice
 */
add_action( 'widgets_init', 'tva_widgets_init' );

/**
 * change the taxonomy query to order the lessons
 */
add_action( 'pre_get_posts', 'tva_pre_get_posts' );
add_action( 'pre_get_posts', 'tva_exclude_posts_from_search' );

/**
 * Change the next/posts links attributes
 */
add_filter( 'next_post_link', 'tva_next_posts_link_attributes' );
add_filter( 'previous_post_link', 'tva_prev_posts_link_attributes' );

/**
 * Re-construct all the next post and previous post queries
 */
add_filter( 'get_next_post_where', 'tva_get_where_post_type_adjacent_post', 10, 5 );
add_filter( 'get_previous_post_where', 'tva_get_where_post_type_adjacent_post', 10, 5 );
add_filter( 'get_next_post_sort', 'tva_get_next_sort_post_type_adjacent_post', 10, 2 );
add_filter( 'get_previous_post_sort', 'tva_get_prev_sort_post_type_adjacent_post', 10, 2 );
add_filter( 'get_next_post_join', 'tva_post_join', 10, 5 );
add_filter( 'get_previous_post_join', 'tva_post_join', 10, 5 );

/**
 * initialize the update checker here because the required classes are loaded by dashboard at plugins_loaded
 */
add_action( 'init', 'tva_update_checker' );

add_action( 'thrive_dashboard_loaded', 'tva_dashboard_loaded' );

/**
 * Add content builder admin bar options
 */
add_action( 'admin_bar_menu', 'tva_admin_bar', 101 );

/**
 * Register Menu
 */

add_action( 'init', 'tva_register_menu' );

/**
 * Hook into the wordpress account creation action
 */
add_action( 'tvd_after_create_wordpress_account', 'tva_perform_auto_login', 10, 2 );

/**
 * Filter into MemberMouse page access [ deactivated on request ]
 */
//add_filter( 'template_redirect', 'tva_block_mm_course_access' );

/**
 * Apprentice registration form
 */
add_action( 'register_form', 'tva_build_registration_page_html' );

/**
 * Rregister user
 */
add_action( 'tva_register', 'tva_register_user' );

/**
 * Redirect after user registration
 */
add_action( 'wp_login', 'tva_redirect_user' );

/**
 * Hide Apprentice register page from admin
 */
add_filter( 'parse_query', 'tva_hide_default_register_page' );

/**
 * Process comments on course page
 */
add_filter( 'preprocess_comment', 'tva_process_comment_data' );

/**
 * Count course copmments
 */
add_filter( 'get_comments_number', 'tva_count_course_comments', 10, 1 );

/**
 * Force disqus to grab course data when a comment is posted
 */
add_action( 'wp_footer', 'tva_add_course_to_disqus', 1000 );

/**
 * Load disqus comment template on courses page
 */
add_filter( 'comments_template', 'tva_handle_comments_template', 1000 );

/**
 * Handle comment notify email
 */
add_filter( 'comment_moderation_text', 'tva_comment_moderation_text', 10, 2 );

/**
 * Handle comment notify email head
 */
add_filter( 'comment_moderation_subject', 'tva_comment_moderation_subject', 10, 2 );

/**
 * Add facebook SDK
 */
add_action( 'wp_head', 'tva_load_fb_sdk' );

/**
 * Add Facebook html, It is also used in Thrive themes to make the comment template compatible with apprentice
 */
add_action( 'tva_on_fb_comments', 'tva_load_fb_comment_html' );

/**
 * Replace the hidden post permalink with term urlr
 */
add_filter( 'post_type_link', 'tva_on_comment_course_permalink', 10, 3 );
//
///**
// * Replace hidden post edit url with term's permalink
// */
add_filter( 'get_edit_post_link', 'tva_on_comment_course_url', 10, 2 );
//
///**
// * Get the term url by its comment
// */
add_filter( 'get_comment_link', 'tva_get_term_url_by_comment', 1000, 2 );

/**
 * Get term title by its comment
 */
add_filter( 'the_title', 'tva_on_comment_course_title', 10, 2 );

add_filter( 'comments_open', 'tva_ensure_comments_open' );

///////////////////////////////////////////////////////////////
/// 				THRIVE COMMENTS HOOKS                   ///
/// ///////////////////////////////////////////////////////////

/**
 * Load TC template
 */
add_filter( 'tcm_show_comments', 'tva_load_tc_template' );

/**
 * Get comments for tc in frontend
 */
add_filter( 'tcm_get_comments', 'tva_tcm_get_comments', 10, 2 );

/**
 * Get course data for tc in frontend
 */
add_filter( 'tcm_comments_localization', 'tva_tcm_comments_localization' );

/**
 * Add comment meta for new comments in forntend
 */
add_filter( 'tcm_comments_fields', 'tva_tcm_comments_fields', 10, 2 );

/**
 * TC: Get comment's course in admin moderation
 */
add_filter( 'tcm_get_post_for_comment', 'tva_tcm_get_course_for_comment', 10, 2 );

/**
 * TC: Add courses to autocomplete list in moderation section
 */
add_filter( 'tcm_posts_autocomplete', 'tva_tcm_posts_autocomplete', 10, 2 );

/**
 * TC: Add comments from courses to moderation list in wp-admin
 */
add_filter( 'rest_comment_query', 'tva_rest_comment_query', 1000, 2 );

/**
 * TC: Handle new child comments created in comments moderation
 */
add_filter( 'rest_preprocess_comment', 'tva_rest_preprocess_comment', 10, 2 );

/**
 * TC: Handle new comments created with tc in frontend
 */
add_filter( 'tcm_rest_moderation_response', 'tva_comment_rest_moderation_response' );

/**
 * TC: Count comments in frontend for courses
 */
add_filter( 'tcm_comment_count', 'tva_tcm_comment_count', 10, 2 );

/**
 * TC: Handle featured comments
 */
add_filter( 'tcm_get_featured_comments', 'tva_tcm_get_featured_comments', 10, 2 );

/**
 * Subscribe user to comment
 */
add_action( 'tcm_post_subscribe', 'tva_tcm_post_subscribe' );

/**
 * Unsubscribe user from comment
 */
add_action( 'tcm_post_unsubscribe', 'tva_tcm_post_unsubscribe' );

/**
 * Get term url in TC mail template
 */
add_filter( 'tcm_comment_notification_email', 'tva_tcm_get_term_url', 10, 2 );

/**
 * Get term subscribers
 */
add_filter( 'tcm_post_subscribers', 'tva_get_term_subscribers', 10, 2 );

/**
 * Count comments for TC
 */
add_filter( 'tcm_user_comment_count', 'tva_tcm_user_comment_count', 10, 2 );

/**
 * Most popular courses
 */
add_filter( 'tcm_most_popular_posts', 'tva_tcm_most_popular_posts', 10, 3 );

/**
 * Add courses to TC meta filters
 */
add_filter( 'tcm_reports_featured_query', 'tva_tcm_reports_featured_query', 10, 2 );

/**
 * Add courses to TC reports filters
 */
add_filter( 'tcm_reports_post_filter', 'tva_tcm_reports_post_filter', 10, 2 );

/**
 * Add terms to TC comments reports
 */
add_filter( 'tcm_reports_extra_filter', 'tva_tcm_reports_extra_filter', 10, 2 );

/**
 * Count the comments in TC admin moderation header.
 */
add_filter( 'tcm_header_comment_count', 'tva_tcm_header_comment_count', 10, 2 );

/**
 * Add terms to TC voting charts
 */
add_filter( 'tcm_reports_votes_extra_filter', 'tva_tcm_reports_votes_extra_filter', 10, 2 );

/**
 * Process comment obj after save
 */
add_filter( 'tcm_comment_after_save', 'tva_tcm_comment_after_save' );

/**
 * Count unreplied comments
 */
add_filter( 'tcm_get_unreplied_args', 'tva_tcm_get_unreplied_args', 10, 2 );

/**
 * Filter comment delegate query
 */
add_filter( 'tcm_comment_delegate', 'tva_tcm_comment_delegate', 10, 2 );

/**
 * Expand TC delegate meta query, add a new clause
 */
add_filter( 'tcm_delegate_rest_meta_query', 'tva_tcm_delegate_rest_meta_query', 10, 2 );

/**
 * Add comments from courses in TC
 */
add_filter( 'tcm_delegate_extra_where', 'tva_tcm_delegate_extra_where', 10, 5 );

/**
 * Expand TC delegate query, add a join clause
 */
add_filter( 'tcm_delegate_extra_join', 'tva_tcm_delegate_extra_join' );

add_filter( 'tcm_close_comments', 'tva_tcm_close_comments' );

add_filter( 'tcm_most_upvoted', 'tva_tcm_most_upvoted' );

add_filter( 'tcm_get_post', 'tva_tcm_get_post' );

///////////////////////////////////////////////////////////////
/// 			    END THRIVE COMMENTS HOOKS               ///
/// ///////////////////////////////////////////////////////////

/**
 * Add our post types
 */
add_filter( 'tcb_autocomplete_selected_post_types', 'tva_add_post_types' );

/**
 * Add our courses to the results
 */
add_filter( 'tcb_autocomplete_returned_posts', 'tva_add_courses_to_results', 10, 2 );

add_filter( 'tcm_privacy_post_types', 'tva_tcm_privacy_post_types' );

add_filter( 'tcm_label_privacy_text', 'tva_tcm_label_privacy_text', 10, 2 );

add_action( 'wp_footer', 'add_frontend_svg_file' );

/* adds the svg file containing all the svg icons for the admin pages */
add_action( 'admin_head', 'add_frontend_svg_file' );

add_action( 'template_redirect', 'tva_home_redirect' );

add_filter( 'mm_bypass_content_protection', 'tva_custom_content_protection' );
add_filter( 'mm_bypass_content_protection', 'tva_mm_filter_access' );

add_filter( 'wishlistmember_login_redirect_override', 'tva_wishlistmember_login_redirect_override' );

add_filter( 'login_redirect', 'tva_login_redirect', 1, 3 );

add_action( 'wp_login_errors', 'tva_login_form_redirect', 10, 2 );

///////////////////////////////////////////////////////////////////
///                    TOP INTEGRATION                       //////
///////////////////////////////////////////////////////////////////

add_filter( 'thrive_ab_monetary_services', 'tva_filter_ab_monetary_services' );

add_filter( 'thrive_ab_pre_impression', 'tva_ab_event_saved' );

add_filter( 'tva_order_tag_data', 'tva_filter_order_tag_data' );

add_action( 'tva_after_sendowl_process_notification', 'tva_try_do_top_conversion', 10, 2 );

/**
 * Skip tcb license check
 */
add_filter( 'tcb_skip_license_check', 'tva_tcb_skip_license_check' );

/**
 * Exclude demo posts generated by TA from sitemap generated by Yoast
 */
add_filter( 'wpseo_exclude_from_sitemap_by_post_ids', 'tva_wpseo_exclude_from_sitemap_by_post_ids' );

/**
 * Exclude the url of private courses from sitemap generated by Yoast
 */
add_filter( 'wpseo_sitemap_entry', 'tva_wpseo_sitemap_entry', 10, 3 );

add_filter( 'thrive_leads_skip_request', 'tva_thrive_leads_skip_request' );

add_action( 'tva_after_save_course', 'tva_update_yoast_term_tax_meta', 10, 2 );

add_filter( 'tcb_has_templates_tab', 'tva_tcb_has_templates_tab' );

add_action( 'init', 'tva_load_plugin_textdomain' );

add_action( 'tcb_post_login_actions', 'tva_tcb_post_login_actions' );

add_action( 'wp_enqueue_scripts', 'tva_tcb_frontend_enqueue_scripts', 1000 );

add_filter( 'tcb_after_user_logged_in', 'tva_tcb_after_user_logged_in' );

add_filter( 'thrive_theme_ignore_post_types', 'tva_theme_ignore_post_types', 10, 2 );

add_filter( 'thrive_theme_get_posts_args', 'tva_theme_exclude_ta_pages' );

add_action( 'pre_get_document_title', 'tva_pre_get_document_title', 99 );

add_action( 'tcb_filter_landing_page_templates', 'tva_tcb_filter_landing_page_templates' );

add_action( 'tcb_allow_central_style_panel', 'tva_tcb_allow_central_style_panel' );

/**
 * Filter routes for WP-API-SWAGGER to list just some of them
 */
add_filter( 'rest_endpoints', 'tva_filter_endpoints_for_thrive_cart' );

/**
 * WP-API-SWAGGER uses Basic Authorization
 * - but we overwrite its logic with TVA Token
 */
add_filter( 'authenticate', 'tva_filter_authenticate', 100, 3 );

add_action( 'thrive_theme_shortcode_prefixes', 'tva_thrive_theme_shortcode_prefixes' );

add_action( 'thrive_theme_allow_page_edit', 'tva_thrive_theme_allow_page_edit' );

add_action( 'tcm_post_url', 'tva_tcm_post_url' );

add_filter( 'tve_allowed_post_type', 'tva_disable_lesson_for_ab_testing', 1000, 2 );

add_filter( 'tve_link_autocomplete_post_types', 'tva_add_apprentice_post_types' );

add_filter( 'tve_link_autocomplete_default_post_types', 'tva_default_add_post_types' );

add_filter( 'thrive_theme_template_content', 'tva_thrive_theme_template_content', 10, 2 );

add_filter( 'tcb_lazy_load_data', 'tva_tcb_lazy_load_data', 10, 3 );

add_filter( 'tcb_post_visibility_options_availability', 'tva_post_visibility_options' );

add_filter( 'thrive_dashboard_extra_user_data', 'tva_extra_user_data' );

add_action( 'template_include', 'tva_set_user_data', 99, 1 );
