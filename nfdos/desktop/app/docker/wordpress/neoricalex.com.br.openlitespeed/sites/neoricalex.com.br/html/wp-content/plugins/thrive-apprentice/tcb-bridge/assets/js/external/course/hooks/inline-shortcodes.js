const ApprenticeFieldsOption = 'Apprentice fields',
	Constants = require( './../constants' ),
	SyncFn = require( '../sync' ),
	EditMode = require( '../utils/edit-mode' ),
	General = require( '../utils/utils-general' ),
	changeSelectOptionName = ( $html, value, newName ) => {
		$html.find( `option[value="${value}"]` ).html( newName );
	},
	inlineShortcodeHooks = {
		actions: {
			'tcb.froala.before_shortcode_popup': ( $popup, $element, shortcodes ) => {
				const $groupList = $popup.find( '#fr-dropdown-categories-list' );

				$groupList.find( `option[value="${ApprenticeFieldsOption}"]` ).toggle( EditMode.isInsideCourseEditMode() );
			},
			/**
			 * Hooks to froala shortcode after select action
			 * Hides the custom input container for chapter - reason: the chapter doesn't have links
			 *
			 * @param $editor
			 * @param config
			 */
			'tcb.froala.after_shortcode_select': ( $editor, config = {} ) => {
				const type = TVE._type( TVE.ActiveElement.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ) );

				if ( type === 'course-chapter' ) {
					$editor.find( '.tve-custom-input-container' ).empty();
				}
			},
		},
		filters: {
			'tve.shortcode.options.html': ( dropdownShortcodeListHTML, groupKey ) => {

				if ( groupKey === ApprenticeFieldsOption && EditMode.isInsideCourseEditMode() ) {
					const type = TVE._type( TVE.ActiveElement.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ) ),
						$dropdownShortcodeList = TVE.$( dropdownShortcodeListHTML ),
						list = TVE.CONST.inline_shortcodes[ ApprenticeFieldsOption ],
						removeOptions = list.filter( item => Array.isArray( item.only_for ) && ! item.only_for.includes( type ) );

					switch ( type ) {
						case 'course':
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_title', 'Course title' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_description', 'Course description' );
							break;
						case 'course-module':
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_title', 'Module title' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_description', 'Module description' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_index', 'Module number' );
							break;
						case 'course-chapter':
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_title', 'Chapter title' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_description', 'Chapter description' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_index', 'Chapter number' );
							break;
						case 'course-lesson':
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_title', 'Lesson title' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_description', 'Lesson description' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_status', 'Lesson status' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_index', 'Lesson number' );
							break;
						default:
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_title', 'Title' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_description', 'Description' );
							changeSelectOptionName( $dropdownShortcodeList, 'tva_course_status', 'Status' );
							break;
					}

					removeOptions.forEach( optionToRemove => {
						$dropdownShortcodeList.find( `option[value="${optionToRemove.value}"]` ).remove();
					} );

					dropdownShortcodeListHTML = $dropdownShortcodeList[ 0 ].outerHTML;
				}

				return dropdownShortcodeListHTML;
			},
			'tcb.froala.display_existing_shortcode_data': shortcodeData => {
				if ( EditMode.isInsideCourseEditMode() && General.allowApprenticeShortcodes( shortcodeData.key ) ) {
					shortcodeData.key = shortcodeData.key.replace( /tva_course_(module_|chapter_|lesson_)/, 'tva_course_' );
				}
				return shortcodeData;
			},
			'tcb.inline_shortcodes.shortcode_group': ( shortcodeGroups = [] ) => {

				shortcodeGroups.push( ApprenticeFieldsOption );

				return shortcodeGroups;
			},
			'tcb.inline_shortcodes.afterInsert': ( $element, shortcodeData ) => {
				if ( EditMode.isInsideCourseEditMode() && General.allowApprenticeShortcodes( shortcodeData.key ) ) {
					const type = TVE._type( $element.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ) ),
						$shortcodeContent = $element.find( '.thrive-shortcode-content' );

					$shortcodeContent.attr( {
						'data-shortcode': shortcodeData.key.replace( 'course', type.replace( '-', '_' ) ),
					} );

					if ( parseInt( $shortcodeContent.attr( 'data-attr-link' ) ) ) {

						const courseID = parseInt( $element.closest( Constants.courseIdentifier ).attr( 'data-id' ) ),
							contentID = parseInt( $element.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ).attr( 'data-id' ) ),
							course = TVA.courses[ courseID ],
							$link = TVE.$( '<a></a>' );

						$link.attr( {
							href: courseID === contentID ? course.tva_permalink : course.content.find( item => item.ID === contentID ).tva_permalink,
							target: parseInt( $shortcodeContent.attr( 'data-attr-target' ) ) ? '_blank' : '',
							rel: parseInt( $shortcodeContent.attr( 'data-attr-rel' ) ) ? 'nofollow' : '',
						} ).text( $shortcodeContent.text() );

						$shortcodeContent.html( $link );
					}

					SyncFn.checkForCourseSync( $element );
				}

				return $element;
			},
			/**
			 * Hooks to Shortcode Insert callback and modifies the outputted value
			 *
			 * @param shortcodeValue
			 * @param shortcodeData
			 *
			 * @return {string}
			 */
			'tcb.inline_shortcodes.shortcode_value': ( shortcodeValue, shortcodeData ) => {
				if ( EditMode.isInsideCourseEditMode() && General.allowApprenticeShortcodes( shortcodeData.key ) ) {
					const courseID = parseInt( TVE.ActiveElement.closest( Constants.courseIdentifier ).attr( 'data-id' ) ),
						contentID = parseInt( TVE.ActiveElement.closest( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ).attr( 'data-id' ) ),
						course = TVA.courses[ courseID ];

					if ( courseID === contentID ) { //The content should be from the course

						shortcodeValue = course[ shortcodeData.key ];

					} else if ( Array.isArray( course.content ) ) {
						const contentItem = course.content.find( item => item.ID === contentID );

						shortcodeValue = contentItem[ shortcodeData.key ];
					}
				}

				return shortcodeValue;
			}
		},

	};

module.exports = inlineShortcodeHooks;
