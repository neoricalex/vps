( function ( $ ) {

	const CourseItemView = require( './item' );
	const ChapterItemView = require( './chapter' );
	const LessonItemView = require( './lesson' );
	const CourseStructureCollection = require( './../../collections/structure' );

	module.exports = CourseItemView.extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'courses/module' ),
		/**
		 * After render overwrite from parent
		 */
		afterRender: function () {

			CourseItemView.prototype.afterRender.apply( this, arguments );

			if ( ! ( this.model.get( 'structure' ) instanceof Backbone.Collection ) ) {
				return;
			}

			switch ( this.model.get( 'structure' ).getType() ) {
				case 'chapters':
					this.$( '.tva-add-lesson' ).remove();
					this.$( '> .tva-lessons-list' ).remove();
					break;
				case 'lessons':
					this.$( '> .tva-chapters-list' ).remove();
					break;
			}
		},
		/**
		 * Renders module's structure: chapters or lessons
		 * @param {CourseStructureCollection} collection
		 * @param {jQuery} $el
		 */
		renderStructure: function ( collection, $el ) {

			collection.each( ( itemModel, index ) => {

				if ( ! ( itemModel.get( 'structure' ) instanceof CourseStructureCollection ) ) {
					itemModel.set( 'structure', new CourseStructureCollection( itemModel.get( 'structure' ) ) );
				}

				let view;

				const options = {
					model: itemModel,
					numberInList: ( index + 1 ),
					expanded: this.expanded,
					course: this.course,
				};

				switch ( itemModel.get( 'post_type' ) ) {
					case 'tva_chapter':
						view = new ChapterItemView( options );
						break;
					case 'tva_lesson':
						view = new LessonItemView( options );
						break;
					default:
						view = new Backbone.View();
				}

				$el.append( view.render().$el );
				this.addChild( view );
			} );

			const $status = this.$( '> .tva-cm-box .tva-cm-status' );
			const draftItems = this.model.get( 'structure' ).findItemsByOptions( {post_status: 'draft'} );

			if ( this.model.isPublished() && draftItems.length ) {
				$status
					.attr( 'data-tooltip', TVE_Dash.sprintf( TVA.t.ContentNotPublished, TVA.t.Module ) )
					.addClass( 'yellow' );
			} else if ( this.model.get( 'post_status' ) === 'publish' ) {
				$status.attr( 'data-tooltip', TVA.t.ModulePublished );
			} else {
				$status.attr( 'data-tooltip', TVA.t.ModuleNotPublished );
			}
		}
	} );
} )( jQuery );
