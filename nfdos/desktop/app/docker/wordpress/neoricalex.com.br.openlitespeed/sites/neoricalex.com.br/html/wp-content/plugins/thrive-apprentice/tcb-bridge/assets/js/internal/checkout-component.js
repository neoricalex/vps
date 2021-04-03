/**
 * Created by PhpStorm.
 * User: Ovidiu
 * Date: 10/15/2018
 * Time: 5:57 PM
 */
var settings = Backbone.Model.extend( {
	defaults: function () {
		return {
			error_messages: {
				email: TVE.t.cf_errors.email.text,
				empty_fields: 'Some fields are empty!',
				passwords_not_match: 'The passwords do not match',
				existing_user_email: 'An account with that email address already exists. In order to place the order, please login first. [a]Click here to login[/a]'
			}
		}
	},
	input_config_name: 'config',
	input_selector: 'input[name="config"]',
	$element: null,

	/**
	 * tries to find config input in active element
	 * sets encoded model attributes in config input as value
	 */
	write: function () {

		if ( ! this.$element ) {
			return
		}

		var $input = this.$element.find( this.input_selector );

		if ( $input.length <= 0 ) {
			$input = $( '<input type="hidden" name="' + this.input_config_name + '"/>' );
			this.$element.append( $input );
		}

		$input.attr( 'value', TVE.Base64.encode( TVE.serialize( this.attributes ) ) );
	},

	/**
	 * finds the input in $element
	 * decodes its value and
	 * sets data into model
	 */
	read: function () {

		this.clear( {
			silent: true
		} );

		this.attributes = this.defaults();

		var $config = this.$element.find( this.input_selector );

		if ( $config.length && $config.val() ) {

			this.set( TVE.unserialize( TVE.Base64.decode( $config.val() ) ), {silent: true} );
		}
	},

	/**
	 * sets the active element and
	 * reads its config
	 */
	update: function () {

		this.$element = TVE.ActiveElement;

		if ( ! this.$element.is( '.thrv-checkout' ) ) {
			return;
		}

		this.read();

		if ( this.$element.find( this.input_selector ).length === 0 ) {
			this.write();
		}
	}
} );

var BUTTON_GROUP_ITEM_SELECTOR = '.thrv-button-group-item',
	BUTTON_GROUP_ITEM_CLS = 'thrv-button-group-item',
	BUTTON_GROUP_ACTIVE_SELECTOR = '.tcb-active-state',
	BUTTON_GROUP_ACTIVE_CLS = 'tcb-active-state';


