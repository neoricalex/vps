const Constants = require( '../constants' ),
	hooks = {
		actions: {
			/**
			 * After a template is changed from the cloud templates lightbox, we need to populate the empty shortcodes
			 *
			 * @param {Object} data
			 * @param {jQuery} $element
			 */
			'tcb.cloud_template.course.after_apply': ( data, $element ) => {
				TVE.froala.handleEmptyShortcodes( $element );
			},
		},
		filters: {
			/**
			 * Added the course type to change the main element data-css
			 *
			 * @param {Array} types
			 *
			 * @return {Array}
			 */
			'tcb.cloud_templates.change_main_wrapper_data_css': ( types = [] ) => {

				types.push( 'course' );

				return types;
			},
			/**
			 * Hooks into the templates download request and injects the Course ID into the ajax params
			 *
			 * @param {Object} ajaxParams
			 *
			 * @return {Object}
			 */
			'tcb.cloud_template_download_params': ajaxParams => {

				if ( TVE.ActiveElement && TVE.ActiveElement.is( Constants.courseIdentifier ) ) {
					ajaxParams.data[ 'course_id' ] = TVE.ActiveElement.attr( 'data-id' );
					ajaxParams.data[ 'display_level' ] = TVE.ActiveElement.attr( 'data-display-level' ) || '';
				}

				return ajaxParams;
			}
		}
	};

module.exports = hooks;
