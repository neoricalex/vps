( function ( $ ) {
	const SearchPanel = require( '../course/utils/course-search' ),
		Content = require( '../course/content' ),
		Constants = require( '../course/constants' ),
		Sync = require( '../course/sync' ),
		EditMode = require( '../course/utils/edit-mode' ),
		DEFAULT_STATE = 0,
		stateIdentifier = Constants.courseSubElementSelectors[ 'course-state-selector' ];

	module.exports = TVE.Views.Base.component.extend( {
		/**
		 * @var SearchPanel|null
		 */
		placeholderPanel: null,
		courseObject: {},
		/**
		 * Called before each component update
		 */
		before_update: function () {
			this.setCourseElement();

			this.setNotPublishWarning();
		},

		/**
		 * Sets the not publish warning for the selected course element
		 */
		setNotPublishWarning: function () {
			this.$courseMessageWrapper.empty();
			if ( this.courseObject.status !== 'publish' ) {
				this.$courseMessageWrapper.html( TVE.tpl( 'unpublish-course-warning' )() ).find( 'a' ).attr( 'href', this.courseObject.admin_edit_url );
			}
		},
		/**
		 * Shows the Loading Overlay over the Element inside Canvas
		 *
		 * @param $element
		 */
		showLoadingOverlay: function ( $element = TVE.ActiveElement ) {
			$element.empty().addClass( 'tcb-elem-placeholder tcb-block-placeholder' );
			this.placeholderPanel.hide();
		},

		after_init: function () {
			this.$courseMessageWrapper = this.$( '#tva-course-message' );
			this.placeholderPanel = new SearchPanel( {
				minWidth: 250,
				no_buttons: true
			} );

			/**
			 * Add expand / collapse callbacks for the defined sub selectors
			 */
			Constants.expandCollapseSubSelectors.forEach( subSelectorType => {
				TVE.add_action( `tve.icons.expanded.${subSelectorType}`, this.toggleExpandCollapse.bind( this ) );
				TVE.add_action( `tve.icons.collapse.${subSelectorType}`, this.toggleExpandCollapse.bind( this ) );
				TVE.add_action( `tcb.state.change.${subSelectorType}`, this.toggleStateManagerChange.bind( this ) );
				TVE.add_action( `tcb.focus_${subSelectorType}.before`, this.changeStateBeforeFocus.bind( this ) );

				TVE.add_filter( `tcb.${subSelectorType}.has_states_dropdown`, this.enableStateDropdown.bind( this ) );
			} );

			/**
			 * On lazy load we send additional data such as course structure
			 *
			 * This data is needed for updating the controls on the main element
			 */
			TVE.add_action( 'tve.lazyload.done', response => {
				if ( response.tva_courses ) {
					$.extend( true, TVA.courses, response.tva_courses ); //Deep copy

					if ( TVE.ActiveElement && TVE.ActiveElement.is( Constants.courseIdentifier ) ) {
						this.controls.displayLevel.update( TVE.ActiveElement );
					}
				}
			} );

			TVE.main.on( 'insert-course', courseId => {

				if ( ! courseId ) {
					console.warn( 'Course ID is missing' );
					return;
				}

				wp.apiRequest( {
					type: 'GET',
					url: `${TVA.routes.course}/html`,
					data: {
						id: courseId
					},
					beforeSend: xhr => {
						this.showLoadingOverlay();
					}
				} ).done( this.applyDefaultTemplate ).fail( response => {
					console.warn( 'There was an error in fetching the course', response );
				} );
			} );
		},

		/**
		 * Applies the default template
		 *
		 * Callback for insert course function
		 *
		 * @param {Object} response
		 * @param status
		 * @param options
		 */
		applyDefaultTemplate: function ( response = {}, status, options ) {
			const cssIdMap = {},
				$html = TVE.inner_$( response.html ).addClass( 'tcb-local-vars-root' );

			response.data.content.forEach( pieceOfContent => {
				/**
				 * Add dynamically the order depending on the data attribute
				 */
				pieceOfContent.tva_course_index = $html.find( `.thrv_wrapper[data-id="${pieceOfContent.ID}"]` ).attr( 'data-index' );
			} );


			TVA.courses[ response.id ] = {...TVA.courses[ response.id ], ...response.data};

			TVE.ActiveElement.replaceWith( $html );

			let $targets = $html.find( '[data-css]' );
			$targets = $targets.add( $html.filter( '[data-css]' ) );

			$targets.each( function () {
				/* eliminate cases where data-css="" */
				if ( ! this.dataset.css ) {
					return;
				}

				if ( typeof cssIdMap[ this.dataset.css ] === 'undefined' ) {
					cssIdMap[ this.dataset.css ] = TVE.CSS_Rule_Cache.uniq_id( this, true );
				} else {
					this.dataset.css = cssIdMap[ this.dataset.css ];
				}
			} );

			TVE.drag.bind_element( $html );

			let headCss = response.css || '';

			$.each( cssIdMap, function ( oldID, newID ) {
				headCss = headCss.replace( new RegExp( '(' + oldID + ')', 'g' ), newID );
			} );

			TVE.Editor_Page.content_manager.insert_head_css( headCss ).done( () => {
				//We need to trigger this action for the froala inline shortcodes to initialize
				TVE.do_action( 'tcb_after_cloud_template', $html );

				TVE.froala.handleEmptyShortcodes( $html );

				TVE.Editor_Page.focus_element( $html );

				TVE.ActiveElement = TVE.inner_$( TVE.ActiveElement );

				Content.initCourseSubElements( TVE.ActiveElement );
			} );
		},

		/**
		 * Callback when the user changes the course
		 *
		 * In a smart way, transfers the HTML and the css from the old course to the new course
		 *
		 * @param {Object} response
		 * @param {jQuery} $oldCourse
		 */
		changeCourseAjaxCallback: function ( response = {}, $oldCourse ) {

			const $newCourse = $( response.html ),
				courseId = parseInt( response.id );

			response.data.content.forEach( pieceOfContent => {
				/**
				 * Add dynamically the order depending on the data attribute
				 */
				pieceOfContent.tva_course_index = $newCourse.find( `.thrv_wrapper[data-id="${pieceOfContent.ID}"]` ).attr( 'data-index' );
			} );

			TVA.courses[ courseId ] = {...TVA.courses[ courseId ], ...response.data};

			const targets = Content.transferCourseContent( $newCourse, $oldCourse ),
				cssIdMap = {};

			targets.forEach( element => {
				/* eliminate cases where data-css="" */
				if ( ! element.dataset.css ) {
					return;
				}

				if ( typeof cssIdMap[ element.dataset.css ] === 'undefined' ) {
					cssIdMap[ element.dataset.css ] = TVE.CSS_Rule_Cache.uniq_id( element, true );
				} else {
					element.dataset.css = cssIdMap[ element.dataset.css ];
				}
			} );

			let headCss = response.css || '';

			$.each( cssIdMap, function ( oldID, newID ) {
				headCss = headCss.replace( new RegExp( '(' + oldID + ')', 'g' ), newID );
			} );

			TVE.FLAGS[ 'SYNC_NEW_CONTENT' ] = true;

			//Sync all the course elements
			Sync.syncCourse( $newCourse );

			//Set the data selectors
			Content.initCourseSubElements( $newCourse );

			TVE.ActiveElement
			   .toggleClass( Constants.courseTextWarningClass, $newCourse.hasClass( Constants.courseTextWarningClass ) )
			   .attr( 'data-id', courseId )
			   .html( $newCourse.html() );

			TVE.Editor_Page.content_manager.insert_head_css( headCss ).done( () => {
				TVE.do_action( 'tcb_after_cloud_template', TVE.ActiveElement );

				TVE.froala.handleEmptyShortcodes( TVE.ActiveElement );

				TVE.FLAGS[ 'SYNC_NEW_CONTENT' ] = false;

				TVE.drag.bind_element( TVE.ActiveElement );

				requestAnimationFrame( () => {
					TVE.ActiveElement.removeClass( 'tcb-elem-placeholder tcb-block-placeholder' );
				} );

			} );
		},

		controls_init: function () {
			const self = this;

			this.controls[ 'AllowCollapsed' ].update = function ( $element ) {
				const values = this.get_buttons().map( btn => btn.value );

				[ ...values ].forEach( value => {
					if ( $element.attr( `data-deny-collapse-${value}` ) ) {
						values.splice( values.indexOf( value ), 1 );
					}
				} );

				values.forEach( value => {
					this.setActive( value );
				} );

				this.component.$( '.default-state-toggle' )[ values.length === 0 ? 'hide' : 'show' ]();
			};
			this.controls[ 'AllowCollapsed' ].input = function ( $element, dom ) {
				const values = this.get_buttons().map( btn => btn.value );
				let notActiveLength = 0;

				values.forEach( value => {
					if ( this.isActive( value ) ) {
						$element.removeAttr( `data-deny-collapse-${value}` );
					} else {
						$element.attr( `data-deny-collapse-${value}`, 1 );
						notActiveLength ++;
					}
				} );

				if ( notActiveLength === values.length ) {
					this.component.controls.DefaultState.$( '[data-value="expanded"]' ).click();
					this.component.$( '.default-state-toggle' ).hide();
				} else {
					this.component.$( '.default-state-toggle' ).show();
				}
			};

			this.controls[ 'DefaultState' ].update = function ( $element ) {
				const value = $element.attr( 'data-default-state' ) || 'expanded';

				this.setActive( value );
			};
			this.controls[ 'DefaultState' ].input = function ( $element, dom ) {
				const value = this.getValue();

				if ( value !== 'expanded' ) {
					$element.attr( 'data-default-state', value );
				} else {
					$element.removeAttr( 'data-default-state' );
				}

				this.component.collapseExpandCallback( $element );
			};

			this.controls[ 'changeCourse' ].update = function ( $element ) {

				const options = [];

				Object.values( TVA.courses ).reverse().forEach( course => {
					options.push( {
						value: course.id,
						name: course.name,
					} )
				} );

				this.build_options( options );

				this.setValue( $element.attr( 'data-id' ) );
			};

			this.controls[ 'changeCourse' ].input = ( $element, dom ) => {
				$element.removeAttr( 'data-display-level' );

				this.changeCourse( parseInt( dom.value ) ).done( () => {
					this.before_update();
					this.controls[ 'displayLevel' ].update( $element );
				} );
			};

			this.controls[ 'displayLevel' ].update = function ( $element ) {
				if ( Array.isArray( self.courseObject.structure ) ) {
					let data = [ {value: '', name: 'Course'} ];

					if ( self.courseObject.structure.length ) {
						data = [ ...data, ...self.buildDisplayLevelOptions( self.courseObject.structure ) ];
					}
					this.build_options( data );
				}

				this.setValue( $element.attr( 'data-display-level' ) || '' );
			};

			this.controls[ 'displayLevel' ].input = ( $element, dom ) => {

				if ( ! dom.value ) {
					$element.removeAttr( 'data-display-level' );
				} else {
					$element.attr( 'data-display-level', dom.value );
				}

				this.changeCourse( parseInt( $element.attr( 'data-id' ) ), $element.attr( 'data-display-level' ) );
			};

			/**
			 * Hides the course elements
			 */
			EditMode.toggleElements();
		},

		/**
		 * Builds the display level options
		 *
		 * @param {Array} structure
		 * @param {String} nameSuffix
		 *
		 * @return {Array}
		 */
		buildDisplayLevelOptions: function ( structure = [], nameSuffix = '- ' ) {
			let options = [];

			structure.forEach( structureItem => {
				if ( structureItem.post_type === 'tva_lesson' ) {
					return;
				}

				options.push( {name: nameSuffix + structureItem.post_title, value: structureItem.ID} );

				if ( Array.isArray( structureItem.structure ) && structureItem.structure.length ) {
					options = [ ...options, ...this.buildDisplayLevelOptions( structureItem.structure, '-- ' ) ]
				}
			} );

			return options;
		},

		/**
		 * Called when placeholder is shown
		 */
		placeholder_action: function () {
			this.placeholderPanel.open( TVE.ActiveElement, TVE.ActiveElement.find( '.tcb-inline-placeholder-action' ) )
		},
		/**
		 * Triggered when the user clicks on Edit Course button from the UI
		 *
		 * @param {Event} event
		 * @param {HTMLButtonElement} btn
		 */
		editCourse: function ( event, btn ) {
			this.enterEditMode();

			TVE.main.EditMode.enter( this.$courseElement, {
				blur: true,
				body_class: 'edit-mode-active course-edit-mode', /* add an extra class so we can do some CSS targeting  */
				can_insert_elements: true,
				show_default_message: true,
				restore_state: true,
				element_selectable: false,
				hidden_elements: this.editModeHiddenElements(),
				states: this.getStates(),
				callbacks: {
					exit: _.bind( this.exitEditMode, this ),
					state_change: _.bind( this.stateChange, this ),
				}
			} );

			if ( ! this.$courseElement || this.$courseElement.length === 0 ) {
				this.setCourseElement();
			}
		},

		/**
		 * Returns the states for the course element
		 *
		 * @return {[{label: string, value: number}, {label: string, value: number}, {label: string, value: number}]}
		 */
		getStates: function () {
			return [
				{label: 'Not Completed', value: DEFAULT_STATE},
				{label: 'No Access', value: 1},
				{label: 'Completed', value: 2},
			];
		},

		/**
		 * Callback for when a state is changed from the edit mode select
		 * @param {String} state
		 * @param {Boolean} blur
		 */
		stateChange: function ( state, blur = true ) {

			//Ensure there is a wrapper for each state
			this.$courseElement.find( stateIdentifier ).each( ( index, element ) => {

				const $element = $( element );
				/**
				 * If the element is inside the course dropzone we continue the loop
				 */
				if ( $element.closest( '.tva-course-item-dropzone' ).length ) {
					return;
				}

				if ( ! $element.parent().find( `[${Constants.stateDatasetKey}="${state}"]` ).length ) {
					$element.parent().append( $element.clone().attr( Constants.stateDatasetKey, state ) );
				}

				$element.parent().find( stateIdentifier ).hide().filter( `[${Constants.stateDatasetKey}="${state}"]` ).show();
			} );

			/* add the current state to all the wrappers */
			this.$courseElement.find( Constants.courseSubElementSelectors[ 'course-content-selectors' ] ).attr( Constants.stateDatasetKey, state );

			/* blur after switching states */
			if ( blur ) {
				TVE.Editor_Page.blur();
			}
		},

		/**
		 * Callback from change course control and display level
		 *
		 * @param {number} courseId
		 * @param {number|undefined} displayLevel
		 *
		 * @return {JQuery.Promise<any, any, any>}
		 */
		changeCourse: function ( courseId, displayLevel = 0 ) {
			const deferred = $.Deferred();

			if ( ! courseId ) {
				console.warn( 'Course ID is missing' );
				return;
			}

			const $oldCourse = TVE.ActiveElement.clone(),
				templateID = TVE.ActiveElement.attr( 'data-ct' );

			wp.apiRequest( {
				type: 'GET',
				url: `${TVA.routes.course}/html`,
				data: {
					id: courseId,
					display_level: displayLevel,
					template_id: templateID ? templateID.replace( `${TVE._type( TVE.ActiveElement )}-`, '' ) : '',
				},
				beforeSend: xhr => {
					this.showLoadingOverlay();
				}
			} ).done( response => {
				this.changeCourseAjaxCallback( response, $oldCourse );

				deferred.resolve();
			} ).fail( response => {
				console.warn( 'There was an error in changing the course', response );
			} );

			return deferred.promise();
		},

		/**
		 * Called on exit Edit Mode
		 */
		exitEditMode: function () {

			//Change back the state to the default state
			this.stateChange( DEFAULT_STATE, false );

			this.collapseExpandCallback();

			/**
			 * Hides the course elements
			 */
			EditMode.toggleElements();
			TVE.main.sidebar_extra.elements.toggleIntegrationElements( true );

			TVE.Editor_Page.focus_element( this.$courseElement );
		},

		/**
		 * Callback for collapse/expand functions
		 *
		 * Gets triggered after exit edit mode and after default collapse/expand method gets modified
		 *
		 * @param $element
		 */
		collapseExpandCallback: function ( $element = this.$courseElement ) {
			const isCollapse = $element.attr( 'data-default-state' ),
				config = {
					collapse: {'selectors': [], method: 'addClass'},
					expand: {'selectors': [], method: 'removeClass'}
				};

			if ( isCollapse ) {

				const denyCollapseModules = $element.attr( 'data-deny-collapse-module' ),
					denyCollapseCourses = $element.attr( 'data-deny-collapse-chapter' );

				if ( denyCollapseModules ) {
					config.expand.selectors.push( Constants.courseSubElementSelectors[ 'course-module-dropzone' ] );
				} else {
					config.collapse.selectors.push( Constants.courseSubElementSelectors[ 'course-module-dropzone' ] );
				}

				if ( denyCollapseCourses ) {
					config.expand.selectors.push( Constants.courseSubElementSelectors[ 'course-chapter-dropzone' ] );
				} else {
					config.collapse.selectors.push( Constants.courseSubElementSelectors[ 'course-chapter-dropzone' ] );
				}

			} else {
				config.expand.selectors.push( Constants.courseSubElementSelectors[ 'course-module-dropzone' ] );
				config.expand.selectors.push( Constants.courseSubElementSelectors[ 'course-chapter-dropzone' ] );
			}

			Object.values( config ).forEach( conf => {
				if ( conf.selectors.length ) {
					TVE.inner.window.TCB_Front.course.toggleItem( $element.find( conf.selectors.join( ',' ) ), conf.method );
				}
			} );
		},

		/**
		 * Called before entering the edit mode
		 */
		enterEditMode: function () {
			/**
			 * We do this to make Module/Chapter/Lessons and their items non-draggable
			 * All the other elements that are draggable can still be dragged even if we remove these classes.
			 */
			this.$courseElement.find( '[draggable]' ).removeAttr( 'draggable' );
			this.$courseElement.find( '.tve-draggable' ).removeClass( 'tve-draggable' );
			this.$courseElement.find( '.tve-droppable' ).removeClass( 'tve-droppable' );

			/**
			 * Shows the course elements
			 */
			EditMode.toggleElements( true );

			TVE.main.sidebar_extra.elements.toggleIntegrationElements( false );

			const courseID = this.courseObject.id;

			if ( ! _.isEmpty( TVA.courses[ courseID ].content ) ) {
				return;
			}

			wp.apiRequest( {
				type: 'GET',
				url: `${TVA.routes.course}/structure`,
				data: {
					id: courseID,
				}
			} ).done( response => {
				response.content.forEach( pieceOfContent => {
					/**
					 * Add dynamically the order depending on the data attribute
					 */
					pieceOfContent.tva_course_index = this.$courseElement.find( `.thrv_wrapper[data-id="${pieceOfContent.ID}"]` ).attr( 'data-index' );
				} );

				TVA.courses[ courseID ] = {...TVA.courses[ courseID ], ...response};
			} ).fail( () => {
				console.log( 'error' );
			} );
		},

		/**
		 * Contains a list of elements identifiers that should be hidden from the edit mode
		 *
		 * @return Array
		 */
		editModeHiddenElements: function () {
			return [ 'login', 'lead_generation', 'contact_form', 'lead_generation_contact_form', 'block', 'ct_symbol', 'section', 'post_list', 'course' ];
		},

		/**
		 * @param {jQuery} $element
		 */
		setCourseElement: function ( $element = TVE.ActiveElement ) {
			const canvasCourseID = parseInt( $element.attr( 'data-id' ) );

			this.$courseElement = $element;
			this.courseObject = Object.values( TVA.courses ).find( item => item.id === canvasCourseID );
		},
		/**
		 * Callback for expand / collapse editor functions
		 * Contains functionality that are common to both functions
		 *
		 * @param {jQuery} $target
		 */
		toggleExpandCollapse: function ( $target ) {
			TVE.Editor_Page.blur();
			/**
			 * We call the front-end expand collapse main functionality
			 */
			TVE.inner.window.TCB_Front.course.toggleItem( $target );

			const state = $target.hasClass( TVE.inner.window.TCB_Front.course.collapseClass ) ? 'expanded' : 'default';

			TVE.state_manager.change( state, true );
			TVE.main.states_dropdown.s = state;

			/**
			 * We trigger the focus_element function to update the controls and the icons on the element
			 */
			TVE.Editor_Page.focus_element( $target.removeClass( 'edit_mode' ) );
		},

		/**
		 * Callback when a user changes the state for a ModuleDropzone or ChapterDropzone
		 *
		 * @param state
		 */
		toggleStateManagerChange: function ( state ) {
			/**
			 * We call the front-end expand collapse main functionality
			 */
			TVE.inner.window.TCB_Front.course.toggleItem( TVE.ActiveElement, state === 'expanded' ? 'addClass' : 'removeClass' );

			/**
			 * We trigger the focus_element function to update the controls and the icons on the element
			 */
			TVE.Editor_Page.focus_element( TVE.ActiveElement.removeClass( 'edit_mode' ) );
		},

		/**
		 * Changes the state before element focus
		 *
		 * @param {jQuery} $element
		 */
		changeStateBeforeFocus: function ( $element ) {
			const currentState = $element.hasClass( TVE.inner.window.TCB_Front.course.collapseClass ) ? 'expanded' : 'default';

			if ( TVE.state_manager.get_state() !== currentState ) {
				requestAnimationFrame( () => TVE.state_manager.change( currentState, true ) );
			}
		},

		/**
		 * Enables the state dropdown for Module Dropzone and Chapter Dropzone
		 *
		 * @return {boolean}
		 */
		enableStateDropdown: function () {
			return true;
		}
	} );
} )( jQuery );
