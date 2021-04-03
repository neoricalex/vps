var PanelBase = TVE.Views.Controls.DropPanel;
module.exports = PanelBase.extend( {
	template: TVE.tpl( 'edit-ce-item' ),

	after_render: function () {
		this.$label = this.$( '.tcb-ce-item-label' );
		this.$placeholder = this.$( '.tcb-ce-item-placeholder' );
	},

	/**
	 * Returns the data found inside the object
	 *
	 * @param $item - jQuery object
	 * @returns object
	 */
	get_data: function ( $item ) {
		return {
			label: $item.find( 'label' ).text(),
			placeholder: $item.find( 'input,textarea' ).attr( 'placeholder' )
		};
	},

	/**
	 * Executed when a setting from the drop panel is changed
	 *
	 * @param $element
	 * @param dom
	 */
	change_setting: function ( $element, dom ) {
		var attributes_obj = {},
			setting = dom.getAttribute( 'data-setting' );

		attributes_obj[ setting ] = dom.value;

		this.model.set( attributes_obj );
	},

	/**
	 * Read data from the model
	 *
	 * @param model
	 */
	reset: function ( model ) {
		this.model = model;
		this.dom();
	},

	/**
	 * Updates the controls to their corresponding values
	 */
	dom: function () {
		//Text
		this.$label.val( this.model.get( 'label' ) );
		this.$placeholder.val( this.model.get( 'placeholder' ) );
	},
	/**
	 * Cancel the changes and close the panel
	 */
	cancel: function () {
		if ( this.model.get( '__new' ) ) {
			/**
			 * if is new, we remove the last model added inside the collection
			 */
			this.collection.at( this.collection.length - 1 ).destroy();
		} else {
			this.model.restoreState();
		}
	},

	/**
	 * Applies the changes. No action needed here
	 */
	apply: function () {
		this.model.unset( '__new' );

		this.collection.trigger( 'change' );
	}
} );
