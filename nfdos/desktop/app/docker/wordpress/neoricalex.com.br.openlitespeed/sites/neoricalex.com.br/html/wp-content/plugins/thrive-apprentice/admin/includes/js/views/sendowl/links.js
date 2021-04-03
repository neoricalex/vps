const base = require( '../content-base' ),
	OptionView = require( './links/option' ),
	LinksInputView = require( './links/input-links' );

module.exports = base.extend( {
	template: TVE_Dash.tpl( 'settings/sendowl/links' ),
	className: 'tva-purchase',
	optionSelectedClass: 'tva-selected',
	activeOption: null,
	activeDiscount: null,
	linksInputView: null,
	linksQueryString: {
		pp: 'Sendowl',
	},
	afterRender: function () {
		this.$options = this.$( '.tva-so-options' );
		this.$optionContent = this.$( '.tva-option-content' );
		this.$discountContent = this.$( '.tva-discount-content' );
		this.$linksContent = this.$( '.tva-links-content' );

		requestAnimationFrame( TVA.Utils.rebindWistiaFancyBoxes );
	},
	/**
	 * Called when a user selects a SendOwl Option
	 *
	 * @param {Event} event
	 * @param {HTMLDivElement} dom
	 */
	selectOption: function ( event, dom ) {
		this.$options.removeClass( this.optionSelectedClass );

		const option = dom.getAttribute( 'data-option' ),
			queryString = dom.getAttribute( 'data-query-string' ),
			buttonLabel = dom.getAttribute( 'data-option-button-label' ),
			discountLabel = dom.getAttribute( 'data-option-discount-label' );

		this.linksQueryString = {pp: 'Sendowl'};
		this._removeLinksInputView();

		this._renderOption( option, buttonLabel, queryString );
		this._renderDiscount( discountLabel );

		this.activeDiscount.toggle( this.activeOption.hasData() );

		dom.classList.add( this.optionSelectedClass );
	},

	/**
	 * Renders the SendOwl Option Card
	 *
	 * @param {String} option
	 * @param {String} buttonLabel
	 * @param {String} queryString
	 *
	 * @private
	 */
	_renderOption: function ( option, buttonLabel, queryString ) {
		if ( this.activeOption instanceof OptionView ) {
			delete this.linksQueryString[ this.activeOption.queryStringName ];
			this.activeOption.remove();
		}

		this.activeOption = new OptionView( {
			option: option,
			button_label: buttonLabel,
			queryStringName: queryString
		} );

		/**
		 * Triggered when the user changes the select option
		 *
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 */
		this.activeOption.selectChange = ( event, dom ) => {
			this.activeDiscount.toggleDisabled( false );

			this.linksQueryString[ this.activeOption.queryStringName ] = dom.value;

			this._renderLinks();
		};

		/**
		 * Callback for refresh data
		 */
		this.activeOption.refreshDataCallback = () => {
			const hasData = this.activeOption.hasData();

			this.activeDiscount.toggle( hasData );
		};

		this.$optionContent.append( this.activeOption.render().$el );
	},

	/**
	 * Renders the SendOwl Discount Card
	 *
	 * @param buttonLabel
	 *
	 * @private
	 */
	_renderDiscount: function ( buttonLabel ) {
		if ( this.activeDiscount instanceof OptionView ) {
			delete this.linksQueryString[ this.activeOption.queryStringName ];
			this.activeDiscount.remove();
		}

		this.activeDiscount = new OptionView( {
			option: 'discounts',
			button_label: buttonLabel,
			queryStringName: 'thrv_so_discount'
		} );

		/**
		 * Triggered when the user changes the select option
		 *
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 */
		this.activeDiscount.selectChange = ( event, dom ) => {

			this.linksQueryString[ this.activeDiscount.queryStringName ] = dom.value;

			this._renderLinks();
		};

		this.$discountContent.append( this.activeDiscount.render().$el );

		this.activeDiscount.toggleDisabled( true );
	},
	/**
	 * Renders the Links Input View
	 *
	 * @private
	 */
	_renderLinks: function () {
		this._removeLinksInputView();
		this.linksInputView = new LinksInputView( {queryParams: this.linksQueryString} );

		this.$linksContent.html( this.linksInputView.render().$el );
	},
	/**
	 * Removes the Links Input View
	 *
	 * @private
	 */
	_removeLinksInputView: function () {
		if ( this.linksInputView instanceof LinksInputView ) {
			this.linksInputView.remove();
		}
	}
} );
