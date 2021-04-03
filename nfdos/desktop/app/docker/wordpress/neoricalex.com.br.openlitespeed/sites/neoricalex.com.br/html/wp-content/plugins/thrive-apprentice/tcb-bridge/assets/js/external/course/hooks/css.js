const Constants = require( '../constants' ),
	SyncFn = require( '../sync' ),
	Utils = require( '../utils/utils-general' ),
	Content = require( '../content' ),
	/**
	 * @param {String} prefix
	 * @param {jQuery} $element
	 * @returns {String}
	 */
	prefixCallback = ( prefix, $element ) => {
		const $course = $element.parents( Constants.courseIdentifier );

		/* when editing elements inside the course, we add the course selector and the state selector to the prefix */
		if ( $course.length ) {
			prefix = Content.getPrefixedSelector( $element, $course, prefix );
		}

		return prefix;
	};

/**
 * @type {Object}
 */
const cssHooks = {
	actions: {
		/**
		 * If we added css inside a course item for the 1st time, then we sync the items so all of them receive the data-css.
		 * Don't sync when resizing
		 *
		 * @param selector
		 * @param rules
		 */
		'tcb.write_css': ( selector, rules ) => {
			selector = selector.replace( Utils.pseudoSelectorsRegex(), '' );

			/* stop if we're not resizing and the course is not included in the selector */
			if ( ! TVE.FLAGS.drag && selector.includes( TVE.identifier( 'course' ) ) ) {
				const $element = TVE.inner.$document.find( selector ),
					$courseItem = Content.getClosestCourseItem( $element );

				/* if the element is inside the course */
				if ( $courseItem.length ) {
					const $parent = TVE.state_manager.get_parent();
					let shouldSync = false;

					/* content boxes have the data-css on parent, so we also have to check there */
					if ( $parent && TVE.inner.$body.find( '[data-css="' + $parent.attr( 'data-css' ) + '"]' ).length === 1 ) {
						shouldSync = true;
					}

					if (
						/* if the element is a course item, there's no need to sync */
						! $element.is( $courseItem ) &&
						/* if the cssId does not exist in the other course items */
						( shouldSync || TVE.inner.$body.find( '[data-css="' + $element.attr( 'data-css' ) + '"]' ).length === 1 )
					) {
						SyncFn.checkForCourseSync( $courseItem );
					}
				}
			}
		}
	},
	filters: {

		/**
		 * Parses the CSS rules and replaces the course data CSS only for elements that need to be converted from the old course to the new course
		 *
		 * Ex: the data-selectors will be skipped because the css will be inherited from the old course
		 *
		 * @param {Array} cssRules
		 *
		 * @return {*}
		 */
		'css_rules_before_insert': cssRules => {

			if ( TVE.FLAGS[ 'SYNC_NEW_CONTENT' ] ) {

				const newCoursePrefix = `.tva-course[data-css="${TVE.ActiveElement.attr( 'data-css' )}"]`;

				for ( let i = 0; i < cssRules.length; i ++ ) {
					switch ( cssRules[ i ].type ) {
						case CSSRule.MEDIA_RULE:

							for ( let j = 0; j < cssRules[ i ].cssRules.length; j ++ ) {
								let _rule = cssRules[ i ].cssRules[ j ],
									cssText = _rule.cssText,
									selector = _rule.selectorText;

								if ( selector.includes( '.tva-course' ) ) {

									const newSelector = selector.replace( /.tva-course\[data-css="[A=Za-z-0-9]+"\]/gi, newCoursePrefix ),
										$foundElement = TVE.Editor_Page.editor.find( newSelector.replace( /::after|::hover|:not\(#tve\)/g, '' ).trim() );

									if ( $foundElement.length && ! $foundElement.attr( 'data-selector' ) ) {
										cssRules[ i ].deleteRule( j );
										cssRules[ i ].insertRule( cssText.replace( selector, newSelector ), j );
									}
								}
							}

							break;
						default:
							break;
					}
				}

				TVE.FLAGS[ 'SYNC_NEW_CONTENT' ] = false;
			}


			return cssRules;
		},

		/**
		 * Change the prefix for the course head_css function
		 */
		'tcb_head_css_prefix': prefixCallback,
		/**
		 * When changing a variable inside the course, prefix it
		 */
		'tve.css_variable.selector': prefixCallback,
		/**
		 * Decide if we regenerate the given data-css ID or not.
		 * When we're inside a course item, we don't regenerate it because we want the changes to apply to the other course items
		 *
		 * @param {Boolean} regenerate
		 * @param {string} cssID
		 * @returns {Boolean}
		 */
		'regenerate_css_id': ( regenerate, cssID ) => {
			const dataCSS = `[data-css="${cssID}"]`,
				$element = TVE.inner.$body.find( dataCSS );

			if ( $element.length ) {
				const $courseItem = Content.getClosestCourseItem( $element.length === 1 ? $element : $element.first() );

				/* if we are inside a course item, and that item has only one element with that data-css, do not regenerate the css */
				if ( $courseItem.length && $courseItem.find( dataCSS ).length === 1 ) {
					regenerate = false;
				} else {
					/* if we have more than two identical data-css in one item, this means that we've cloned an element so we regenerate the id */
				}
			}

			return regenerate;
		},
		/**
		 * Filter for when a new css id is generated.
		 *
		 * @param {String} cssID
		 * @returns {String}
		 */
		'tcb.head_css_new_id': cssID => {
			const $element = TVE.inner.$body.find( `[data-css="${cssID}"]` ),
				$courseItem = Content.getClosestCourseItem( $element );

			/**
			 * When we generate a new data css, and it's inside a course item, we start a sync so all the course items get the new id
			 * (!) Don't sync the course items when doing a drag action because it breaks stuff
			 */
			if ( $element.length === 1 && $courseItem.length > 0 && ! TVE.FLAGS.drag ) {
				SyncFn.checkForCourseSync( $element );
			}

			return cssID;
		},

		/**
		 * Make sure the styles added for different states persist during save
		 *
		 * @param whitelist
		 * @param selector
		 * @return {*}
		 */
		'tcb.css.save.whitelist_rule': ( whitelist, selector ) => {

			if ( selector.includes( TVE.identifier( 'course' ) ) && selector.includes( `[${Constants.stateDatasetKey}` ) ) {
				/* remove the state part and the extra space from the selector  */
				const realSelector = selector
					.replace( /\[data-course-state="\d"\]/, '' )
					.replace( /([ ]{2,})/g, ' ' );

				whitelist = TVE.inner_$( realSelector ).length > 0;
			}

			return whitelist;
		},
	},
};

module.exports = cssHooks;
