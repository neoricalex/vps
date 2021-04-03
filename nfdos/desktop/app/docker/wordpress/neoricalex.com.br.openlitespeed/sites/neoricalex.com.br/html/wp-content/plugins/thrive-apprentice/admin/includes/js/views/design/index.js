( function ( $ ) {
	const base =  require( './base' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'design/index' ),
		initialize: function ( options ) {
			this.available_settings = options.available_settings;

			base.prototype.initialize.apply( this, arguments );
		},
		render: function () {
			this.$el.empty().html( this.template( {
				template: this.model.get( 'template' ),
				available_settings: this.available_settings
			} ) );

			return this;
		},
	} );
} )( jQuery );
