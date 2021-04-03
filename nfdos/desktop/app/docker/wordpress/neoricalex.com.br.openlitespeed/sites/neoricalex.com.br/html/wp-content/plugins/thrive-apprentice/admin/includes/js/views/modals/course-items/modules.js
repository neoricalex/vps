( function ( $ ) {

	const ModuleModel = require( './../../../models/module' );

	/**
	 * Modal for editing modules
	 * - extends from a base modal
	 * @type {Backbone.View}
	 */
	module.exports = require( './../td-base' ).extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'modals/courses/item' ),
		/**
		 * After modal has been rendered and opened
		 * - renders the lesson form
		 * - initialize a new lesson model if needed
		 */
		afterInitialize: function ( options = {} ) {

			if ( ! options.model ) {
				this.model = new ModuleModel( {
					course_id: options.course.get( 'id' ),
					order: this.structure.length
				} );
			}
		},
		/**
		 * After the modal is opened and rendered
		 * - renders item form
		 * @return {*}
		 */
		afterRender: function () {

			const ModuleFormView = require( './../../course/forms/module' );

			const form = new ModuleFormView( {
				el: this.$_content,
				model: this.model
			} );

			form.render();

			return this;
		},
		/**
		 * Saves model to DB
		 */
		save: function () {
			const currentItemStructure = this.model.get( 'structure' ),
				changedAttributes = this.model.changedAttributes();

			if ( changedAttributes !== false && Object.keys( changedAttributes ).includes( 'comment_status' ) ) {
				currentItemStructure.updateChildrenCommentStatus( this.model.get( 'id' ), this.model.get( 'comment_status' ) );
			}

			const xhr = this.model.save( null, {
				success: ( model ) => {
					this.structure.add( model );
					model.set( 'structure', currentItemStructure );

					const _cModel = TVA.courses.findWhere( {id: this.course.get( 'id' )} );
					if ( _cModel ) {
						_cModel.trigger( 'tva.structure.modified', model );
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
