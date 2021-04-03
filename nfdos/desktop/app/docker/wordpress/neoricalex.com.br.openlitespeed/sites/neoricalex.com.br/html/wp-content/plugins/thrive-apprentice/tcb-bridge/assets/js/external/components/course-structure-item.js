const Constants = require( '../course/constants' ),
	Content = require( '../course/content' ),
	SyncFn = require( '../course/sync' ),
	courseStateSelector = Constants.courseSubElementSelectors[ 'course-state-selector' ];

function getActiveStateContainer( $element ) {
	const activeState = Content.getActiveState( $element );

	return $element.filter( '.edit_mode' ).find( `${courseStateSelector}[${Constants.stateDatasetKey}="${activeState}"]` );
}

module.exports = TVE.Views.Base.component.extend( {
	/**
	 * @param {Object} controls
	 */
	controls_init: function ( controls ) {
		controls[ 'ToggleIcon' ].change = function ( $element, dom ) {
			const $activeStateContainer = getActiveStateContainer( $element ),
				$icon = $activeStateContainer.find( `.${Constants.structureItemIconClass}` ),
				checked = dom.checked;

			if ( $icon.length > 0 ) {
				$icon.head_css( {display: checked ? 'block' : 'none'} );
			} else if ( checked ) {
				const $icon = TVE.inner_$( TVE.tpl( 'course-structure-item-icon' )() );

				$activeStateContainer.prepend( $icon );

				$icon.head_css( {
					'font-size': '60px',
					'width': '60px',
					'height': '60px',
					'margin-top': 0,
					'margin-bottom': 0,
				} );
			}

			TVE.Editor_Page.reposition_icons();

			SyncFn.checkForCourseSync( $element );

			controls.VerticalPosition.update( $element );
		};

		controls[ 'ToggleIcon' ].update = function ( $element ) {
			if ( Content.isCourseItem( $element ) ) {
				this.$el.hide();
			} else {
				const $activeStateContainer = getActiveStateContainer( $element ),
					$icon = $activeStateContainer.find( `.${Constants.structureItemIconClass}` );

				this.setChecked( $icon.length > 0 && $icon.head_css( 'display' ) !== 'none' );

				this.$el.show();
			}
		};

		/* controls for the toggle icon - a bit similar to the regular icon, but the html position and the default css are different */
		controls[ 'ToggleExpandCollapse' ].change = function ( $element, dom ) {
			const $activeStateContainer = getActiveStateContainer( $element ),
				$icon = $activeStateContainer.find( `.${Constants.toggleExpandCollapseIconClass}` ),
				checked = dom.checked;

			if ( $icon.length > 0 ) {
				$icon.head_css( {display: checked ? 'block' : 'none'} );
			} else if ( checked ) {
				const $expandIcon = TVE.inner_$( TVE.tpl( 'course-structure-item-toggle-icon' )() );

				$activeStateContainer.append( $expandIcon );

				$expandIcon.head_css( {
					'font-size': '22px',
					'width': '22px',
					'height': '22px',
					'margin-top': 0,
					'margin-bottom': 0,
				} );
			}

			TVE.Editor_Page.reposition_icons();

			SyncFn.checkForCourseSync( $element );

			controls.VerticalPosition.update( $element );
		};

		controls[ 'ToggleExpandCollapse' ].before_update = function ( $element ) {
			/* Hide this control for the lesson element and for the course item  */
			this.$el.toggle( ! Content.isLesson( $element ) && ! Content.isCourseItem( $element ) );
		};

		controls[ 'ToggleExpandCollapse' ].update = function ( $element ) {
			const $activeStateContainer = getActiveStateContainer( $element ),
				$icon = $activeStateContainer.find( `.${Constants.toggleExpandCollapseIconClass}` );

			this.setChecked( $icon.length > 0 && $icon.head_css( 'display' ) !== 'none' );
		};

		controls[ 'Height' ].input = function ( $element, dom ) {
			this.applyElementCss( {'min-height': `${dom.value}${this.getUM()} !important`}, $element, this.config.css_suffix, '' );
		};

		controls[ 'Height' ].update = function ( $element ) {
			/* for some reason we have multiple jQuery objects on update, we must take into account only the current ( visible ) one */
			$element = $element.filter( ':visible' );

			let value = $element.head_css( 'min-height' );

			if ( ! value ) {
				value = $element.height();
			}

			this.setValue( value );
		};

		controls.VerticalPosition.input = function ( $element, dom ) {
			this.applyElementCss( {'align-items': dom.getAttribute( 'data-value' )}, getActiveStateContainer( $element ), '', '' );
		};
		controls.VerticalPosition.update = function ( $element ) {
			this.$el[ controls.ToggleIcon.isChecked() || controls.ToggleExpandCollapse.isChecked() ? 'show' : 'hide' ]();

			const $activeStateContainer = getActiveStateContainer( $element );

			this.setActive( $activeStateContainer.head_css( 'align-items' ) || '' );
		};
	}
} );
