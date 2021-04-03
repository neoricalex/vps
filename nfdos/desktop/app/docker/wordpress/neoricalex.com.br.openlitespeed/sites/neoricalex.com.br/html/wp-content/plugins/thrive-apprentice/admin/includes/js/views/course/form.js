( function ( $ ) {

	const CourseModel = require( './../../models/course' );
	const DropDownView = require( './../select' );
	const SelectCollection = require( './../../collections/select' );
	const postSearch = require( './../../post-search' );
	const TabsView = require( './../tabs' );
	const StructureCollection = require( './../../collections/structure' );
	const ContentBase = require( './../content-base' );
	const BaseModel = require( './../../models/base' );

	/**
	 * {{Backbone.View}} for topics dropdown
	 */
	const TopicsDropdownView = DropDownView.extend( {
		renderThumbs: true,
		label: TVA.t.topic
	} );

	/**
	 * {{Backbone.View}} for author dropdown
	 */
	const AuthorDropdown = DropDownView.extend( {
		/**
		 * @property {boolean} display the thumb for current author
		 */
		renderThumbs: true,
		/**
		 * Label of view
		 */
		label: TVA.t.author,
		/**
		 * Extend functionality of parent just to render search author input
		 */
		initialize: function () {
			DropDownView.prototype.initialize.apply( this, arguments );
			this.on( 'tva.display.list', this.renderSearchInput );
			/**
			 * if the avatar is changed in details tab then updates it in here too
			 */
			this.listenTo( this.model, 'change:avatar_url', this.render );
		},
		/**
		 * Render Search input instead of items list
		 * - initialize PostSearch on input for author searching
		 * @param {jQuery} $wrapper
		 */
		renderSearchInput: function ( $wrapper ) {

			const $searchInput = $( '<input type="text"/>' )
				.attr( 'placeholder', TVA.t.search_uses );

			$wrapper.empty().append( $searchInput );
			requestAnimationFrame( () => $searchInput.focus() );

			new postSearch( $searchInput, {
				url: TVA.apiSettings.root + TVA.apiSettings.v1 + '/courses/search_users/',
				type: 'POST',
				renderItem: function ( ul, item ) {
					return $( "<li class='tvd-truncate'/>" ).append( "<span class='tva-ps-result-title'>" + item.name + "</span><span class='tva-ps-result-email ml-5'>" + "(" + item.email + ")" + "</span>" ).appendTo( ul );
				},
				select: ( event, ui ) => {

					const data = ui.item;
					data.biography_type = 'wordpress_bio';

					const author = new Backbone.Model( data );

					this.collection.push( author );
					this.collection.setSelected( author );
					this.model = author;

					/**
					 * listen to newly selected model because this view is not
					 * re-instantiated and initialize() method is not called
					 */
					this.listenTo( this.model, 'change:avatar_url', this.render );

					/**
					 * render selected author
					 */
					this.render();

					/**
					 * call this function to hide/remove list wrapper with search input
					 */
					this.displayList();
					this.trigger( 'tva.course.author.changed', author );
				},
			} );
		}
	} );

	/**
	 * {{Backbone.View}} for levels dropdownb
	 */
	const LevelsDropdown = DropDownView.extend( {
		label: TVA.t.difficulty
	} );

	/**
	 * View Dropdowns
	 *
	 * @type {Array}
	 */
	const dropdowns = [];

	/**
	 * Main {{Backbone.View}} for single course form
	 */
	module.exports = ContentBase.extend( {
		/**
		 * CSS class name for the mail element of this view
		 * @property {string}
		 */
		className: 'tva-course-form',
		/**
		 * @property {jQuery}
		 */
		$dropdowns: null,
		/**
		 * Underscore Template
		 */
		template: TVE_Dash.tpl( 'courses/form' ),
		/**
		 * @property {jQuery}
		 */
		$courseTitle: null,
		/**
		 * @property {jQuery}
		 */
		$publishButton: null,
		/**
		 * Which tab should be displayed
		 */
		selectedIndex: 0,
		/**
		 * Fetches the model from DB
		 * @see factoryView()
		 * @param {Object} options
		 */
		initialize: function ( options ) {


			this.$el.on( 'click', event => {
				this.closeDropdowns();
			} );

			if ( options && ! options.model && options.id ) {

				const model = TVA.courses.findWhere( {id: parseInt( options.id )} );
				if ( model && model.get( 'fetched' ) ) {
					this.model = model;
					this.listenTo( this.model, 'tva.structure.status.changed', this.onStructureStatusChanged );
					return this.renderForm();
				}

				TVE_Dash.showLoader();

				this.model = new CourseModel( parseInt( options.id ) );
				/**
				 * if the model has been fetched from server
				 */
				this.listenTo( this.model, 'tva.course.fetch.success', this.renderForm );

				/**
				 * if the model has not been fetched from server and an error occurred
				 */
				this.listenTo( this.model, 'tva.course.fetch.error', () => {
					this.$el.html( 'course could not be loaded' );
					TVE_Dash.hideLoader();
				} );

				/**
				 * When a course item has been un/published
				 * - handles course publish button
				 */
				this.listenTo( this.model, 'tva.structure.status.changed', this.onStructureStatusChanged );
			}

			$.extend( true, this, options );
		},
		/**
		 * Overwrite the destroy method
		 *
		 * Cancel all the model changes
		 */
		destroy: function () {
			this.model.restoreState( true );

			ContentBase.prototype.destroy.apply( this, arguments );
		},
		/**
		 * Overwrite parent render
		 * @return {*}
		 */
		render: function () {
			this.afterRender();
			return this;
		},
		/**
		 * Displays the form HTML for fetched course
		 */
		renderForm: function () {

			/**
			 * Updates the model in list so that any changes are visible in list too
			 * - changing title/status/etc should be visible in list too
			 */
			TVA.courses.replace( this.model );

			this.$el.html( this.template( {
				model: this.model
			} ) );

			TVE_Dash.data_binder( this );

			this.$dropdowns = this.$( '#tva-course-dropdowns' );
			this.$courseTitle = this.$( '#tva-course-title' );
			this.$publishButton = this.$( '#tva-course-publish' );

			dropdowns.push( this.handleTopics() );
			dropdowns.push( this.handleAuthor() );
			dropdowns.push( this.handleLevels() );

			this.addChild( dropdowns );

			this.renderTabs();
			this.handlePublishButton();

			TVE_Dash.hideLoader();
		},

		/**
		 * Closes the view dropdowns
		 */
		closeDropdowns: function () {

			dropdowns.forEach( dropdown => {
				dropdown.closeSelect();
			} )
		},

		/**
		 * Handles dropdown of authors
		 */
		handleAuthor: function () {

			const authorList = new AuthorDropdown( {
				/**
				 * pass the course author for later events/binds
				 */
				collection: new SelectCollection( [ this.model.get( 'author' ).set( 'selected', true ) ] )
			} );

			authorList.on( 'tva.course.author.changed', ( newAuthorModel ) => {
				this.model.set( 'author', newAuthorModel );
				if ( ! this.model.get( 'id' ) ) {//new course
					return;
				}
				authorList.$el.tvaToggleLoader();
				const courseStructure = this.model.get( 'structure' );
				this.model.save( null, {
					success: () => {
						this.model.set( 'structure', courseStructure );
						authorList.closeSelect();
					}
				} ).done( () => {
					authorList.$el.tvaToggleLoader();
					TVE_Dash.success( TVA.t.author_saved );
				} );
			} );

			authorList.on( 'tva.before.display.list', this.closeDropdowns );

			this.$dropdowns.append( authorList.render().$el );

			return authorList;
		},
		/**
		 * Renders current course's level of difficulty and Levels List
		 */
		handleLevels: function () {
			/**
			 * initialize a dropdown view with a select collection
			 * which has a selected item to be rendered
			 */
			const levelsList = new LevelsDropdown( {
				/**
				 * Enable the "Add new item" section
				 */
				add_item: {
					str: {
						title: TVA.t.addDifficultyLevel,
						save: TVA.t.saveLevel,
						err: TVA.t.EmptyName,
					},
					getModelForSave() {
						const newLevel = new BaseModel( {
							name: this.$input.val(),
						} );

						newLevel.url = () => `${TVA.apiSettings.root}${TVA.apiSettings.v1}/levels`;

						return newLevel;
					},
					afterSave( response ) {
						/* so that the next time the dropdown is rendered, the new item will be included */
						TVA.levels.push( response );
					},
					addToCollection( response ) {
						this.dropdown.collection.add( response );
					}
				},
				/**
				 * @property {boolean} items in this dropdown are deletable
				 */
				deletable: true,
				/**
				 * @property {SelectCollection} collection of items
				 */
				collection: ( function ( id ) {
					const levels = new SelectCollection( TVA.levels );
					let selectedLevel = levels.findWhere( {id: id} );
					if ( ! selectedLevel ) {
						selectedLevel = levels.first();
					}
					levels.setSelected( selectedLevel );
					return levels;
				} )( parseInt( this.model.get( 'level' ) ) ),
				/**
				 * Deletes level item
				 * - if the item is set on current course model then set the first item instead
				 * @param {Event} event
				 * @param {HTMLElement} dom
				 * @return {Backbone.View}
				 */
				deleteItem: function ( event, dom ) {
					event.stopPropagation();
					const id = parseInt( dom.dataset.id );
					if ( isNaN( id ) ) {
						return this;
					}
					const model = this.collection.findWhere( {id: id} );
					if ( ! ( model instanceof BaseModel ) ) {
						return this;
					}
					model.url = `${TVA.apiSettings.root}${TVA.apiSettings.v1}/levels/${id}`;
					//cannot remove last item
					if ( this.collection.length === 1 ) {
						return TVE_Dash.err( TVA.t.lastItemDelete );
					}
					const $item = this.$( `.${this.listItemCssClass}[data-id="${model.get( 'id' )}"]` ).tvaToggleLoader();
					model.destroy( {
						success: ( m ) => {
							/* also remove the level from `TVA.levels` */
							TVA.levels = TVA.levels.filter( level => parseInt( level.id ) !== model.get( 'id' ) );
							if ( m.get( 'selected' ) ) {
								this.selectItem( this.collection.first(), true );
							}
							$item.remove();
							TVE_Dash.success( TVA.t.level_deleted );
						}
					} );
				}
			} );

			/**
			 * If a level is selected then set on current model and save the course in DB
			 */
			levelsList.on( 'tva.dropdown.item.selected', ( model, collection, partialRender ) => {
				if ( parseInt( model.get( 'id' ) ) === parseInt( this.model.get( 'level' ) ) ) {
					return;
				}
				this.model.set( 'level', parseInt( model.get( 'id' ) ) );
				if ( ! this.model.get( 'id' ) ) {//course is new
					return;
				}
				levelsList.$el.tvaToggleLoader();
				const courseStructure = this.model.get( 'structure' );
				this.model.save( null, {
					success: () => this.model.set( 'structure', courseStructure )
				} ).done( () => {
					levelsList.$el.tvaToggleLoader( false );
					if ( ! partialRender ) {
						TVE_Dash.success( TVA.t.level_saved );
					}
				} );
			} );

			levelsList.on( 'tva.before.display.list', this.closeDropdowns );
			this.$dropdowns.append( levelsList.render().$el );

			return levelsList;
		},
		/**
		 * Renders Topics Dropdown
		 * - saves the selected item
		 */
		handleTopics: function () {
			/**
			 * initialize a dropdown view with a select collection
			 * which has a selected item to be rendered
			 */
			const topicsList = new TopicsDropdownView( {
				/**
				 * Enable "Add new item" section
				 */
				add_item: {
					str: {
						title: TVA.t.addNewTopic,
					},
					template: _.template( `<div><a class="tva-add-topic" href="#courses/topics">${TVA.Utils.icon( 'plus-circle' ) + TVA.t.addNewTopic}</a></div>` ),
				},
				collection: ( function ( id ) {
					const collection = new SelectCollection( TVA.topics.toJSON() );
					collection.setSelectedId( id );

					return collection;
				} )( parseInt( this.model.get( 'topic' ) ) )
			} );
			/**
			 * if a model in collection is selected
			 * then set it on course model and save the course
			 */
			topicsList.on( 'tva.dropdown.item.selected', ( model ) => {
				if ( parseInt( this.model.get( 'topic' ) ) === parseInt( model.get( 'id' ) ) ) {
					return;
				}
				this.model.set( 'topic', parseInt( model.get( 'id' ) ) );

				if ( this.model.get( 'id' ) ) {
					topicsList.$el.tvaToggleLoader();
					const courseStructure = this.model.get( 'structure' );
					this.model.save( null, {
						success: () => this.model.set( 'structure', courseStructure )
					} ).done( () => {
						TVE_Dash.success( TVA.t.topic_saved );
						topicsList.$el.tvaToggleLoader();
					} );
				}
			} );

			topicsList.on( 'tva.before.display.list', this.closeDropdowns );

			/**
			 * append the dropdown to current form
			 */
			this.$dropdowns.append( topicsList.render().$el );

			return topicsList;
		},
		/**
		 * Handles logic for the case when edit title icon  is clicked
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 */
		editTitle: function ( event, dom ) {

			const $span = $( dom ).hide();
			const $title = $span.prev().hide();
			const $next = $span.next().show();
			const $label = $next.find( 'label' );
			const $input = $next.find( '> input' )
			                    .val( this.model.get( 'name' ) )
			                    .focus()
			                    .select();

			const currentStructure = this.model.get( 'structure' );

			function saveTitle() {

				if ( ! this.model.get( 'id' ) ) {
					return;
				}

				this.saveCourse( null, null, {
					success: ( model ) => {
						TVE_Dash.hideLoader();
						$title.html( model.get( 'name' ) ).show();
						$next.hide();
						$span.css( {display: 'inline-block'} );
						$label.text( '' );
						this.model.set( 'structure', currentStructure );
					}
				} );
			}

			$input
				.off( 'keyup' )
				.on( 'keyup', ( event ) => {
					if ( event.keyCode === 13 ) {
						saveTitle.call( this );
					}
				} )
				.off( 'blur' )
				.on( 'blur', _.bind( saveTitle, this ) );
		},
		/**
		 * Render tabs with their views
		 */
		renderTabs: function () {

			if ( ! ( this.model.get( 'structure' ) instanceof StructureCollection ) ) {
				this.model.set( 'structure', new StructureCollection( this.model.get( 'structure' ) ) );
			}

			const slugs = Backbone.history.getFragment().split( '/' );
			if ( slugs.length === 3 && slugs[ 2 ] === 'new' ) {
				this.selectedIndex = 1;
			}

			const tabsView = new TabsView( {
				course: this.model,
				selectedIndex: this.selectedIndex || 0,
				collection: new Backbone.Collection( [
					{
						name: TVA.t.courseDetails,
						icon: 'info-circle_light',
						view: new ( require( './details-tab-content' ) )( {
							model: this.model
						} )
					},
					{
						name: TVA.t.content,
						icon: 'list_light',
						view: new ( require( './items-tab-content' ) )( {
							model: this.model,
							collection: this.model.get( 'structure' )
						} )
					},
					{
						name: TVA.t.accessRestrictions,
						icon: this.model.get( 'is_private' ) ? 'lock-alt_light' : 'unlock-alt_light',
						view: new ( require( './access-tab-content' ) )( {
							model: this.model,
							changeModel: function () {
								tabsView.changeIcon( tabsView.getSelected(), TVA.Utils.icon( this.model.get( 'is_private' ) ? 'lock-alt_light' : 'unlock-alt_light' ) );
							}
						} )
					}
				] )
			} );

			tabsView.on( 'tab.selected.index', ( index ) => {
				this.$( '[data-fn="saveCourse"]' ).parent().css( {
					display: index === 1 ? 'none' : ''
				} );
			} );

			this.$el.append( tabsView.render().$el );

			this.addChild( tabsView );
		},
		/**
		 * This should be the single method to be called to save a course
		 * - defined in HTML
		 * - can be called from view
		 * @param event
		 * @param dom
		 * @param options
		 * @return {false|{jqXHR}}
		 */
		saveCourse: function ( event, dom, options = {} ) {

			//prevent showing loader if model is invalid
			if ( ! this.model.isValid() ) {
				return false;
			}

			const changedAttributes = this.model.changedAttributes();

			if ( changedAttributes !== false && Object.keys( changedAttributes ).includes( 'allows_comments' ) ) {
				this.model.get( 'structure' ).updateChildrenCommentStatus( this.model.get( 'id' ), this.model.get( 'allows_comments' ), 'course' );
			}

			TVE_Dash.showLoader();
			const currentCourseStructure = this.model.get( 'structure' );

			/**
			 * if course is private then no need to keep rules set in db
			 */
			if ( ! this.model.get( 'is_private' ) ) {
				this.model.get( 'rules' ).resetRules();
			}

			const _defaults = {
				success: () => {
					TVE_Dash.hideLoader();
					this.$( '#tva-course-preview' ).attr( 'href', this.model.get( 'preview_url' ) );
					this.model.set( 'structure', currentCourseStructure );
					TVE_Dash.success( TVA.t.courseSaved );
				},
				error: ( model, response ) => {
					TVE_Dash.hideLoader();
					let specificError = '';
					if ( response && response.responseJSON ) {
						specificError = response.responseJSON.message;
					}
					TVE_Dash.err( TVA.t.courseNotSaved + specificError );
				}
			};

			return this.model.save( null, $.extend( _defaults, options ) );
		},
		/**
		 * Based on current course status draft/publish saves a new status for course
		 * - defined in HTML
		 * - when user clicks the publish button
		 */
		changeStatus: function () {

			const currentStatus = this.model.get( 'status' );
			const currentStructure = this.model.get( 'structure' );

			this.model.set( 'status', currentStatus === 'draft' ? 'publish' : 'draft' );

			TVE_Dash.showLoader();

			this.model.save( null, {
				success: () => {
					this.model.set( 'structure', currentStructure );
					this.handlePublishButton( 1 );
					TVE_Dash.hideLoader();
				}
			} );
		},
		/**
		 * Based on current publish lessons sets different css class on button
		 */
		handlePublishButton: function ( publishedLessons ) {

			publishedLessons = parseInt( publishedLessons );

			if ( isNaN( publishedLessons ) ) {
				publishedLessons = this.model.get( 'structure' ).findItemsByOptions( {
					post_type: 'tva_lesson',
					post_status: 'publish',
				} ).length;
			}

			const courseStatus = this.model.get( 'status' );

			if ( publishedLessons && courseStatus === 'draft' ) {
				this.$publishButton
				    .removeAttr( 'disabled' )
				    .removeClass( 'tva-btn-red disabled' )
				    .addClass( 'tva-btn-green' )
				    .text( TVA.t.publish )
				;
			} else if ( publishedLessons && courseStatus === 'publish' ) {
				this.$publishButton
				    .removeAttr( 'disabled' )
				    .removeClass( 'tva-btn-green disabled' )
				    .addClass( 'tva-btn-red' )
				    .text( TVA.t.unpublish )
				;
			} else {
				this.$publishButton
				    .attr( 'disabled', 'disabled' )
				    .removeClass( 'tva-btn-green tva-btn-red' )
				    .text( TVA.t.publish )
				;
			}
		},
		/**
		 * Handles publish button on a custom event triggered on current course model
		 */
		onStructureStatusChanged: function () {

			const publishedLessons = this.model.get( 'structure' ).findItemsByOptions( {
				post_type: 'tva_lesson',
				post_status: 'publish',
			} ).length;

			if ( publishedLessons === 0 ) {
				TVE_Dash.showLoader();
				const currentStructure = this.model.get( 'structure' );
				this.model
				    .set( 'status', 'draft' )
				    .save( null, {
					    success: () => {
						    this.model.set( 'structure', currentStructure );
						    this.handlePublishButton( publishedLessons );
						    TVE_Dash.hideLoader();
					    }
				    } );
			} else {
				this.handlePublishButton();
			}
		},

		/**
		 * Handles author change action
		 */
		onAuthorChanged: function ( model ) {
			const dropdown = dropdowns[ 1 ]; // We know for sure that this index holds author view
			const authorModel = model instanceof Backbone.Model ? model : this.model.get( 'author' );

			if ( dropdown instanceof Backbone.View && typeof dropdown.model.get( 'avatar_url' ) !== 'undefined' ) {
				dropdown.model.set( authorModel.toJSON(), {silent: true} );

				dropdown.render();
			}
		}
	} );
} )( jQuery );
