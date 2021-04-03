( function ( $ ) {

	const BaseModal = require( './base' );
	const StructureCollection = require( './../../collections/structure' );

	/**
	 * Modal for adding and editing course item
	 * @type {jQuery|*|void}
	 */
	module.exports = BaseModal.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'modals/course-item' ),
		/**
		 * @property {string} css class
		 */
		stepSelector: '.tvd-modal-step',
		/**
		 * @property {Object} events
		 */
		events: $.extend( BaseModal.prototype.events, {
			/**
			 * Sets parent id to current model
			 * @param {Event} event
			 */
			'change #tva-parent-target': function ( event ) {

				$( event.currentTarget ).siblings( '#tva-child-target' ).select2( 'destroy' ).remove();

				const parentId = isNaN( parseInt( event.currentTarget.value ) ) ? 0 : parseInt( event.currentTarget.value );
				const parentModel = this.structure.findItem( parentId );

				this.__lastSelectedParent = parentModel;

				//set the value to model for the case when use selects the first option(select module)
				this.model.set( 'post_parent', parentId );

				if ( parentModel && parentModel.get( 'structure' ) instanceof StructureCollection ) {
					this.structure = parentModel.get( 'structure' );
					this.model.set( 'order', this.structure.length );
				}

				/**
				 * if the chapter is empty the structure singular type returns content
				 * - and we don't want here to set parent 0 for lesson
				 */
				if ( this.model.getType() !== this.structure.getSingularType() && parentModel.getType() !== 'chapter' ) {
//					this.model.set( 'post_parent', 0 );
					return this.decisionMaking();
				}
			}
		} ),
		/**
		 * Inherit from parent
		 */
		afterRender: function () {

			BaseModal.prototype.afterRender.apply( this, arguments );

			if ( this.model ) {
				this.decisionMaking();
			} else {
				this.gotoStep( 0 );
			}
		},
		/**
		 * Renders form for a specific course item model
		 * @param {Backbone.Model} model
		 * @return {Backbone.View}
		 */
		renderForm: function ( model ) {

			if ( ! ( model instanceof Backbone.Model ) ) {
				model = this.model;
			}

			this.gotoStep( 2 );

			const FromView = require( `./../course/forms/${model.getType()}` );

			const formView = new FromView( {
				el: this.$( '#tvd-form-modal-step' ).find( '.tvd-modal-content' ),
				model: model
			} ).render();

			this.input_focus( formView.$el );

			return this;
		},
		/**
		 * Based on current model decides which step should be rendered
		 * - merge warning
		 * - parent selection
		 * - form
		 * @return {*|void|Backbone.View}
		 */
		decisionMaking: function () {

			if ( ! this.model ) {
				return console.warn( 'a model has to be set in order to make decision for it' );
			}

			/**
			 * is the structure is empty then it means we can add the mode directly
			 * or if the model is saved we have to edit it
			 */
			if ( this.structure.getType() === 'content' || this.model.get( 'id' ) ) {
				/**
				 * make sure the lesson / chapter doesn't lose its set parent
				 */
				if ( ! this.model.get( 'post_parent' ) && this.__lastSelectedParent ) {
					this.model.set( 'post_parent', this.__lastSelectedParent.get( 'id' ) );
				}
				return this.renderForm( this.model );
			}

			switch ( this.model.getType() ) { //user wanna add course item
				case 'lesson':
					switch ( this.structure.getType() ) { //into a structure of
						case 'lessons':
							return this.renderForm( this.model );
						case 'chapters':
						case 'modules':
							if ( this.model.getType() !== this.structure.getSingularType() ) {
								this.model.set( 'post_parent', 0 );
							}
							return this.renderParentsDropDowns();
					}
					break;
				case 'chapter':
					switch ( this.structure.getType() ) { //into a structure of
						case 'chapters':
							return this.renderForm( this.model );
						case 'modules':
							return this.renderParentsDropDowns();
						case 'lessons':
							this.model.set( 'merge_items', this.structure.pluck( 'id' ) );
							const publishedChildren = this.structure.where( {
								post_status: 'publish'
							} );
							this.model.set( 'post_status', publishedChildren.length > 0 ? 'publish' : 'draft' );
							return this.renderWarning();
					}
					break;
				case 'module':
					switch ( this.structure.getType() ) { //into a structure of
						case 'lessons':
						case 'chapters':
							this.model.set( 'merge_items', this.structure.pluck( 'id' ) );
							const publishedChildren = this.structure.where( {
								post_status: 'publish'
							} );
							this.model.set( 'post_status', publishedChildren.length > 0 ? 'publish' : 'draft' );
							return this.renderWarning();
						case 'modules':
							return this.renderForm( this.model );
					}
					break;
			}

			return this;
		},
		/**
		 * Users picks a new model type he wants to add
		 * - initializes a specific course item model
		 * - calls the decision making
		 * @param {Event} event
		 * @param {HTMLElement} dom
		 * @return {Backbone.View}
		 */
		setModel: function ( event, dom ) {

			const type = dom.dataset.type;

			if ( ! type ) {
				return this;
			}

			const ModelItem = require( `./../../models/${type}` );

			this.model = new ModelItem( {
				course_id: this.course.get( 'id' ),
				order: this.structure.getSingularType() === type ? this.structure.getOrderForNewItem() : 0,
				comment_status: this.course.get( 'allows_comments' ) ? 'open' : 'closed',
			} );

			return this.decisionMaking();
		},
		/**
		 * renders renders warning that the existing items
		 * will be moved to newly created item
		 */
		renderWarning: function () {
			const $warning = this.$( '#tva-moving-item-text' );
			$warning.text( TVE_Dash.sprintf( $warning.text(), [
				this.structure.getType(),
				this.model.getType(),
				this.structure.getType()
			] ) );
			return this.gotoStep( 3 );
		},
		/**
		 * Renders parents dropdown
		 */
		renderParentsDropDowns: function () {

			this.gotoStep( 1 );

			this.$parentsSelect = this.$( '#tva-parent-target' ).empty();
			this.$description = this.$( '#tva-item-description' );

			switch ( this.structure.getType() ) {
				case 'chapters':
					this.$description.text( `In which chapter you would like to add your lesson` );
					this.$parentsSelect.append( $( `<option value="">${TVA.t.SelectChapter}</option>` ) );
					break;
				case 'modules':
					this.$description.text( TVE_Dash.sprintf( TVA.t.WhichModule, this.model.getType() ) );
					this.$parentsSelect.append( $( `<option value="">${TVA.t.SelectModule}</option>` ) );
					break;
			}

			this.structure.each( ( model ) => {
				this.$parentsSelect.append( $( `<option value="${model.get( 'id' )}">${model.get( 'post_title' )}</option>` ) );
			} );

			this.$parentsSelect.select2();

			return this;
		},
		/**
		 * Called from DOM on select parent step
		 * @return {Backbone.View}
		 */
		setParent: function () {

			if ( ! this.model.get( 'post_parent' ) ) {
				return TVE_Dash.err( TVE_Dash.sprintf( TVA.t.PleaseSelect, this.structure.getType() === 'modules' ? TVA.t.Module : TVA.t.Chapter ) );
			}

			return this.renderForm( this.model );
		},
		/**
		 * Saves the current course item
		 */
		save: function () {

			if ( this.model.get( 'merge_items' ) ) {
				this.model.set( 'structure', new StructureCollection( this.structure.toJSON() ) );
			}

			const modelStructure = this.model.get( 'structure' ),
				changedAttributes = this.model.changedAttributes();

			if ( modelStructure && changedAttributes !== false && Object.keys( changedAttributes ).includes( 'comment_status' ) ) {
				modelStructure.updateChildrenCommentStatus( this.model.get( 'id' ), this.model.get( 'comment_status' ) );
			}

			const isNew = ! this.model.get( 'id' );

			const xhr = this.model.save( null, {

				success: ( model ) => {

					model.set( 'structure', modelStructure );

					if ( this.model.get( 'merge_items' ) ) {
						/**
						 * set the new structure with the one resulting from merging items
						 */
						this.structure.reset( [ this.model ] );

						this.model.get( 'structure' ).each( ( child ) => {
							/**
							 * items from the new structure has to have parent just saved
							 */
							child.set( 'post_parent', model.get( 'id' ) );
						} );
					} else {
						this.structure.add( model );
					}

					const _cModel = TVA.courses.findWhere( {id: this.course.get( 'id' )} );

					if ( _cModel ) {
						_cModel.trigger( 'tva.structure.modified', model );
					}
					/**
					 * Automatically expand newly added items
					 */
					if ( isNew ) {
						model.expand();
					}
				}
			} );

			if ( xhr ) {
				TVE_Dash.showLoader();
				xhr.always( () => {
					TVE_Dash.hideLoader();
					this.close();
				} );
			}
		}
	} );

} )( jQuery );
