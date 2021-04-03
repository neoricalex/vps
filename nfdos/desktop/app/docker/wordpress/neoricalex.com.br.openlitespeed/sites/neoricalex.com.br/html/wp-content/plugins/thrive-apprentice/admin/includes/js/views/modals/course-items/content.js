( function ( $ ) {

	const StructureCollection = require( './../../../collections/structure' );
	const ModalSteps = require( './../steps-modal' );

	/**
	 * When the structure type has not been decided yet and the course has no item
	 * - helps user decide what type of item should be added first
	 * - modal with two steps
	 * - on save adds the newly model to structure collection
	 * @type {Backbone.View}
	 */
	module.exports = ModalSteps.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'modals/courses/content' ),
		warningTemplate: TVE_Dash.tpl( 'courses/merge-warning' ),
		/**
		 * @property {jQuery} dropdown where parent modules from structure are rendered/appended¬ to
		 */
		$parentsSelect: null,
		/**
		 * @property {jQuery} element for display text accordingly with structure a new item model
		 */
		$description: null,
		/**
		 * @property {StructureCollection}
		 */
		targetStructure: null,
		/**
		 * @property {Object} events
		 */
		events: $.extend( ModalSteps.prototype.events, {
			/**
			 * Sets parent id to current model
			 * - renders a new dropdown with children models
			 * @param {Event} event
			 */
			'change #tva-parent-target': function ( event ) {

				$( event.currentTarget ).siblings( '#tva-child-target' ).select2( 'destroy' ).remove();

				const parentId = isNaN( parseInt( event.currentTarget.value ) ) ? 0 : parseInt( event.currentTarget.value );
				const parentModel = this.structure.findItem( parentId );

				//set the value to model for the case when use selects the first option(select module)
				this.itemModel.set( 'post_parent', parentId );

				if ( parentModel && parentModel.get( 'structure' ) instanceof StructureCollection ) {
					this.targetStructure = parentModel.get( 'structure' );
				}

				//render the second dropdown only for chapters
				if ( parentModel && parentModel.getType() === 'module' && parentModel.get( 'structure' ).getType() === 'chapters' ) {

					//sets the parent back to zero to force user pick a chapter parent
					this.itemModel.set( 'post_parent', 0 );

					const $select = $( '<select/>' )
						.attr( 'id', 'tva-child-target' )
						.append( `<option value="">${TVA.t.SelectChapter}</option>` )
						.on( 'change', ( event ) => {

							const chapterId = isNaN( parseInt( event.currentTarget.value ) ) ? 0 : parseInt( event.currentTarget.value );
							const chapterModel = this.structure.findItem( chapterId );

							this.itemModel.set( 'post_parent', chapterId );

							if ( chapterModel && chapterModel.get( 'structure' ) instanceof StructureCollection ) {
								this.targetStructure = chapterModel.get( 'structure' );
							}
						} );

					this.$step.find( '.tvd-modal-content' ).append( $select );

					parentModel.get( 'structure' ).each( ( model ) => {
						$select.append( `<option value="${model.get( 'id' )}">${model.get( 'post_title' )}</option>` );
					} );

					$select.select2();
				}
			}
		} ),
		/**
		 * Implement after render
		 * - reads some elements from template
		 */
		afterRender: function () {
			ModalSteps.prototype.afterRender.apply( this, arguments );
			this.$description = this.$( '#tva-item-description' );
			this.$parentsSelect = this.$( '#tva-parent-target' );
			return this;
		},
		/**
		 * Based on post type chosen renders specific views
		 * @param {Event} even
		 * @param {HTMLElement} dom
		 */
		decisionMaking: function ( even, dom ) {

			const type = dom.dataset.type;
			const ItemModel = require( `./../../../models/${type}` );

			this.itemModel = new ItemModel( {
				course_id: this.course.get( 'id' ),
				order: this.structure.length
			} );

			if ( this.structure.length === 0 ) {
				this.gotoStep( 2 );
				return this.renderForm();
			}

			switch ( this.itemModel.getType() ) { //user wanna add course item
				case 'lesson':
					switch ( this.structure.getType() ) { //into a structure of
						case 'lessons':
							this.next();
							return this.renderForm();
						case 'chapters':
						case 'modules':
							return this.renderParentsDropDowns();
					}
					break;
				case 'chapter':
					switch ( this.structure.getType() ) { //into a structure of
						case 'chapters':
							this.next();
							return this.renderForm();
						case 'modules':
							return this.renderParentsDropDowns();
						case 'lessons':
							this.itemModel.set( 'merge_items', this.structure.pluck( 'id' ) );
							const publishedLessons = this.structure.where( {
								post_status: 'publish'
							} );
							this.itemModel.set( 'post_status', publishedLessons.length > 0 ? 'publish' : 'draft' );
							return this.renderWarning();
					}
					break;
				case 'module':
					switch ( this.structure.getType() ) { //into a structure of
						case 'lessons':
						case 'chapters':
							this.itemModel.set( 'merge_items', this.structure.pluck( 'id' ) );
							const publishedChildren = this.structure.where( {
								post_status: 'publish'
							} );
							this.itemModel.set( 'post_status', publishedChildren.length > 0 ? 'publish' : 'draft' );
							return this.renderWarning();
						case 'modules':
							this.next();
							return this.renderForm();
					}
					break;
				default:
					break;
			}
		},
		/**
		 * What happens after post parent has been selected by user
		 * @return {*}
		 */
		parentSet: function () {

			if ( this.itemModel.get( 'merge_items' ) ) {
				this.next();
				this.renderForm();
				return;
			}

			const structureType = this.targetStructure ? this.targetStructure.getType() : this.structure.getType();

			if ( ! this.itemModel.get( 'post_parent' ) ) {
				return TVE_Dash.err( TVE_Dash.sprintf( TVA.t.PleaseSelect, structureType === 'modules' ? TVA.t.module : TVA.t.chapter ) );
			}

			if ( this.targetStructure.getType() === 'lessons' && this.itemModel.getType() === 'chapter' ) {

				const publishedChildren = this.structure.where( {
					post_status: 'publish'
				} );

				this.itemModel.set( 'post_status', publishedChildren.length > 0 ? 'publish' : 'draft' );
				this.itemModel.set( 'merge_items', this.targetStructure.pluck( 'id' ) );

				return this.renderWarning();
			}

			this.next();
			this.renderForm();
		},
		/**
		 * Renders parents dropdown
		 */
		renderParentsDropDowns: function () {

			this.$parentsSelect.empty();

			switch ( this.structure.getType() ) {
				case 'chapters':
					this.$description.text( `In which chapter you would like to add your lesson` );
					this.$parentsSelect.append( $( `<option value="">${TVA.t.SelectChapter}</option>` ) );
					break;
				case 'modules':
					this.$description.text( TVE_Dash.sprintf( TVA.t.WhichModule, this.itemModel.getType() ) );
					this.$parentsSelect.append( $( `<option value="">${TVA.t.SelectModule}</option>` ) );
					break;
			}

			this.structure.each( ( model ) => {
				this.$parentsSelect.append( $( `<option value="${model.get( 'id' )}">${model.get( 'post_title' )}</option>` ) );
			} );

			this.$parentsSelect.select2();
		},
		/**
		 * renders renders warning that the existing items
		 * will be moved to newly created item
		 */
		renderWarning: function () {
			this.$step.find( '.tvd-modal-content' ).html( this.warningTemplate() );
		},
		backToStepZero: function () {
			this.gotoStep( 0 );
		},
		/**
		 *
		 */
		renderForm: function () {

			const FormView = require( `./../../course/forms/${this.itemModel.getType()}` );
			const formView = new FormView( {
				el: this.$step.find( '> .tvd-modal-content' ),
				model: this.itemModel
			} );

			formView.render();
		},
		/**
		 * Saves the model in DB
		 * - adds it to parent/course structure
		 */
		save: function () {

			const xhr = this.itemModel.save( null, {
				success: ( model ) => {

					if ( this.targetStructure ) {

						if ( this.targetStructure.getType() === 'lessons' && model.getType() === 'chapter' ) {

							const currentStructure = new StructureCollection( this.targetStructure.toJSON() );

							currentStructure.updateModels( {
								post_parent: model.get( 'id' )
							} );

							model.set( 'structure', currentStructure );

							this.targetStructure.reset( [ this.itemModel ] );

						} else {
							this.targetStructure.add( model );
						}
					} else if ( model.get( 'merge_items' ) ) {

						const currentStructure = new StructureCollection( this.structure.toJSON() );

						currentStructure.updateModels( {
							post_parent: model.get( 'id' )
						} );

						model.set( 'structure', currentStructure );

						this.structure.reset( [ this.itemModel ] );
					} else {
						this.structure.add( model );
					}

					const _cModel = TVA.courses.findWhere( {id: this.course.get( 'id' )} );
					if ( _cModel ) {
						_cModel.trigger( 'tva.structure.modified', model );
					}
				}
			} );

			if ( xhr ) {
				TVE_Dash.showLoader();
				xhr.always( () => {
					this.close();
					TVE_Dash.hideLoader()
				} );
			}
		}
	} );
} )( jQuery );
