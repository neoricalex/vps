( function ( $, tcb ) {

	module.exports = {
		collapseClass: 'tve-state-expanded',
		init: function () {
			if ( ! tve_frontend_options.is_editor_page ) {
				this.frontendInit();
			}
		},
		frontendInit: function ( $root ) {
			$root = $root || tcb.$document;

			$root.find( '.tva-course' ).each( ( index, element ) => {
				const $element = $( element );

				$element.find( '.tva-course-chapter-list, .tva-course-lesson-list' ).wrap( '<div></div>' );

				this.initializeEmptyContainers( $element );

				this.bindEvents( $element );

				this.handleStates( $element );
			} );
		},

		bindEvents: function ( $course ) {
			const canCollapseModule = ! $course.attr( 'data-deny-collapse-module' ),
				canCollapseChapters = ! $course.attr( 'data-deny-collapse-chapter' );

			if ( canCollapseModule ) {
				$course.find( '.tva-course-module-dropzone' ).click( event => {
						if ( event.target.tagName !== 'A' ) {
							this.toggleItem( $( event.currentTarget ) );
						}
					}
				);
			}

			if ( canCollapseChapters ) {
				$course.find( '.tva-course-chapter-dropzone' ).click( event => {
					if ( event.target.tagName !== 'A' ) {
						this.toggleItem( $( event.currentTarget ) );
					}
				} );
			}
		},

		/**
		 * Remove the states that are not for the active user
		 *
		 * @param $course
		 */
		handleStates: function ( $course ) {
			$course.find( '[data-tva-remove-state="1"]' ).remove();
		},
		/**
		 * Expand / Collapse the course item depending on the state
		 *
		 * @param {jQuery} $courseItem
		 * @param {string} method - jQuery method (toggleClass|addClass|removeClass)
		 */
		toggleItem: function ( $courseItem, method = 'toggleClass' ) {
			$courseItem[ method ]( this.collapseClass ).siblings()[ $courseItem.hasClass( this.collapseClass ) ? 'slideUp' : 'slideDown' ]();
		},

		/**
		 * If the inner content is empty, add an extra empty class for css styling ( we can't detect this in PHP )
		 * @param {jQuery} $element
		 */
		initializeEmptyContainers: function ( $element ) {
			const $courseItem = $element.find( '.tva-course-item-dropzone' );

			if ( $courseItem.find( '.tva-course-state-content:empty' ) ) {
				$courseItem.addClass( 'tva-empty-course-item' );
			}
		}
	};

} )( ThriveGlobal.$j, TCB_Front );
