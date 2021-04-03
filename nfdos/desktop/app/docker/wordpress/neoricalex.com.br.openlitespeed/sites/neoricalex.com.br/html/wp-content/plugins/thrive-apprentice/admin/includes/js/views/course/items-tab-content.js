( function ( $ ) {

	const BaseView = require( './../base' );
	const ModuleView = require( './module' );
	const ChapterView = require( './chapter' );
	const LessonView = require( './lesson' );
	const CourseStructureCollection = require( './../../collections/structure' );
	const ConfirmationModal = require( './../../views/modals/confirm-modal' );
	const modals = {
		chapterGroup: require( '../modals/course-items/grouping/chapter' ),
		moduleGroup: require( '../modals/course-items/grouping/module' ),
		move: require( '../modals/course-items/move' ),
	};

	module.exports = BaseView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/items-tab' ),
		/**
		 * @property {jQuery}
		 */
		$addItemButton: null,
		/**
		 * Array of selected models for course sections
		 *
		 * @property {Backbone.Model[]}
		 */
		selected: [],
		/**
		 * Array of expanded item IDs
		 *
		 * @property {Set<Number>}
		 */
		expanded: null,
		/**
		 * Events object for current view
		 * @return {Object}
		 */
		events: function () {
			return $.extend( BaseView.prototype.events, {
				'click .tva-course-item': 'toggleItem',
				'change .tva-section-select': 'onItemSelect',
				'change #tva-check-all': 'toggleSelectAll',
			} );
		},
		/**
		 * Overwrite the parent initialize to append some bindings
		 */
		initialize: function () {
			this.listenTo( this.collection, 'reset', this.render );
			this.listenTo( this.collection, 'add', this.render );
			this.listenTo( this.collection, 'destroy', this.render );
			/**
			 * Store it as a js Set to ensure unique values and to simplify adding / removing items
			 *
			 * @type {Set<Number>}
			 */
			this.expanded = new Set();

			/**
			 * When a new model is added into the course structure at any level
			 */
			this.listenTo( this.model, 'tva.structure.modified', ( model ) => {
				this.render();
			} );

			this.listenTo( this.model, 'structure.rendered', () => {
				/**
				 * Makes sure the lesson count is correctly reflected in the course collection
				 */
				this.model.recountLessons();
			} );
		},
		/**
		 * Overwrite afterRender from parent
		 */
		afterRender: function () {
			this.$selectAll = this.$( '#tva-check-all' );
			this.$massActions = this.$( '.tva-mass-action' ).hide();
			this.$massActionsWrapper = this.$( '.tva-mass-actions' );

			this.$addItemButton = this.$( '#tva-add-item' ).append( this.updateAddItemButton( this.collection.getType() ) );

			/**
			 * Depending on the collection length show / hide massActionsWrapper
			 */
			this.$massActionsWrapper[ this.collection.length >= 1 ? 'show' : 'hide' ]();

			const $itemsWrapper = this.$( '.tva-course-items-wrapper' );
			let orderProcessed = false;
			const self = this;

			this.renderCourseStructure( this.collection, $itemsWrapper.addClass( `tva-${this.collection.getType()}-list` ) );

			/**
			 * Over callback event for sortable
			 * @param {Event} event
			 * @param {Object} ui
			 */
			function over( event, ui ) {
				ui.placeholder.css( {
					height: ui.item.outerHeight()
				} );
			}

			/**
			 * Stop callback event for sortable
			 * - used when items are sorted inside their list
			 * @param {Event} event
			 * @param {Object} ui
			 */
			function stop( event, ui ) {

				if ( orderProcessed === false && $( this ).find( '> .tva-course-item' ).length > 1 ) {
					updateItems.apply( this, arguments );
				}
			}

			/**
			 * Based on the context received
			 * - loops through items list and save their position and parent
			 * @return {{jqXHR}}
			 */
			function updateItems() {

				const $this = $( this );
				const $currentItems = $this.find( '> .tva-course-item' );
				const structureCollection = new CourseStructureCollection();

				$currentItems.each( function ( index, domItem ) {
					structureCollection.push( new Backbone.Model( {
						id: parseInt( domItem.dataset.id ),
						order: parseInt( index ),
						parent: parseInt( domItem.dataset.parentId )
					} ) );
				} );

				return structureCollection.save( null, {
					success: function ( model, data ) {
						self.collection.reset( data );
						orderProcessed = false;
					},
					error: function () {
						TVE_Dash.err( 'Something went wrong!' );
					}
				} );
			}

			/**
			 * Modules Sortable
			 */
			this.$( '.tva-modules-list' ).sortable( {
				items: '.tva_module',
				handle: '.tva-drag-handle',
				placeholder: 'tva-drag-placeholder',
				over: over,
				stop: stop
			} );

			const chapterSortable = {
				items: '.tva_chapter',
				connectWith: '.tva-chapters-list',
				handle: '.tva-drag-handle',
				placeholder: 'tva-drag-placeholder',
				over: over,
				stop: stop,
				/**
				 * Checks if the chapters list remains empty
				 * - if so, then enable lessons list so that the module can accept lessons too
				 * @param {Event} event
				 * @param {Object} ui
				 */
				remove: function ( event, ui ) {

					const $this = $( this );
					const $itemsLeft = $this.find( '> .tva-course-item' );
					const $parent = $this.parent();

					if ( $itemsLeft.length === 0 && $parent.is( '.tva_module' ) ) {
						const $lessonsList = $( '<div/>' )
							.addClass( 'tva-course-items-wrapper tva-lessons-list' )
							.sortable( lessonsSortable );
						$parent.append( $lessonsList );
					}

					if ( $itemsLeft.length ) {
						orderProcessed = true;
						updateItems.apply( this, arguments );
					}
				},
				/**
				 * Checks if the chapters list gets the first chapter item
				 * - if so, the it removes the lessons list sortable so that the module can receive
				 *   only chapters from now on
				 * @param {Event} event
				 * @param {Object} ui
				 */
				receive: function ( event, ui ) {

					const $this = $( this );
					const $parent = $this.parent();
					const $currentItems = $this.find( '> .tva_chapter' );

					if ( $parent.is( '.tva_module' ) && $currentItems.length === 1 ) {
						$parent.find( '> .tva-lessons-list' ).sortable( 'destroy' ).remove();
					}

					ui.item.attr( 'data-parent-id', $parent.data( 'id' ) );
					self.expandItems( $parent ); // make sure the receiver remains expanded

					orderProcessed = true;
					updateItems.apply( this, arguments );
				}
			};
			this.$( '.tva-chapters-list' ).sortable( chapterSortable );

			const lessonsSortable = {
				items: '.tva_lesson',
				connectWith: '.tva-lessons-list',
				handle: '.tva-drag-handle',
				placeholder: 'tva-drag-placeholder',
				over: over,
				start: function ( event, ui ) {
					/**
					 * Remove the tooltip from the lesson so that it doesn't get stuck when the user drags the element
					 */
					$( document ).find( '.tvd-material-tooltip' ).hide();
				},
				stop: stop,
				remove: function ( event, ui ) {

					const $this = $( this );
					const $parent = $this.parent();
					const $leftItems = $this.find( '> .tva-course-item' );

					if ( $leftItems.length === 0 && $parent.is( '.tva_module' ) ) {

						const $chaptersList = $( '<div/>' )
							.addClass( 'tva-course-items-wrapper tva-chapters-list' )
							.sortable( chapterSortable );

						$parent.append( $chaptersList );
					}

					if ( $leftItems.length ) {
						orderProcessed = true;
						updateItems.apply( this, arguments );
					}
				},
				/**
				 * When a lesson is dragged out from a module checks if there are other lessons left
				 * - if there is no lesson left then it means the module can accept chapters and lessons too
				 * - adds a chapters list sortable in module
				 * @param {Event} event
				 * @param {Object} ui
				 */
				receive: function ( event, ui ) {

					const $this = $( this );
					const $currentItems = $this.find( '> .tva-course-item' );
					const $parent = $this.parent();

					if ( $parent.is( '.tva_module' ) && $currentItems.length === 1 ) {
						$parent.find( '> .tva-chapters-list' ).sortable( 'destroy' ).remove();
					}

					ui.item.attr( 'data-parent-id', $parent.data( 'id' ) );
					/**
					 * Expand chapter/module and all its parents
					 */
					self.expandItems( $parent.add( $parent.parents( '.tva-course-item' ) ) );

					orderProcessed = true;
					updateItems.apply( this, arguments );
				}
			};
			this.$( '.tva-lessons-list' ).sortable( lessonsSortable );

			this.$( '.tva_module' ).droppable( {
				accept: '.tva_chapter, .tva_lesson',
				tolerance: 'touch',
				over: ( event, ui ) => {
					const $target = $( event.target ); //the place where I want to put the current draggable
					const $draggable = $( ui.draggable );//element I want to move: chapter or lesson
					const currentModuleID = $draggable.parents( '.tva_module' ).data( 'id' );
					const targetModuleID = $target.data( 'id' );

					if ( currentModuleID === targetModuleID ) {
						return;
					}

					$target.removeClass( 'tva-collapsed' );
					$target.find( '.tva_chapter' ).removeClass( 'tva-collapsed' );

					if ( $draggable.is( '.tva_chapter' ) ) {
						this.$( '.tva-chapters-list' ).css( {
							'min-height': $draggable.height()
						} );
						this.$( '.tva-chapters-list' ).sortable( 'refresh' );
					} else if ( $draggable.is( '.tva_lesson' ) ) {
						this.$( '.tva-lessons-list' ).css( {
							'min-height': $draggable.height()
						} );
						this.$( '.tva-lessons-list' ).sortable( 'refresh' );
					}
				},
			} );

			this.$( '.tva_chapter' ).droppable( {
				accept: '.tva_lesson',
				over: ( event, ui ) => {

					const $target = $( event.target ); //where I want to put the lesson
					const $draggable = $( ui.draggable ); //the lesson
					const currentChapterID = $draggable.parents( '.tva_chapter' ).data( 'id' );
					const targetChapterID = $target.data( 'id' );

					if ( currentChapterID === targetChapterID ) {
						return;
					}

					$target.removeClass( 'tva-collapsed' );

					$target.find( '.tva-lessons-list' ).css( {
						'min-height': $draggable.outerHeight()
					} );

					this.$( '.tva-lessons-list' ).sortable( 'refresh' );
				}
			} );

			/**
			 * trigger this any time the structure is re-rendered. it can be rendered from multiple sources it seems (collection add / remove, tva.structure.modified etc)
			 */
			this.model.trigger( 'structure.rendered' );
		},
		/**
		 * Mark a jQuery list of $items as expanded
		 *
		 * @param {JQuery} $items
		 */
		expandItems( $items ) {
			$items.each( ( index, item ) => {
				this.expanded.add( parseInt( item.dataset.id ) );
				item.classList.remove( 'tva-collapsed' );
			} );
		},
		/**
		 * Toggle collapsed class for current element in order to
		 * display children or not
		 */
		toggleItem: function ( event ) {

			//Because of the stop propagation the blur events is never triggered
			this.$( 'input' ).trigger( 'blur' );

			const $item = $( event.currentTarget );

			if ( $item.is( '.tva_lesson' ) || event.target.tagName === 'INPUT' ) {
				return event.stopPropagation();
			}
			const id = parseInt( event.currentTarget.dataset.id );

			$item.toggleClass( 'tva-collapsed' );

			if ( $item.hasClass( 'tva-collapsed' ) ) {
				/* if collapsed, remove it from the expanded set */
				this.expanded.delete( id );
			} else {
				/* if expanded, add it to the set */
				this.expanded.add( id );
			}
			event.stopPropagation();
		},
		/**
		 * Render course items: modules/chapters/lessons at course level(with post_parent = 0)
		 * @param {Backbone.Collection} collection
		 * @param {jQuery} $el
		 */
		renderCourseStructure: function ( collection, $el ) {

			/**
			 * Call destroy on each of the child views
			 */
			this.$$childViews.forEach( view => view.destroy() );
			this.$$childViews = [];

			collection.each( ( itemModel, index ) => {

				if ( ! ( itemModel.get( 'structure' ) instanceof CourseStructureCollection ) ) {
					itemModel.set( 'structure', new CourseStructureCollection( itemModel.get( 'structure' ) ) );
				}

				let view;

				const options = {
					model: itemModel,
					numberInList: ( index + 1 ),
					expanded: this.expanded,
					course: this.model,
				};

				switch ( itemModel.get( 'post_type' ) ) {
					case 'tva_module':
						view = new ModuleView( options );
						break;
					case 'tva_chapter':
						view = new ChapterView( options );
						break;
					case 'tva_lesson':
						view = new LessonView( options );
						break;
					default:
						view = new Backbone.View();
				}

				$el.append( view.render().$el );
				/**
				 * Store ref to view child - to call `destroy()` on it
				 */
				this.addChild( view );
			} );
		},
		/**
		 * Based on collection type sets proper label for adding new item button
		 * @param {string} collectionType
		 */
		updateAddItemButton: function ( collectionType ) {

			let label = '';

			switch ( collectionType ) {
				case 'modules':
					label = TVA.t.AddModule;
					break;
				case 'chapters':
					label = TVA.t.AddChapter;
					break;
				case 'lessons':
					label = TVA.t.AddLesson;
					break;
				default:
					label = TVA.t.AddContent;
					break;
			}

			return label;
		},
		/**
		 * Opens a proper modal for adding a new course Item
		 * - method set on HTML
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		openAddItemModal: function ( event, dom ) {

			let type = 'content';
			let parent = 0;
			let structure = this.collection;
			let modelItem = null;
			const parentId = parseInt( dom.dataset.postParent );
			const id = parseInt( dom.dataset.id );

			if ( dom.dataset.type ) {
				type = dom.dataset.type;
			}

			if ( ! isNaN( parentId ) && parentId ) {
				parent = this.collection.findItem( parentId );
				structure = parent.get( 'structure' );
			}

			if ( ! isNaN( id ) && id ) {
				modelItem = this.collection.findItem( id );
			}

			if ( ! modelItem && [ 'lesson', 'module', 'chapter' ].indexOf( type ) !== - 1 ) {
				const ItemModel = require( `./../../models/${type}` );
				modelItem = new ItemModel( {
					course_id: this.model.get( 'id' ),
					post_parent: parent ? parent.get( 'id' ) : parent,
					comment_status: parent ? parent.get( 'comment_status' ) : this.model.get( 'allows_comments' ) ? 'open' : 'closed',
					order: structure.length
				} );
			}

			this.openModal( require( './../modals/course-item' ), {
				course: this.model,
				model: modelItem,
				structure: structure
			} );

			event.stopPropagation();
		},
		/**
		 * Deletes a course item
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		deleteItem: function ( event, dom ) {

			event.stopPropagation();

			const itemModel = this.collection.findItem( parseInt( dom.dataset.id ) );
			const course = this.model;

			if ( itemModel instanceof Backbone.Model ) {
				this.openModal( ConfirmationModal, {
					template: TVE_Dash.tpl( `modals/delete-${itemModel.getType()}` ),
					confirm: function () {
						let highestParent;
						if ( itemModel.get( 'post_parent' ) > 0 ) {
							highestParent = itemModel.getHighestParent();
						}
						itemModel.destroy();
						if ( highestParent ) {
							/**
							 * Need to re-render the structure - for the count labels to be updated etc
							 */
							highestParent.collection.trigger( 'destroy', new Backbone.Model() );
						}
						/**
						 * This event will update the status of the course (published / draft) + update the state of the main "Publish" button
						 */
						course.trigger( 'tva.structure.status.changed' );

						this.close();
					}
				} );
			}
		},
		/**
		 * Updates course item status by id
		 * - defined in HTML
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		updateItemStatus: function ( event, dom ) {

			TVE_Dash.showLoader();

			let status = dom.dataset.status;
			if ( TVA.postAcceptedStatuses.indexOf( status ) === - 1 ) {
				status = 'publish';
			}

			changeStatus
				.call( this, parseInt( dom.dataset.id ), status )
				.then( ( post_parent ) => {
					return changeStatus.call( this, post_parent, status );
				} )
				.then( ( post_parent ) => {
					return changeStatus.call( this, post_parent, status )
				} )
				.catch( () => {
					this.model.trigger( 'tva.structure.status.changed' );
					this.render();
					TVE_Dash.hideLoader();
				} );
		},
		/**
		 * Triggered when a checkbox is ticked / unticked
		 *
		 * @param {jQuery.Event} event
		 */
		onItemSelect( event ) {
			const checkbox = event.currentTarget;
			const $section = $( checkbox.closest( '.tva-course-item' ) );

			/**
			 * Toggle all the children of the current section as selected or not
			 */
			$section.find( 'input.tva-section-select' ).not( checkbox ).prop( 'checked', checkbox.checked );

			/**
			 * Mark the direct parent of the selected item as not selected if any of its children are not selected.
			 */
			if ( ! checkbox.checked ) {
				$section.parents( '.tva-course-item' )
				        .find( '> .tva-cm-box input.tva-section-select' )
				        .prop( 'checked', false );
			}

			this.onSelectionChange();
		},
		/**
		 * Select or un-select all items
		 *
		 * @param {jQuery.Event} event
		 */
		toggleSelectAll( event ) {
			this.$( 'input.tva-section-select' ).prop( 'checked', event.currentTarget.checked );
			this.onSelectionChange();
		},
		/**
		 * Toggle elements for mass-actions
		 */
		onSelectionChange() {
			this.selected = [];
			this.$( 'input.tva-section-select:checked' ).each( ( index, input ) => this.selected.push( this.collection.findItem( input.dataset.itemId ) ) );
			this.$selectAll.prop( 'checked', this.selected.length && this.selected.length === this.$( 'input.tva-section-select' ).length );

			if ( ! this.selected.length ) {
				this.$massActions.fadeOut( 100 );
				return;
			}

			this.$massActions.filter( '[data-fn="massAction"]' ).fadeIn( 100 );

			/* some special cases */
			const selectedModules = this.selected.filter( item => item.getType() === 'module' );
			const selectedChapters = this.selected.filter( item => item.getType() === 'chapter' );
			const selectedLessons = this.selected.filter( item => item.getType() === 'lesson' );
			const firstHighestParent = this.selected[ 0 ].getHighestParent();
			/**
			 * Whether or not all selected lessons are part of the same module
			 */
			const sameModuleSelection = selectedLessons.every( item => item === item.getHighestParent() || item.getHighestParent() === firstHighestParent );

			let showChapterGrouping = false;
			let showModuleGrouping = false;
			let showMove = false;
			let showPublish = false;
			let showUnpublish = false;

			if ( selectedModules.length === 0 ) {
				/**
				 * 1. if only lessons from the same module are selected show the "Group into chapter" control
				 */
				if ( selectedModules.length === 0 && selectedChapters.length === 0 && sameModuleSelection ) {
					showChapterGrouping = true;
				}

				/**
				 * 2a. if there are only lessons selected, and no chapters ==> show "group into module"
				 */
				if ( selectedChapters.length === 0 && selectedLessons.length ) {
					showModuleGrouping = true;
				} else if ( selectedChapters.length ) {
					/**
					 * 2b. if for each selected chapter, the full list of lessons is selected ==> show "group into module"
					 * and for every selected lesson, its chapter is also selected.
					 */

					showModuleGrouping = selectedChapters.every( chapter => {
						/* check that each lesson from chapter is selected */
						return chapter.get( 'structure' ).every( lesson => selectedLessons.includes( lesson ) );
					} );

					showModuleGrouping = showModuleGrouping && selectedLessons.every( lesson => {
						/* check that the corresponding chapter is selected */
						return selectedChapters.includes( lesson.getParent() );
					} );
				}
			}
			/**
			 * 3. Move items -> if only lessons, or only chapters, or modules are selected
			 */
			showMove = showChapterGrouping || showModuleGrouping;
			if ( ! showMove && selectedModules.length ) {
				/**
				 * make sure that for each selected item, the corresponding module is selected. if that is not the case, the selection cannot be moved.
				 */
				showMove = this.selected.every( item => selectedModules.includes( item.getModule() ) );
			}

			showPublish = showUnpublish = selectedLessons.length > 0;

			this.$massActions.filter( '.chapter-group' )[ showChapterGrouping ? 'fadeIn' : 'fadeOut' ]( 100 );
			this.$massActions.filter( '.module-group' )[ showModuleGrouping ? 'fadeIn' : 'fadeOut' ]( 100 );
			this.$massActions.filter( '.mass-move' )[ showMove ? 'fadeIn' : 'fadeOut' ]( 100 );
			this.$massActions.filter( '.publish-group' )[ showPublish ? 'show' : 'hide' ]();
			this.$massActions.filter( '.unpublish-group' )[ showUnpublish ? 'show' : 'hide' ]();
		},
		/**
		 * Trigger a mass-action
		 *
		 * @param {jQuery.Event} event
		 */
		massAction( event ) {
			if ( ! this.selected || ! this.selected.length ) {
				return false;
			}
			const action = event.currentTarget.dataset.action;
			const message = TVA.t[ `success_items_${action}` ];

			const send = () => {
				const $wrapper = this.$( '.tva-course-items-wrapper' ).first().tvaToggleLoader( 60 );

				return wp.apiRequest( {
					url: `${TVA.routes.courses}/bulk_action`,
					type: 'post',
					data: {
						course_id: this.model.get( 'id' ),
						items: [ 'publish', 'unpublish' ].includes( action ) ? this.getSelectedIdsForPublish() : this.getSelectedIds(),
						action: action,
					}
				} ).done( response => {
					switch ( action ) {
						case 'publish':
						case 'unpublish':
							response.forEach( id => {
								const item = this.collection.findItem( id );
								if ( item ) {
									item.set( 'post_status', action === 'publish' ? action : 'draft' );
								}
							} );
							break;
					}
					$wrapper.tvaToggleLoader( false );
					TVE_Dash.success( message );
					requestAnimationFrame( this.onSelectionChange.bind( this ) );
					this.model.trigger( 'tva.structure.status.changed' );//handles publish button
					this.render();
				} );
			};

			const self = this;
			if ( action === 'delete' ) {
				this.openModal( ConfirmationModal, {
					template: TVE_Dash.tpl( `modals/delete-confirmation` ),
					confirm() {
						this.close();
						requestAnimationFrame( () => {
							send().done( response => {
								self.model.get( 'structure' ).reset( response.structure );
								self.model.trigger( 'tva.structure.status.changed' ); //handles publish button and course status
							} );
						} );
					}
				} );
			} else {
				send();
			}

			return false;
		},
		/**
		 * Open modal for grouping items into a chapter or module
		 *
		 * @param event
		 */
		structureAction( event ) {
			this.openModal( modals[ event.currentTarget.dataset.action ], {
				parent: this,
			} );
		},

		/**
		 * Get an array of IDs for the selected course items
		 *
		 * @return {Number[]}
		 */
		getSelectedIds() {
			return this.selected.map( item => item.get( 'ID' ) );
		},
		/**
		 * Get an array of IDS for publish / unpublish actions
		 *
		 * @returns {Number[]}
		 */
		getSelectedIdsForPublish() {
			return this.selected.map( item => {

				if ( item.get( 'post_type' ) === 'tva_lesson' || item.get( 'structure' ).findItemsByOptions( {
					post_type: 'tva_lesson',
				} ).length > 0 ) {
					return item.get( 'ID' );
				}
			} ).filter( value => value ); // make sure no empty values are returned
		},
	} );

	/**
	 * Changes status for an course item by item's id
	 * @param {number} id
	 * @param {string} status
	 * @return {Promise}
	 */
	function changeStatus( id, status = 'draft' ) {

		const itemModel = this.collection.findItem( id );
		const parentModel = this.collection.findItem( itemModel.get( 'post_parent' ) );

		return new Promise( ( resolve, reject ) => {
			itemModel.save( {post_status: status}, {
				patch: true,
				success: () => {

					//if one item is published and its parent is draft then publish the parent too
					if ( status === 'publish' && parentModel && parentModel.get( 'post_status' ) === 'draft' ) {
						return resolve( parentModel.get( 'id' ) );
					}

					//if all items are draft then draft the parent too
					if ( status === 'draft' && parentModel
					     && parentModel.get( 'structure' ).length === parentModel.get( 'structure' ).where( {
							post_status: 'draft'
						} ).length
					) {
						return resolve( parentModel.get( 'id' ) );
					}

					reject();
				},
				error: () => {
					reject();
				}
			} );
		} );
	}

} )( jQuery );
