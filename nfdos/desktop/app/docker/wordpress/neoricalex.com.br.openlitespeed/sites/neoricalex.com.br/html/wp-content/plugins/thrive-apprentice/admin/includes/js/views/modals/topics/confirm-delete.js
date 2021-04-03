const Base = require( '../base' );

module.exports = Base.extend( {
	/**
	 * Underscore template
	 *
	 * @type {Function}
	 */
	template: TVE_Dash.tpl( 'modals/topics/confirm-delete' ),

	/**
	 * Opens the modal and returns a Promise object that resolves when the deletion is confirmed
	 *
	 * @return {Promise}
	 */
	open() {
		Base.prototype.open.apply( this, arguments );

		return new Promise( resolve => {
			this.$$promiseResolver = resolve;
		} );
	},

	/**
	 * Perform the actual deletion of the topic
	 *
	 * @return {boolean}
	 */
	performDelete() {

		this.close();
		requestAnimationFrame( this.$$promiseResolver );

		return false;
	}
} );
