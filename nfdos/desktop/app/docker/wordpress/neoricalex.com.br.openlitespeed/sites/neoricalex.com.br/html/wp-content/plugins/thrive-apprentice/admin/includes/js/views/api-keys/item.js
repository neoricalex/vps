const base = require( '../base' ),
	EditModal = require( '../modals/api-key/base' );

module.exports = base.extend( {
	template: TVE_Dash.tpl( 'settings/api-key-item' ),
	className: 'tva-card tva-card-small tva-api-key-card',
	initialize: function () {
		base.prototype.initialize.apply( this, arguments );

		this.listenTo( this.model, 'sync', this.render );
	},
	/**
	 * After render function
	 *
	 * View variables
	 */
	afterRender: function () {
		this.$normalState = this.$( '.tva-api-key-details' );
		this.$deletelState = this.$( '.tva-api-key-delete' );
	},
	/**
	 * Called when user clicks edit on a token
	 *
	 * @param {Event} event
	 * @param {HTMLAnchorElement} dom
	 */
	editToken: function ( event, dom ) {
		this.openModal( EditModal, {
			model: this.model,
			collection: this.collection,
			top: '40px',
			className: 'tvd-modal tvd-modal-big',
		} );
	},
	/**
	 * Shows the delete state
	 *
	 * @param {Event} event
	 * @param {HTMLAnchorElement} dom
	 */
	deleteToken: function ( event, dom ) {
		this.$normalState.hide();
		this.$deletelState.show();
	},
	/**
	 * Deletes the token
	 *
	 * @param {Event} event
	 * @param {HTMLSpanElement} dom
	 */
	delete: function ( event, dom ) {
		TVE_Dash.showLoader();

		this.model.destroy( {
			success: model => {
				this.remove(); // Remove the view
				this.collection.remove( model ); //Remove Model From Collection
				this.collection.trigger( 'toggleTable' );
				const _message = TVE_Dash.sprintf( TVA.t.token_deleted, model.get( 'name' ) );

				TVE_Dash.success( _message );

			},
			error: ( collection, response ) => {
				if ( response && response.responseJSON ) {
					TVE_Dash.err( response.responseJSON.message );
				}
			},
			complete: response => {
				TVE_Dash.hideLoader();
			}
		} );
	},
	/**
	 * Cancels the delete action
	 *
	 * @param {Event} event
	 * @param {HTMLSpanElement} dom
	 */
	cancel: function ( event, dom ) {
		this.$normalState.show();
		this.$deletelState.hide();
	},
	/**
	 * Callback for changing the item field
	 *
	 * @param {Event} event
	 * @param {HTMLInputElement} dom
	 */
	changeField: function ( event, dom ) {
		const field = dom.getAttribute( 'data-field' );

		this._save( field, Number( dom.checked ) );
	},
	/**
	 * Saves token item
	 *
	 * @private
	 */
	_save: function ( prop, value ) {
		const obj = {};

		obj[ prop ] = value;

		this.model.set( obj );

		this.model.save();

		TVE_Dash.success( TVA.t.SuccessfulSave );
	}
} );
