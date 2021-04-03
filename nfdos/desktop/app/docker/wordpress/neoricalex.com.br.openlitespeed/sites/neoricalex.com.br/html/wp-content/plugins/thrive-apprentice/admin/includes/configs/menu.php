<?php

$index_page = tva_get_settings_manager()->factory( 'index_page' )->get_value();

return array(
	'wizard'          => array(
		'slug'   => 'wizard',
		'route'  => '#wizard',
		'hidden' => true,
		'icon'   => 'icon-wizard',
		'label'  => esc_html__( 'Wizard', 'thrive-apprentice' ),
	),
	'courses'         => array(
		'slug'     => 'courses',
		'route'    => '#courses',
		'icon'     => 'icon-courses',
		'label'    => esc_html__( 'Courses', 'thrive-apprentice' ),
		'sections' => array(
			array(
				'expanded' => true,
				'slug'     => 'settings',
				'label'    => esc_html__( 'Settings', 'thrive-apprentice' ),
			),
		),
		'items'    => array(
			'courses'       => array(
				'slug'  => 'courses',
				'route' => '#courses',
				'icon'  => 'all-courses-icon',
				'label' => esc_html__( 'All courses', 'thrive-apprentice' ),
			),
			'course-topics' => array(
				'slug'    => 'topics',
				'section' => 'settings',
				'route'   => '#courses/topics',
				'icon'    => 'course-topics-icon',
				'label'   => esc_html__( 'Course topics', 'thrive-apprentice' ),
			),
			'course-labels' => array(
				'slug'    => 'labels',
				'route'   => '#courses/labels',
				'section' => 'settings',
				'icon'    => 'course-labels-icon',
				'label'   => esc_html__( 'Dynamic labels', 'thrive-apprentice' ),
			),
		),
	),
	'customers'       => array(
		'slug'  => 'customers',
		'route' => '#customers',
		'icon'  => 'icon-customers',
		'label' => esc_html__( 'Customers', 'thrive-apprentice' ),
		'items' => array(),
	),
	'design'          => array(
		'slug'  => 'design',
		'route' => '#design',
		'icon'  => 'icon-design',
		'label' => esc_html__( 'Design', 'thrive-apprentice' ),
	),
	'settings'        => array(
		'slug'  => 'settings',
		'route' => '#settings',
		'icon'  => 'icon-settings',
		'label' => esc_html__( 'Settings', 'thrive-apprentice' ),
		'items' => array(
			'settings'        => array(
				'slug'  => 'settings',
				'route' => '#settings',
				'icon'  => 'settings-icon',
				'label' => esc_html__( 'General settings', 'thrive-apprentice' ),
			),
			'sendowl'         => array(
				'slug'     => 'sendowl',
				'route'    => '#settings/sendowl',
				'disabled' => TVA_SendOwl::is_connected() ? 0 : esc_attr__( 'You need to have active SendOwl API Connection to use this menu.', 'thrive-apprentice' ),
				'icon'     => 'sendowl-logo',
				'label'    => esc_html__( 'SendOwl', 'thrive-apprentice' ),
			),
			'email-templates' => array(
				'slug'  => 'email-templates',
				'route' => '#settings/email-templates',
				'icon'  => 'email-templates-icon',
				'label' => esc_html__( 'Email templates', 'thrive-apprentice' ),
			),
			'login-page'      => array(
				'slug'  => 'login-page',
				'route' => '#settings/login-page',
				'icon'  => 'login-icon',
				'label' => esc_html( 'Login & registration page', 'thrive-apprentice' ),
			),
			'logs'            => array(
				'slug'  => 'logs',
				'route' => '#settings/logs',
				'icon'  => 'logs-icon',
				'label' => esc_html__( 'Logs', 'thrive-apprentice' ),
			),
			'api-keys'        => array(
				'slug'  => 'api-keys',
				'route' => '#settings/api-keys',
				'icon'  => 'api-key-icon',
				'label' => esc_html__( 'Api keys', 'thrive-apprentice' ),
			),
		),
	),
	'course-homepage' => array(
		'slug'     => 'course-homepage',
		'href'     => tva_get_settings_manager()->factory( 'index_page' )->get_link(),
		'disabled' => empty( $index_page ) ? esc_attr__( 'You need to have defined a course page', 'thrive-apprentice' ) : 0,
		'icon'     => 'icon-eye',
		'label'    => esc_html__( 'Preview', 'thrive-apprentice' ),
		'items'    => array(),
	),
);
