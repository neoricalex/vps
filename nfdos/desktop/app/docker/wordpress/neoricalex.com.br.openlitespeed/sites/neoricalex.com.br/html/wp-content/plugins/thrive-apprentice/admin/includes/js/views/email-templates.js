( function ( $ ) {
	const templateForm = require( './email-templates/item' ),
		emailTemplatesCollection = require( '../collections/email-templates' );

	module.exports = require( './content-base' ).extend( {
		template: TVE_Dash.tpl( 'settings/email-templates' ),
		initialize: function () {
			this.collection = new emailTemplatesCollection( Object.values( TVA.emailTemplates ) );
		},
		/**
		 * Render function for this view
		 *
		 * @returns {*}
		 */
		render: function () {
			this.$el.html( this.template() );

			this.afterRender();

			return this;
		},
		/**
		 * After render function
		 */
		afterRender: function () {
			this.$select = this.$( '#email-template' );
			this.$formWrapper = this.$( '#tva-email-template-form-wrapper' );

			this.collection.each( template => {
				this.$select.append(
					$( '<option/>' )
						.text( template.get( 'name' ) )
						.val( template.get( 'slug' ) )
				);
			} );
		},
		/**
		 * Gets called when the user changes the email template
		 *
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 */
		renderEmailTemplate: function ( event, dom ) {
			const tplSlug = dom.value;

			if ( tplSlug.length === 0 ) {
				this.$formWrapper.empty();
				return;
			}

			this.$formWrapper.html( new templateForm( {
				model: this.collection.findWhere( {
					slug: tplSlug
				} )
			} ).render().$el );
		}
	} );
} )( jQuery );
