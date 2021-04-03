( function ( $ ) {

	const BaseModel = require( './../models/base' );
	const coursesCollection = require( './../collections/courses' );
	const paginationView = require( './pagination' );
	const TopicFilter = require( './filters/drop-down' );
	const ConfirmView = require( './confirm-action' );
	const ContentBase = require( './content-base' );
	const StructureCollection = require( './../collections/structure' );

	module.exports = ContentBase.extend( {
		/**
		 * CSS class name for the element of this view
		 * @property {string}
		 */
		className: 'tva-course-main',
		/**
		 * @property template for current list view
		 */
		template: TVE_Dash.tpl( 'courses/list' ),
		/**
		 * @property itemTemplate for single item in list
		 */
		itemTemplate: TVE_Dash.tpl( 'courses/item' ),
		/**
		 * @property template for add new course card button
		 */
		addTemplate: TVE_Dash.tpl( 'courses/add' ),
		/**
		 * @property template no items
		 */
		noItemsTemplate: TVE_Dash.tpl( 'courses/no-items' ),
		/**
		 * @property {{jQuery}} element where items are appended
		 */
		$courses: null,
		/**
		 * @property {{jQuery}} element for pagination view
		 */
		$pagination: null,
		/**
		 * Overwrite this to:
		 * - initialize the collection which was firstly localized
		 * - bind fetched event on collection
		 */
		initialize: function () {
			this.collection = TVA.courses;
			this.listenTo( this.collection, 'fetched', this.renderCourses );
			this.listenTo( this.collection, 'destroy', () => {
				this.renderCourses( this.collection );
			} );
			this.listenTo( this.collection, 'fetching', () => this.$courses.tvaToggleLoader( 50, true ) );
		},
		/**
		 * Overwrite the destroy method
		 *
		 * Resets all the view filters on destroy
		 */
		destroy: function () {
			ContentBase.prototype.destroy.apply( this, arguments );

			if ( this.collection.hasFilters() ) {
				this.collection.resetFilters().fetch();
			}
		},
		/**
		 * Set up the html from the view's template file
		 * - initializes the required jQuery elements
		 * @return {{Backbone.View}}
		 */
		render: function () {

			this.$el.html( this.template() );
			this.$courses = this.$( '#tva-courses' );
			this.$pagination = this.$( '.tva-pagination' );
			this.$noticeOnePublishedCourse = this.$( '#tva-one-published-course-notice' );
			this.topicFilter = new TopicFilter( {
				collection: TVA.topics,
				idField: 'ID',
				labelField: 'title',
				defaultOption: 'Filter by topics',
				selected: this.collection.getFilter( 'topic', - 1 )
			} ).render().on( 'change', this.topicChanged.bind( this ) );
			this.$( '.tva-filter-topic' ).append( this.topicFilter.$el );

			this.renderCourses( this.collection );

			/**
			 * Make course cards sortable
			 */
			this.$courses.sortable( {
				items: '> .tva-course-card',
				handle: '.tva-course-handle',
				placeholder: 'tva-drag-placeholder',
				forcePlaceholderSize: true,
				tolerance: 'pointer',
				update: updateCourseOrder
			} );
			this.$courses.disableSelection();

			this.renderPagination();

			return this;
		},
		/**
		 * @param {{Backbone.Collection}} collection of items to be appended to list
		 * @return {{Backbone.View}}
		 */
		renderCourses: function ( collection ) {
			this.$courses.tvaToggleLoader( false ).empty();

			if ( ! ( collection instanceof coursesCollection ) ) {
				return this;
			}

			if ( collection.length ) {

				this.toggleOneCoursePublishedNotification();

				collection.each( item => {
					this.$courses.append( this.itemTemplate( {
						course: item,
						topic: item.getTopic()
					} ) );
				} );

				this.$courses.append( this.addTemplate );
			} else {
				this.$courses.append( this.noItemsTemplate );
			}

			return this;
		},

		/**
		 * Toggles the one course published notification
		 */
		toggleOneCoursePublishedNotification: function () {
			this.$noticeOnePublishedCourse.toggle( ! TVA.courses.hasFilters() && TVA.courses.where( {status: 'publish'} ).length === 1 );
		},

		/**
		 * Renders pagination view for current collection
		 */
		renderPagination: function () {
			const view = new paginationView( {
				collection: this.collection,
				el: this.$pagination
			} );
			view.render();
			view.$el.hide(); //Hides the pagination $el from courses
		},
		/**
		 * Removes a course model from collection
		 * - added from HTML
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		deleteCourse: function ( event, dom ) {

			event.stopPropagation();

			const courseId = parseInt( dom.dataset.id );
			const $card = $( dom ).parents( '.tva-course-card' ).first();

			const confirmView = new ConfirmView( {
				template: TVE_Dash.tpl( 'courses/delete-course' ),
				className: 'tva-delete-course',
				confirm: () => {
					this.collection.findWhere( {id: courseId} ).destroy();
				},
				afterRender: () => {
					$card.removeClass( 'click' );
				},
				cancel: function () {
					$card.addClass( 'click' );
					this.remove();
				}
			} ).render();

			$card.append( confirmView.$el );
		},
		/**
		 * Called when the topic filter changes
		 *
		 * @param {String} topicID
		 */
		topicChanged( topicID ) {
			this.collection.addFilter( 'topic', topicID );
		},
		/**
		 * Loads course details by changing route
		 * - added in HTML view
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		courseDetails: function ( event, dom ) {
			this.changeView( `#courses/${dom.dataset.id}` );
			event.stopPropagation();
		},
		/**
		 * Prevent click on this button so that the course details doesn't load
		 * - added in HTML
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		previewCourse: function ( event, dom ) {
			event.stopPropagation();
		},
		/**
		 * Changes the route has new course to be added
		 * - added from dom
		 */
		addCourse: function () {
			this.changeView( '#courses/add-new-course' );
		},
		/**
		 * Finds the course and publishes or unpublishes it
		 * - fetches the course structure if not yet initialized
		 * - patches the course model
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 * @return {undefined|Backbone.View}
		 */
		toggleCourseStatus: function ( event, dom ) {

			const courseId = parseInt( dom.dataset.id );

			if ( isNaN( courseId ) ) {
				return;
			}

			const courseModel = TVA.courses.findWhere( {id: courseId} );
			const newStatus = courseModel.get( 'status' ) === 'draft' ? 'publish' : 'draft';

			/**
			 * Ensure course structure
			 * @type {Promise<unknown>}
			 */
			let promise = new Promise( ( resolve, reject ) => {
				if ( ! ( courseModel.get( 'structure' ) instanceof StructureCollection ) ) {
					TVE_Dash.showLoader();
					courseModel.fetch( {
						success: function ( model ) {
							model.set( 'structure', new StructureCollection( model.get( 'structure' ) ) );
							resolve();
						},
						error: function () {
							reject();
						}
					} );
				} else {
					resolve();
				}
			} );

			/**
			 * now if the course structure is ensured
			 * - sets the status and save the course
			 * - sets the specific classes and tooltip
			 */
			promise.then( () => {
				const publishedLessons = courseModel.get( 'structure' ).findItemsByOptions( {post_status: 'publish'} );
				if ( publishedLessons.length ) {
					TVE_Dash.showLoader();
					courseModel.save( {status: newStatus}, {
						success: () => {
							courseModel.set( 'fetched', false );
							TVE_Dash.hideLoader();
							TVE_Dash.success( TVA.t[ `course_${newStatus}` ] );
							dom.classList.remove( 'unpublished' );
							dom.classList.remove( 'published' );
							dom.classList.add( newStatus === 'draft' ? 'unpublished' : 'published' );
							$( dom ).find( '.tva-custom-tooltip' ).text( newStatus === 'draft' ? TVA.t.click_to_publish_course : TVA.t.click_to_unpublish_course );
							this.toggleOneCoursePublishedNotification();
						}
					} );
				} else {
					TVE_Dash.hideLoader();
					TVE_Dash.err( TVA.t.NumberLessons );
				}
			} );

			event.stopPropagation();

			return this;
		}
	} );

	/**
	 * To ensure backwards compatibility, the `order` meta field needs to be descending
	 *
	 * @param event
	 * @param ui
	 */
	function updateCourseOrder( event, ui ) {
		const $this = $( this );
		const items = $this.sortable( 'option', 'items' );
		const $items = $this.find( items );
		const maxOrder = $items.length - 1;

		const model = new BaseModel();

		$items.each( function ( index, dom ) {
			model.set( dom.dataset.id, maxOrder - index );
		} );
		model.url = `${TVA.apiSettings.root}${TVA.apiSettings.v2}/courses/update_orders`;
		model.save();

		$items.reverse().each( ( index, dom ) => TVA.courses.findWhere( {id: parseInt( dom.getAttribute( 'data-id' ) )} ).set( {order: index}, {silent: true} ) );

		TVA.courses.sort(); //Calls the comparator function on the collection
	}
} )( jQuery );
