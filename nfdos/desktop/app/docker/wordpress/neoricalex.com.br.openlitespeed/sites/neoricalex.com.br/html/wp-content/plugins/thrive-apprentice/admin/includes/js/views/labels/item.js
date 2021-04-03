const TopicView = require( '../topics/item' );

module.exports = TopicView.extend( {
	className: 'tva-label-item click',
	events: {
		...TopicView.prototype.events,
		'click': 'editing'
	},
	/**
	 * Underscore template
	 *
	 * @type {Function}
	 */
	template: TVE_Dash.tpl( 'labels/item' ),

	/**
	 * Message to be displayed after a label has been deleted
	 *
	 * @type {String}
	 */
	deletedMessage: TVA.t.label_deleted,

	/**
	 * Get the constructor for the "Delete Confirmation" modal
	 *
	 * @return {Function}
	 */
	getConfirmationModal() {
		return require( '../modals/labels/confirm-delete' );
	},
	/**
	 * Triggered before deleting a label
	 *
	 * @param {Topic} itemClone
	 */
	beforeDelete( itemClone ) {
		/**
		 * Update all courses that have this label to have the "General" label (ID = 0)
		 */
		TVA.courses.where( {label: itemClone.get( 'ID' )} ).forEach( course => {
			course.set( 'label', 0, {silent: true} );
			course.saveState();
		} );
	},

	spectrumOptions() {
		return {
			containerClassName: 'tva-label-spectrum',
		};
	},

	/**
	 * Toggle the loading state
	 */
	toggleLoader() {
		this.$el.tvaToggleLoader( 20, !! this.model.get( 'loading' ), {background: '', position: 'right', padding: '0 20px 0 0'} );
	}
} );
