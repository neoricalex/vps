module.exports = require( '../base' ).extend( {
	template: '',
	serviceOptions: [],
	/**
	 * @property {Array} of course ids the customer(s) will have access to
	 */
	courses: [],
	/**
	 * Holds an array of objects containing selected service options
	 */
	selectedServiceOptions: {},
	/**
	 * @property underscore template
	 */
	courseItemTpl: TVE_Dash.tpl( 'modals/customer/course-item' ),

	afterInitialize: function () {
		this.courses = [];
	},
	/**
	 * Saves a model and sends a request to the server
	 *
	 * @param {Event} event
	 * @param {Element} dom
	 */
	save: function ( event, dom ) {

		if ( ! this.model.isValid() ) {
			TVE_Dash.err( this.model.getValidationError() );
			return;
		}

		if ( ! this.model.hasServices() && ! this.model.get( 'ID' ) ) {
			/**
			 * If the user has no services and if it is a new user show the services error
			 */
			TVE_Dash.err( 'Please select some services' );
			return;
		}

		TVE_Dash.showLoader();

		this.model.save( null, {
			success: ( model, response ) => {
				TVE_Dash.success( response.message );

				if ( this.collection instanceof Backbone.Collection ) {
					this.collection.fetch();
				}
			},
			error: ( model, response ) => {
				TVE_Dash.err( response.responseJSON.message );
			},
			complete: response => {
				if ( response.status === 200 ) {
					this.close();
				}

				TVE_Dash.hideLoader();
			}
		} );
	},
	/**
	 * Push/Pop courses in stack to be saved for a customer
	 * @param {Event} event
	 * @param {HTMLInputElement} dom
	 */
	checkboxClick: function ( event, dom ) {

		const id = parseInt( dom.dataset.id );

		if ( this.courses.indexOf( id ) >= 0 ) {
			this.courses.splice( this.courses.indexOf( id ), 1 );
		} else {
			this.courses.push( id );
		}
	},

	/**
	 * Called after the modal is opened.
	 *
	 * Populates the modal variables
	 */
	dom: function () {
		this.serviceOptions = [];
		this.$( '.tva-service-options' ).each( ( index, element ) => {
			this.serviceOptions.push( element.getAttribute( 'data-option' ) );
		} );

		this.reset();

		this.serviceOptions.forEach( serviceOption => {
			this.updateServiceOptionCounter( serviceOption );
		} );
	},

	/**
	 * Called when user checks / unchecks the notify checkbox
	 *
	 * @param {Event} event
	 * @param {Element} dom
	 */
	notifyUser: function ( event, dom ) {
		this.model.set( 'notify', Number( dom.checked ) );
	},

	/**
	 * Reset View Vars
	 */
	reset: function () {
		this.selectedServiceOptions = this.model.get( 'services' );

		this.serviceOptions.forEach( serviceOption => {

			if ( Array.isArray( this.selectedServiceOptions[ serviceOption ] ) && this.selectedServiceOptions[ serviceOption ].length > 0 ) {

				this.updateCheckboxStatus( this.selectedServiceOptions[ serviceOption ], serviceOption );
			}
		} );

	},

	/**
	 * Updates a service option counter for a particular service option
	 *
	 * @param {string} serviceOption
	 */
	updateServiceOptionCounter: function ( serviceOption ) {
		const $optionCard = this.$( `.tva-option-card[data-option="${serviceOption}"]:not(.disabled)` ),
			checkedCheckboxes = $optionCard.find( 'input:checkbox:checked' ).length;
		let productCounterLabel = '<span>No access</span>';

		if ( checkedCheckboxes > 0 ) {
			productCounterLabel = `${$optionCard.find( 'input:checkbox:checked' ).length} ${$optionCard.attr( 'data-option-label' )}`;
		}

		$optionCard.find( '.tva-product-counter' ).html( productCounterLabel );
		$optionCard.find( '.tva-option-toggle span' ).html( $optionCard.attr( `data-${checkedCheckboxes > 0 ? 'have' : 'no'}-options-action-label` ) );
	},

	/**
	 * Updates the checkbox statues (Checked / Disabled )
	 *
	 * @param {Array} options
	 * @param {String} serviceOption
	 */
	updateCheckboxStatus: function ( options = [], serviceOption = '' ) {
		if ( ! Array.isArray( options ) ) {
			return;
		}

		options.forEach( opt => {
			const $checkbox = this.$( `#tva-${serviceOption}-${opt}` );

			if ( $checkbox.length ) {
				$checkbox[ 0 ].checked = true;
			}
		} );
	},

	/**
	 * Called when Expanding / Collapsing Option Cards
	 *
	 * @param {Event} event
	 * @param {Element} dom
	 */
	toggleOptions: function ( event, dom ) {
		const option = dom.getAttribute( 'data-option' ),
			$options = this.$el.find( '.tva-service-options' );

		$options.filter( `[data-option="${option}"]` )
		        .slideToggle( 'fast' )
		        .closest( '.tva-option-card' ).toggleClass( 'active' );
	},

	/**
	 * Called when toggling customers table
	 *
	 * @param {Event} event
	 * @param {Element} dom
	 */
	toggleTable: function ( event, dom ) {
		dom.closest( 'table' ).classList.toggle( 'b-hidden' );
	},

	/**
	 * Called when selecting a service option
	 *
	 * @param {Event} event
	 * @param {Element} dom
	 */
	selectOption: function ( event, dom ) {
		const serviceOption = dom.closest( '.tva-option-card' ).getAttribute( 'data-option' ),
			serviceType = dom.getAttribute( 'data-service-type' ),
			value = parseInt( dom.value );

		if ( ! Array.isArray( this.selectedServiceOptions[ serviceType ] ) ) {
			this.selectedServiceOptions[ serviceType ] = [];
		}

		if ( dom.checked ) {
			this.selectedServiceOptions[ serviceType ].push( value );
		} else {
			this.selectedServiceOptions[ serviceType ] = this.selectedServiceOptions[ serviceType ].filter( item => parseInt( item ) !== value );
		}

		this.updateServiceOptionCounter( serviceOption );

		this.model.set( 'services', this.selectedServiceOptions );
	}
} );
