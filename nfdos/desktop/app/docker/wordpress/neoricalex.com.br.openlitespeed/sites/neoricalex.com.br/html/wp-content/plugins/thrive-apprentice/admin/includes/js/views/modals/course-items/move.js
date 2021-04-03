( function ( $ ) {
	const Base = TVE_Dash.views.ModalSteps;
	const Course = require( '../../../models/course' );
	const Structure = require( '../../../collections/structure' );

	/**
	 * Modal for moving lessons/chapters/modules from one course to another
	 */
	module.exports = Base.extend( {
		/**
		 * @property {String}
		 */
		template: TVE_Dash.tpl( 'courses/move' ),

		/**
		 * Holds the array of Course objects that are possible candidates for receiving the selected items.
		 *
		 * @property {Course[]}
		 */
		courses: [],

		/**
		 * Holds the current selection type ( highest level for selected items )
		 *
		 * @property {String}
		 */
		selectionType: 'module',

		/**
		 * Holds the modal state. each some something changes, the modal will be re-rendered
		 *
		 * @property {Backbone.Model}
		 */
		state: null,

		events() {
			return {
				...Base.prototype.events,
				'change .select-item': 'selectionChanged',
				'click .tvd-modal-save': 'save',
			}
		},

		/**
		 * Initializer - setup a new model on this class that will hold the state
		 *
		 * @param {Object} options
		 */
		initialize( options ) {
			this.parent = options.parent;
			this.course = this.parent.model;
			this.structure = this.parent.collection;
			this.selectedItems = options.parent.selected;

			const modules = this.selectedItems.filter( item => item.getType() === 'module' );
			const chapters = this.selectedItems.filter( item => item.getType() === 'chapter' );

			if ( modules.length ) {
				this.selectionType = 'module';
			} else if ( chapters.length ) {
				this.selectionType = 'chapter';
			} else {
				this.selectionType = 'lesson';
			}

			Base.prototype.initialize.call( this, options );

			/**
			 * each time a change is fired on this state model, the view will re-render
			 */
			this.state = new Backbone.Model( {
				coursesFetched: false,
				selectedCourse: null,
				selectedModule: null,
				selectedChapter: null,
				canSave: false,
			} );

			this.listenTo( this.state, 'change', this.render.bind( this ) );
		},

		/**
		 * Immediately check if we need to fetch a list of courses
		 */
		afterRender() {
			if ( ! this.state.get( 'coursesFetched' ) ) {
				this.fetchCourses();
			}
		},

		/**
		 * Fetch a list of courses that could be used as target for the current selection
		 */
		fetchCourses() {
			this.$( '.tva-loader-courses' ).tvaToggleLoader( 20, true, {background: '', position: 'outside-right'} );

			wp.apiRequest( {
				url: `${TVA.routes.courses}/for-selection`,
				data: {
					selection_type: this.selectionType,
					exclude: [ this.course.get( 'id' ) ],
				}
			} ).done( response => {
				/**
				 * Instantiate a Course model for each item from the response
				 */
				this.courses = response.map( courseData => {
					/**
					 * ensure course structure collection
					 */
					courseData.structure = new Structure( courseData.structure );

					return new Course( courseData );
				} ).sort( ( a, b ) => {
					/**
					 * Sort the courses with respect to the order flag
					 */
					const orderA = parseInt( a.order ),
						orderB = parseInt( b.order );

					if ( orderA < orderB ) {
						return - 1;
					}
					if ( orderA > orderB ) {
						return 1;
					}
					return 0;
				} );

				this.state.set( 'coursesFetched', true );

				/**
				 * auto-select the first course if there's only one available
				 */
				if ( this.courses.length === 1 ) {
					this.selectCourse( this.courses[ 0 ].get( 'id' ) ).checkValid();
				}
			} );
		},

		/**
		 * Build a user-friendly summary showing the user how many items are selected and what type
		 *
		 * @return {string}
		 */
		selectionSummary() {
			const modules = this.selectedItems.filter( item => item.getType() === 'module' );
			const chapters = this.selectedItems.filter( item => item.getType() === 'chapter' );

			if ( modules.length ) {
				return TVA.Utils._n( modules.length, 'module' );
			}

			if ( chapters.length ) {
				return TVA.Utils._n( chapters.length, 'chapter' );
			}

			/**
			 * this means that only lessons are selected.
			 */
			return TVA.Utils._n( this.selectedItems.length, 'lesson' );
		},

		/**
		 * Select a course by it's ID
		 *
		 * @param {String|Number} id
		 *
		 * @return {this}
		 */
		selectCourse( id ) {
			id = parseInt( id );

			const course = this.courses.filter( course => id === course.get( 'id' ) )[ 0 ];
			const silent = {silent: true};
			this.state.set( 'selectedCourse', course, silent );
			let modules, moduleId;

			/**
			 * if there is a single module available, select it
			 */
			if ( this.needsModuleSelection() && ( modules = this.getAvailableModules() ).length === 1 ) {
				moduleId = modules[ 0 ].get( 'ID' );
			} else {
				moduleId = 0;
			}

			this.selectModule( moduleId );

			return this;
		},

		/**
		 * Select a module by it's ID
		 *
		 * @param {String|Number} id
		 *
		 * @return {this}
		 */
		selectModule( id ) {
			const module = this.state.get( 'selectedCourse' ).get( 'structure' ).findItem( id );
			this.state.set( 'selectedModule', module, {silent: true} );
			let chapters, chapterId;

			/**
			 * if there is a single chapter available, auto-select it
			 */
			if ( this.needsChapterSelection() && ( chapters = this.getAvailableChapters() ).length === 1 ) {
				chapterId = chapters[ 0 ].get( 'ID' );
			} else {
				chapterId = 0;
			}

			this.selectChapter( chapterId );

			return this;
		},

		/**
		 * Select a destination chapter by it's ID
		 *
		 * @param {Number|String} id
		 *
		 * @return {this}
		 */
		selectChapter( id ) {
			this.state.set( 'selectedChapter', this.state.get( 'selectedCourse' ).get( 'structure' ).findItem( id ), {silent: true} );

			return this;
		},

		/**
		 * `change` event listener on all 3 dropdowns for course/module/chapter selection
		 *
		 * @param {jQuery.Event} e
		 */
		selectionChanged( e ) {
			const field = TVA.Utils.ucFirst( e.currentTarget.getAttribute( 'name' ) );

			this[ `select${field}` ]( e.currentTarget.value );

			this.checkValid();
		},

		/**
		 * Check whether or not the user needs to select a Module from the destination course.
		 *
		 * @return {boolean}
		 */
		needsModuleSelection() {
			if ( this.selectionType === 'module' || ! this.state.get( 'selectedCourse' ) || ! this.state.get( 'selectedCourse' ).hasModules() ) {
				return false;
			}

			return !! this.getAvailableModules().length;
		},

		/**
		 * Check whether or not the user needs to select a chapter from the destination course / module
		 *
		 * @return {boolean}
		 */
		needsChapterSelection() {
			const course = this.state.get( 'selectedCourse' );
			const module = this.state.get( 'selectedModule' );

			if ( this.selectionType !== 'lesson' || ! course ) {
				return false;
			}

			if ( this.needsModuleSelection() && ! module ) {
				return false;
			}

			const siblings = module ? module.get( 'structure' ) : course.get( 'structure' );

			/**
			 * If no items in the course / module ==> no chapter selection needed
			 */
			if ( ! siblings.length ) {
				return false;
			}

			/**
			 * if course/module only contains lessons, there is no need for chapter selection
			 */
			const hasOnlyLessons = siblings.every( item => item.getType() === 'lesson' );

			return ! hasOnlyLessons;
		},

		/**
		 * Get a list of modules from the selected course that are candidates for receiving the selected items.
		 *
		 * @return {Array}
		 */
		getAvailableModules() {
			const type = this.selectionType;

			return this.state.get( 'selectedCourse' ).get( 'structure' ).filter( item => {
				if ( item.getType() !== 'module' ) {
					return false;
				}

				if ( ! item.get( 'structure' ).length ) {
					return true; // empty module -> can place anything inside
				}

				if ( type === 'lesson' ) {
					// a module is always OK for placing a lesson, either directly, either in a chapter
					return true;
				}

				/**
				 * if moving a chapter, we need to make sure the module does not contain any lessons
				 */
				return item.get( 'structure' ).every( child => child.getType() === type );
			}, this );
		},

		/**
		 * Get a list of chapters from the selected course / module that can receive the selected lessons
		 *
		 * @return {Array}
		 */
		getAvailableChapters() {

			return ( this.state.get( 'selectedModule' ) || this.state.get( 'selectedCourse' ) ).get( 'structure' )
			                                                                                   .filter( item => item.getType() === 'chapter' );
		},

		/**
		 * Getter for the currently selected course id
		 *
		 * @return {*|number}
		 */
		selectedCourseId() {
			const course = this.state.get( 'selectedCourse' );

			return course && course.get( 'id' ) || 0;
		},

		/**
		 * Getter for the currently selected module id
		 *
		 * @return {*|number}
		 */
		selectedModuleId() {
			const module = this.state.get( 'selectedModule' );

			return module && module.get( 'ID' ) || 0;
		},

		/**
		 * Getter for the currently selected chapter id
		 *
		 * @return {*|number}
		 */
		selectedChapterId() {
			const chapter = this.state.get( 'selectedChapter' );

			return chapter && chapter.get( 'ID' ) || 0;
		},

		/**
		 * Check if the current state is valid (if user can initiate the "Move" operation)
		 * Directly sets the `canSave` field on the state model => triggers re-render, enabling the save button
		 */
		checkValid() {
			const canSave = this.state.get( 'selectedCourse' ) && /* a course has been selected */
			                ( this.state.get( 'selectedModule' ) || ! this.needsModuleSelection() ) && /* a module is selected or a module selection is not required */
			                ( this.state.get( 'selectedChapter' ) || ! this.needsChapterSelection() ); /* a chapter is selected or a chapter selection is not required */


			this.state.set( 'canSave', canSave, {silent: true} );
			this.state.trigger( 'change' ); // trigger manually to make sure the view is re-rendered
		},

		/**
		 * Prepare the data needed to be sent to the server
		 *
		 * @return {{course_id: *, high_level: string, v: string, action: string, items: Object[]}}
		 */
		preparePostData() {
			const oldPostParent = this.selectedItems[ 0 ].get( 'post_parent' );

			const items = TVA.Utils.pluckFields( this.selectedItems, [ 'ID', 'post_parent', 'course_id', 'post_type', 'post_status' ] )
			                 .map( item => {
				                 item.old_post_parent = oldPostParent;
				                 item.course_id = this.selectedCourseId();
				                 item.post_parent = this.selectedChapterId() || this.selectedModuleId() || 0;

				                 return item;
			                 } );

			return {
				v: '2',
				action: 'move',
				course_id: this.course.get( 'id' ),
				high_level: this.selectionType,
				items,
			};
		},

		/**
		 * Finalize the move operation - send ajax request to the server.
		 */
		save() {
			const data = this.preparePostData();
			/**
			 * store lesson count (number of lessons that are being moved)
			 * @type {number}
			 */
			const lessonCount = data.items.filter( item => item.post_type === 'tva_lesson' ).length;
			const destinationId = this.selectedCourseId();

			this.showLoader();
			wp.apiRequest( {
				url: `${TVA.routes.courses}/bulk_action`,
				type: 'post',
				data,
			} ).done( response => {
				/**
				 * This makes sure the new structure is correctly applied to the course
				 */
				this.course.get( 'structure' ).reset( response.structure );
				this.course.recountLessons();

				/**
				 * Render the `items-tab-content` view
				 */
				this.parent.render();

				/**
				 * Update the destination course -> increase the number of lessons
				 */
				const destination = TVA.courses.findWhere( {id: destinationId} );
				destination.set( {
					'count_lessons': destination.get( 'count_lessons' ) + lessonCount,
					fetched: false,
				}, {silent: true} );
				destination.saveState(); // save state is needed so that the collection reflects the change

				/**
				 * Trigger this event in order to correctly update the course status and course status button
				 */
				this.course.trigger( 'tva.structure.status.changed' );

				this.close();
				TVE_Dash.success( TVA.t.items_moved );
			} );
		}
	} );
} )( jQuery );
