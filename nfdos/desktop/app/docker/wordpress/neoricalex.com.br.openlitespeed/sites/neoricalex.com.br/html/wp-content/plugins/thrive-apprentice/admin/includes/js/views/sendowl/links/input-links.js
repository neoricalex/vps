const base = require( '../../base' );

module.exports = base.extend( {
	template: TVE_Dash.tpl( 'settings/sendowl/links-input' ),
	className: 'tva-card tva-purchase-links',
	baseUrl: TVA.checkout_endpoint,
	params: [],
	queryParams: [],
	htmlParams: [],
	afterInitialize: function ( args ) {
		this.params = args.queryParams;

		this.queryParams = [];
		this.htmlParams = [];

		_.each( this.params, ( value, name ) => {
			this.queryParams.push( `${name}=${value}` );
			this.htmlParams.push( `${name}='${value}'` );
		} );

		this.model = new Backbone.Model( {
			url: this.getUrl(),
			shortcode: this.getShortcode(),
			html: this.getHTML(),
		} );
	},
	/**
	 * After Render Function
	 */
	afterRender: function () {
		if ( !! TVA.settings.checkout_page.value === false ) {
			this.$( '#tva-html-url-input, #tva-links-url-input, #tva-links-shortcode-input' ).parent().addClass( 'tva-disable-copy' );
		}
	},

	/**
	 * Returns the URL String
	 *
	 * @returns {string}
	 */
	getUrl: function () {
		return `${this.baseUrl}?${this.queryParams.join( '&' )}`;
	},
	/**
	 * Returns the ShortCode String
	 *
	 * @returns {string}
	 */
	getShortcode: function () {
		return `[tva_sendowl_buy ${this.htmlParams.join( ' ' )} title='Buy Now']`;
	},
	/**
	 * Returns the HTML Link
	 *
	 * @returns {string}
	 */
	getHTML: function () {
		return `<a href="${this.getUrl()}">Buy Now</a>`;
	}
} );
