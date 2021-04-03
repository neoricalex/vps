/**
 * Created by PhpStorm.
 * User: Ovidiu
 * Date: 10/16/2018
 * Time: 3:59 PM
 */
( function ( $ ) {
	var EditCheckoutItem = require( './edit-checkout-item' ),
		base_model = TVE.BaseModel,
		inputs_collection = new Backbone.Collection( {} );

	module.exports = TVE.Views.Base.component.extend( {
			controls_init: function () {

				this.ceckout_item_dropdown = new EditCheckoutItem( {
					config: this.config.FieldsControl.config,
					collection: inputs_collection
				} );

				this.controls.FieldsControl.attach_collection( inputs_collection );

				/**
				 * Fields Items ORDER Change Listener
				 */
				this.listenTo( inputs_collection, 'change', _.bind( function () {
					var itemsArr = [];
					/**
					 * Make a clone of jQuery objects that store the cf items because it will lose references
					 */
					inputs_collection.each( function ( model ) {
						itemsArr.push( model.get( 'item' ).clone() );
					}, this );

					/**
					 * Reorder the HTML with respect to inputs_collection
					 */
					TVE.ActiveElement.find( '.tve-form-item' ).each( function ( index, ceitem ) {
						$( ceitem ).html( itemsArr[ index ].html() ).attr( 'class', itemsArr[ index ].attr( 'class' ) ).attr( 'data-css', itemsArr[ index ].attr( 'data-css' ) );
					}, this );

					/**
					 * Update the FieldsControl indexes
					 */
					this.controls.FieldsControl.update( TVE.ActiveElement );
				}, this ) );


				this.controls.FieldsControl.update = function ( $element ) {
					$element = ! $element ? TVE.ActiveElement : $element;
					var items = [],
						form_elements = $element.find( '.tve-form-item' );

					_.each( form_elements, function ( item, index ) {
						var $item = jQuery( item );

						items.push( {
							item: $item,
							label: $item.find( 'label' ).text().substring( 0, 20 )
						} );
					}, this );

					inputs_collection.reset( items );
				};

				this.controls.FieldsControl.on( 'item_click', _.bind( function ( model, row ) {
					var $item = model.get( 'item' );
					if ( this.ceckout_item_dropdown.isOpen() ) {
						this.ceckout_item_dropdown.onCancel();
						return false;
					}

					var item_model = new base_model( this.ceckout_item_dropdown.get_data( $item ) );
					this.listenTo( item_model, 'change', function ( model ) {
						$item.find( 'label' ).html( model.get( 'label' ) );
						$item.find( 'input' ).attr( 'placeholder', model.get( 'placeholder' ) ).attr( 'data-placeholder', model.get( 'placeholder' ) );
					} );

					item_model.saveState();

					this.ceckout_item_dropdown.reset( item_model );
					this.ceckout_item_dropdown.open( null, row );

					return false;
				}, this ) );

			},
			get_fields_control: function () {
				return TVE.Views.Controls.PreviewList;
			}
		}
	);
} )( jQuery );