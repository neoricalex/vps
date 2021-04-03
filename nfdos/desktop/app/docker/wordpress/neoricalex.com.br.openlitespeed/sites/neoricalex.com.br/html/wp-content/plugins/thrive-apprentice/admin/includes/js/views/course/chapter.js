( function ( $ ) {

	const CourseItemView = require( './item' );
	const LessonItemVIew = require( './lesson' );
	const CourseStructureCollection = require( './../../collections/structure' );

	module.exports = CourseItemView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/chapter' ),
		/**
		 *
		 * @param collection
		 * @param $el
		 */
		renderStructure: function ( collection, $el ) {

			collection.each( ( itemModel, index ) => {

				if ( ! ( itemModel.get( 'structure' ) instanceof CourseStructureCollection ) ) {
					itemModel.set( 'structure', new CourseStructureCollection( itemModel.get( 'structure' ) ) );
				}

				const options = {
					model: itemModel,
					numberInList: ( index + 1 ),
					expanded: this.expanded,
					course: this.course,
				};

				const view = new LessonItemVIew( options );

				$el.append( view.render().$el );
				/**
				 * Add child reference so that it can be removed before next rendering
				 */
				this.addChild( view );
			} );

			const $status = this.$( '> .tva-cm-box .tva-cm-status' );
			const draftItems = this.model.get( 'structure' ).findItemsByOptions( {post_status: 'draft'} );

			if ( this.model.isPublished() && draftItems.length ) {
				$status
					.attr( 'data-tooltip', TVE_Dash.sprintf( TVA.t.ContentNotPublished, TVA.t.Chapter ) )
					.addClass( 'yellow' );
			} else if ( this.model.get( 'post_status' ) === 'publish' ) {
				$status.attr( 'data-tooltip', TVA.t.ChapterPublished );
			} else {
				$status.attr( 'data-tooltip', TVA.t.ChapterNotPublished );
			}
		}
	} );
} )( jQuery );
