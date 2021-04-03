const Content = require( '../content' ),
	Constants = require( '../constants' ),
	EditMode = require( '../utils/edit-mode' ),
	/* the element wrappers ( module, chapter, lesson ) and the list wrappers ( module list, chapter list, lesson list ) have no icons */
	dropZonesSelectors = Constants.elements.map( key => `${Content.getDropzoneIdentifier( key )}` ).join( ', ' ) + `,${Content.getDropzoneIdentifier( 'course' )}`,
	noIconsSelector = Constants.elements.map( key => `${Content.getIdentifier( key )}, ${Content.getListIdentifier( key )}` ).join( ', ' ) + `,.${Constants.structureItemIconClass},.${Constants.toggleExpandCollapseIconClass}`,
	/**
	 * @type {Object}
	 */
	hooks = {
		actions: {
			/**
			 * @param {jQuery} $element
			 */
			'tcb_after_cloud_template': $element => {
				if ( $element.is( Constants.courseIdentifier ) ) {
					Content.initCourseSubElements( $element );
				}
			}
		},
		filters: {
			/**
			 * Modifies the translation that is inserted inside the Cloud Templates Modal warning area
			 *
			 * @param translation
			 * @param type
			 *
			 * @return {string}
			 */
			'tcb.cloud_templates.element_name': ( translation, type ) => {

				if ( 'course' === type ) {
					translation = 'Apprentice Lesson List';
				}

				return translation;
			},
			/**
			 * Added tva- prefix to exclude the control excluded classes
			 *
			 * @param {Array} clsPat
			 *
			 * @return {Array}
			 */
			'tcb.content.tcb_cls_pat': ( clsPat = [] ) => {
				clsPat.push( 'tva-' );

				return clsPat;
			},

			/*
			 * Initialize the shortcodes and selectors right after the editor loads.
			 * Note: we use this instead of 'tcb-ready' because 'tcb-ready' triggers too late.
			 */
			'before_editor_events': () => {
				/* TVE.identifier() does not exist this early, so we have to use the raw identifier. */
				TVE.inner.$body.find( Constants.courseIdentifier ).each( ( index, course ) => {
					Content.initCourseSubElements( TVE.inner_$( course ) );
				} );
			},
			/**
			 * @param {jQuery} $content
			 * @param {jQuery} $root
			 * @return {jQuery}
			 */
			'tcb_filter_html_before_save': ( $content, $root ) => {

				/* get_clean_content() is also called when entering the Content Box style picker - we don't do anything here in that scenario */
				if ( ! $root.is( TVE.identifier( 'contentbox' ) ) ) {
					Content.saveCourse( $content );
				}

				return $content;
			},

			/**
			 * @param {String} selectors
			 * @return {String}
			 */
			'tcb.compat.not_wrappable': selectors => {
				/* TVE.identifier( 'course' ) doesn't work because it's called too early here, don't use it! */
				selectors.push( `${Constants.courseIdentifier} *` );

				return selectors;
			},
			/**
			 * Don't display 'save as symbol' anywhere inside Course
			 *
			 * @param {String} selectors
			 * @returns {String}
			 */
			'selectors_no_save': selectors => {
				if ( EditMode.isInsideCourseEditMode() ) {
					selectors += `, ${Constants.courseIdentifier} *`;
				}

				return selectors;
			},
			/**
			 * Don't show any icons for Modules, Chapters and Lessons or their Lists
			 *
			 * @param {String} selectors
			 * @returns {String}
			 */
			'selectors_no_icons': selectors => {
				if ( EditMode.isInsideCourseEditMode() ) {
					selectors += ', ' + noIconsSelector;
				}

				return selectors;
			},
			'selectors_no_expand': selectors => {
				if ( EditMode.isInsideCourseEditMode() ) {
					selectors += `:not(${Content.getDropzoneIdentifier( 'module' )}.tve-state-expanded,${Content.getDropzoneIdentifier( 'chapter' )}.tve-state-expanded)`;
				}

				return selectors;
			},
			'selectors_no_collapse': selectors => {
				if ( EditMode.isInsideCourseEditMode() ) {
					selectors += `:not(${Content.getDropzoneIdentifier( 'module' )}:not(.tve-state-expanded),${Content.getDropzoneIdentifier( 'chapter' )}:not(.tve-state-expanded))`;
				}

				return selectors;
			},
			'selectors_no_delete': selectors => {
				if ( EditMode.isInsideCourseEditMode() ) {
					selectors += `, ${dropZonesSelectors}`;
				}

				return selectors;
			},
			'selectors_no_clone': selectors => {
				if ( EditMode.isInsideCourseEditMode() ) {
					selectors += `, ${dropZonesSelectors}`;
				}

				return selectors;
			},
			/**
			 * Open some custom components by default ( course structure items have dynamic names and a general component, so they don't open by default )
			 *
			 * @param componentKey
			 */
			'tcb.components.expanded_key': componentKey => {
				if ( EditMode.isInsideCourseEditMode() && componentKey && componentKey.includes( 'course-' ) ) {
					componentKey = 'course-structure-item';
				}

				return componentKey;
			},
			/**
			 * Make sure the icon size is inherited from the default state
			 *
			 * @param {Number} size
			 * @param {jQuery} $element
			 * @returns {Number}
			 */
			'tcb.icon.default_size': ( size, $element ) => {
				if ( $element.hasClass( Constants.toggleExpandCollapseIconClass ) || $element.hasClass( Constants.structureItemIconClass ) ) {
					const state = Content.getActiveState( $element );

					if (
						( state.length && parseInt( state ) !== 0 ) ||
						$element.closest( '.tve-state-expanded' ).length > 0
					) {
						const iconSize = $element.css( 'font-size' );

						if ( typeof iconSize !== 'undefined' ) {
							size = iconSize;
						}
					}
				}

				return size;
			},
			/**
			 * For courses that exists on the page, fetch also the structure on lazy load request
			 *
			 * @param {Object} data
			 *
			 * @return {Object}
			 */
			'tcb.lazyload.data': data => {

				const $courses = TVE.inner.$body.find( Constants.courseIdentifier ),
					existingCourseIds = _.uniq( $courses.map( ( index, element ) => parseInt( element.dataset.id ) ) );

				if ( Array.isArray( existingCourseIds ) && existingCourseIds.length ) {
					data[ 'structure_course_ids' ] = existingCourseIds;
				}

				return data;
			}
		}
	};

module.exports = hooks;