module.exports = TVE.Views.Base.component.extend( {
	checkout: null,
	settings: null,
	states_with_no_button_group: [ 'forgot_password', 'reset_confirmation' ],
	after_init: function () {
		this.settings = new settings();

		this.settings.on( 'change', function ( model, change_options ) {
			this.write();
		} );
	},
	/**
	 * called when:
	 * - an element is clicked
	 * - mouse leaves the element
	 * - element is inserted into content
	 * - before setConfig() on component
	 * - before component.controls[].update()
	 */
	before_update: function () {

		this.settings.update();
	},

	controls_init: function () {

		/**
		 * For Checkout Element we need to hide the active state from the button group item
		 */
		TVE.add_filter( 'tcb.toggle_active_state', _.bind( function ( show, $activeElement ) {

			if ( TVE._type( $activeElement ) === 'button_group_item' && $activeElement.closest( '.thrv-checkout' ).length ) {
				show = false;
			}

			return show;
		} ) );

		TVE.add_action( 'tcb_after_cloud_template', _.bind( function ( $element ) {

			if ( ! $element.is( '.thrv-checkout' ) ) {
				return;
			}

			var $input = $element.find( this.input_selector );

			/**
			 * Reset the config input with the defaults
			 *
			 * Fixes the issue when the cloud template email is placed inside the Checkout Form Element
			 */
			if ( $input.length ) {

				$input.attr( 'value', TVE.Base64.encode( TVE.serialize( this.defaults() ) ) );

				this.update();
			}

		}, this.settings ) );

		/**
		 * After the element is dropped we need to generate a unique identifier on button group wrapper to apply the css as group depending on the active button class
		 */
		TVE.add_filter( 'element_drop', _.bind( function ( $element ) {
			if ( $element && $element.hasClass( 'thrv-checkout' ) ) {
				var checkout_button_group_unique_identifier = TVE.CSS_Rule_Cache.generate_id( 'tve-u-ck-button-group-' );

				$element.find( '.thrv-button-group' ).attr( 'data-ck-button-group', checkout_button_group_unique_identifier );

				this.update_btn_group_data_selector( $element );
			}
			return $element;
		}, this ) );

		/**
		 * Add Checkout Form Elements for witch we should not display the clone button
		 */
		TVE.add_filter( 'selectors_no_clone', function ( selectors ) {

			selectors += ', .thrv-checkout, .tcb-checkout-form .tve-form-item label, .tcb-checkout-form .tve-form-input';

			return selectors;
		} );

		/**
		 * Add Checkout Form Elements for witch we should not display the delete button
		 */
		TVE.add_filter( 'selectors_no_delete', function ( selectors ) {

			selectors += ', .tcb-checkout-form .tve-form-item label, .tcb-checkout-form .tve-form-input';

			return selectors;
		} );

		/**
		 * Add Checkout Form Elements for witch we should not display the save button
		 */
		TVE.add_filter( 'selectors_no_save', function ( selectors ) {

			selectors += ', .thrv-checkout';

			return selectors;
		} );

		this.controls[ 'AddRemoveLabels' ].change = function ( $element, dom ) {
			if ( dom.checked ) {
				$element.head_css( {'display': ''}, false, this.config.css_suffix, false, this.config.css_prefix );
			} else {
				$element.head_css( {'display': 'none !important'}, false, this.config.css_suffix, false, this.config.css_prefix );
			}
		};
		this.controls[ 'AddRemoveLabels' ].update = function () {
			var display = this.applyTo().head_css( 'display', false, this.config.css_suffix, true, this.config.css_prefix ),
				checked = display !== 'none';

			this.setChecked( checked );
		};

		/**
		 * Payment Provider
		 */
		this.controls[ 'payment_provider' ].update = function ( $element ) {
			this.setValue( $element.attr( 'data-payment-platform' ) );
		};

		this.controls[ 'payment_provider' ].input = function ( $element, dom ) {
			$element.attr( 'data-payment-platform', dom.value );
		};
	},

	after_enter_edit_mode: function ( $element ) {

		var $register_form = $element.find( '.tcb-tva-checkout-form-wrapper[data-instance="create_account"]' ).first();

		if ( $register_form.length ) {
			TVE.main.EditMode.state_changed( undefined, {value: 'create_account'} );
		}

	},
	/**
	 * Triggered when clicked on EDIT CHECKOUT ELEMENTS button from the UI
	 *
	 * Triggers the edit mode for the checkout element
	 */
	edit_checkout_elements: function () {
		this.checkout = TVE.ActiveElement;
		this.checkout.find( '.tcb-tva-checkout-form-wrapper[data-instance="create_account"]' ).addClass( 'tve_editor_main_content' );

		TVE.add_action( 'tcb.edit_mode.enter', this.after_enter_edit_mode );

		TVE.main.EditMode.enter( TVE.ActiveElement, {
			extra_element_class: 'canvas-mode',
			default_sidebar_params: [ 'elements' ],
			blur: true,
			element_selectable: false,
			states: [
				{label: 'Register Form', value: 'create_account'},
				{label: 'Login Form', value: 'login'},
				{label: 'Password Recovery', value: 'forgot_password'},
				{label: 'Password Recovery Confirmation', value: 'reset_confirmation'}
			],
			callbacks: {

				exit: _.bind( function () {

					TVE.Editor_Page.focus_element( this.checkout );

					this.checkout.find( '.tcb-tva-checkout-form-wrapper' ).addClass( 'tcb-permanently-hidden' ).removeClass( 'tve_editor_main_content' );
					this.checkout.find( '.tcb-tva-checkout-form-wrapper[data-instance="create_account"]' ).removeClass( 'tcb-permanently-hidden' );

					//on exit make first state active: button and content
					this.checkout.find( '.thrv-button-group-item' ).removeClass( 'tcb-active-state' );
					this.checkout.find( '.thrv-button-group-item[data-instance="create_account"]' ).addClass( 'tcb-active-state' );

					this.toggle_button_group( 'login' );

					delete this.checkout;

					TVE.remove_action( 'tcb.edit_mode.enter', this.after_enter_edit_mode );
				}, this ),

				state_change: _.bind( function ( state ) {
					this.checkout.find( '.tcb-tva-checkout-form-wrapper' ).addClass( 'tcb-permanently-hidden' ).removeClass( 'tve_editor_main_content' );
					this.checkout.find( '.tcb-tva-checkout-form-wrapper[data-instance="' + state + '"]' ).addClass( 'tve_editor_main_content' ).removeClass( 'tcb-permanently-hidden' ).trigger( 'click' );

					this.checkout.find( '.tcb-active-state' ).removeClass( 'tcb-active-state' );
					this.checkout.find( '.thrv-button-group-item[data-instance="' + state + '"]' ).addClass( 'tcb-active-state' );

					this.toggle_button_group( state );

					if ( this.checkout.find( 'form:visible' ).length ) {
						this.checkout.find( 'form:visible' ).trigger( 'click' );
					} else {
						TVE.Editor_Page.blur();
					}
				}, this )
			}
		} );
	},

	/**
	 * Show / Hide button group element depending on the selected state
	 *
	 * @param {string} state
	 */
	toggle_button_group: function ( state ) {
		this.checkout.find( '.thrv-button-group' ).toggleClass( 'tcb-permanently-hidden', _.contains( this.states_with_no_button_group, state ) );
	},

	/**
	 * Update Button Group Data Selector
	 *
	 * Called from the element_drop filter function
	 */
	update_btn_group_data_selector: function ( $element ) {
		var checkout_button_group_unique_identifier = $element.find( '.thrv-button-group' ).attr( 'data-ck-button-group' ),
			selector_with_active_cls = '[data-ck-button-group="' + checkout_button_group_unique_identifier + '"] ' + BUTTON_GROUP_ITEM_SELECTOR + BUTTON_GROUP_ACTIVE_SELECTOR,
			selector_with_no_active_cls = '[data-ck-button-group="' + checkout_button_group_unique_identifier + '"] ' + BUTTON_GROUP_ITEM_SELECTOR + ':not(' + BUTTON_GROUP_ACTIVE_SELECTOR + ')';

		_.each( $element.find( BUTTON_GROUP_ITEM_SELECTOR ), function ( item, index ) {
			var $item = jQuery( item );

			$item.attr( 'data-selector', $item.hasClass( BUTTON_GROUP_ACTIVE_CLS ) ? selector_with_active_cls : selector_with_no_active_cls );
		} );
	},

	manage_error_messages: function () {
		var self = this,
			_modal = new TVE.Views.Modals.ErrorMessages( {
				el: TVE.modal.get_element( 'cf-error-messages' ),
				model: new Backbone.Model( this.settings.get( 'error_messages' ) )
			} );

		_modal.render_errors();
		_modal.restore_defaults = function () {

			_.each( self.settings.defaults().error_messages, function ( error, key, obj ) {
				this._set( key, error );
			}, this );

			this.render_errors();
		};
		_modal.before_save = function () {

			var invalid_inputs = [],
				is_valid = function ( model ) {

					var is_valid = true;

					for ( var k in model.attributes ) {
						if ( model.get( k ).length <= 0 ) {
							invalid_inputs.push( k );
							is_valid = false;
						}
					}

					return is_valid;
				};

			this.invalid_inputs = invalid_inputs;
			this.is_valid = is_valid( this.model );

			self.settings.set( 'error_messages', this.model.toJSON() );

		};
		_modal.open();
	}
} );