const ItemState = require( '../item-state' );

module.exports = require( './base' ).extend( {
	template: TVE_Dash.tpl( 'modals/wizard' ),
	afterInitialize: function () {
		this.listenTo( TVA.indexPageModel, 'change', model => {
			const value = model.get( 'value' );
			if ( !! value ) {
				TVA.settings.wizard.value = 1;
				this.model.set( 'value', 1 );

				this.model.save();
			}
		} );
	},
	/**
	 * Called after the modal is opened
	 */
	dom: function () {
		/**
		 * @type {jQuery}
		 */
		this.$dashboardLink = this.$( '#tva-dashboard-link' );

		new ItemState( {
			el: this.$( '.tva-course-states-container' ),
			model: TVA.indexPageModel,
			states_views_path: './page-states/',
			labels: {
				search: {
					title: 'Set your courses page',
				},
				normal: {
					title: 'Course page',
				},
				delete: {
					title: 'Are you sure you want to remove this course page?',
				},
			},
			afterRender: function () {
				this.$( '.tva-edit-page-with-tar' ).remove();
			},
		} ).render();
	},
	allowJumpToStep: function () {
		const indexPageID = !! TVA.indexPageModel.get( 'value' );

		if ( ! indexPageID ) {
			TVE_Dash.err( 'You need to define a page where all your courses will reside.' );
		}

		return indexPageID;
	},
	/**
	 * Redirrects the user to Thrive Dashboard
	 */
	goToThriveDashboard: function () {
		top.location.href = this.$dashboardLink.attr( 'href' );
	},
	/**
	 * Changes the Route
	 *
	 * @param {Event} event
	 * @param {HTMLButtonElement} dom
	 */
	goToRoute: function ( event, dom ) {
		this.close();
		TVA.Router.navigate( dom.getAttribute( 'data-route' ), {trigger: true} );
	}
} );
