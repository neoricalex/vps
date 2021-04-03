( function ( $ ) {

	const ConfirmView = require( './../../../confirm-action' );

	module.exports = require( '../../base' ).extend( {
		/**
		 * @property underscore template
		 */
		template: TVE_Dash.tpl( 'modals/customer/edit' ),
		/**
		 * @property {Array} of course IDs checked by admin to give access to a customer
		 */
		selectedCourses: [],
		/**
		 * Renders purchased items
		 * - set on HTML
		 */
		afterStep0Loaded: function () {
			this.model.getPurchasedItems().then( ( items ) => {
				this.renderPurchasedItems( items );
			} );
		},
		/**
		 * Renders courses
		 * - set on HTML
		 */
		afterStep1Loaded: function () {
			this.selectedCourses = [];
			this.$( '#tva-customer-courses' ).html( `<label>${TVA.t.loading}</label>` );
			this.model.getAccessCourses()
			    .then( () => {
				    this.renderCourses();
			    } );
		},
		/**
		 *
		 * @return {*}
		 */
		save: function () {

			if ( this.selectedCourses.length === 0 ) {
				return TVE_Dash.err( TVA.t.noItemSelected );
			}

			TVE_Dash.showLoader();
			wp.apiRequest( {
				url: `${this.model.url()}/add-access`,
				type: 'POST',
				data: {
					course_ids: this.selectedCourses
				}
			} ).done( ( response ) => {
				TVE_Dash.hideLoader();
				TVE_Dash.success( TVA.t.newAccessSaved );
				this.close();
				this.model.set( 'courses', new Backbone.Collection( response ) );
				this.model.set( 'purchasedItems', null ); //forces fetching purchasedItems
			} );
		},
		/**
		 * Push/Pop course id from selected courses
		 * @param event
		 * @param dom
		 */
		toggleCourse: function ( event, dom ) {
			const id = parseInt( dom.dataset.id );
			if ( ! id || isNaN( id ) ) {
				return;
			}
			const index = this.selectedCourses.indexOf( id );
			if ( index === - 1 ) {
				this.selectedCourses.push( id );
			} else {
				this.selectedCourses.splice( index, 1 );
			}
		},
		/**
		 * Renders all courses and check those which the current customer has access to
		 */
		renderCourses: function () {

			const $wrapper = this.$( '#tva-customer-courses' ).empty();

			TVA.courses.each( ( item ) => {
				const $item = $( `<label><span>${item.get( 'name' )}</span></label>` );
				const $checkbox = $( `<input type="checkbox" class="click" data-fn="toggleCourse" data-id="${item.get( 'id' )}">` );
				//check if item exists in the list of courses the customer has access to
				const exists = this.model.get( 'courses' ).findWhere( {id: item.get( 'id' )} ) instanceof Backbone.Model;
				$checkbox.prop( {
					checked: exists,
					disabled: exists
				} );
				$wrapper.append( $item.prepend( $checkbox ) );
			} );
		},
		/**
		 * Puts in view the order items purchased by current customer
		 * @param collection
		 */
		renderPurchasedItems: function ( collection ) {

			const tpl = TVE_Dash.tpl( 'customers/access-item' );
			const $addButton = this.getCurrentStep().find( '#tva-add-access-item' );
			const $wrapper = this.getCurrentStep().find( '#tva-customer-items-wrapper' );
			const $itemsList = $wrapper.find( '#tva-customer-items-list' ).empty();
			const $userAccessText = this.getCurrentStep().find( '#tva-user-access-text' );

			if ( collection.length === 0 ) {
				$addButton.toggle( false );
				$wrapper.html( TVE_Dash.tpl( 'customers/no-access-item' )( {model: this.model} ) );
				$userAccessText.remove();
			} else if ( TVA.courses.length === 0 ) {
				$addButton.toggle( false );
				$wrapper.html( TVE_Dash.tpl( 'customers/no-course' )() );
			} else {
				collection.each( ( item ) => $itemsList.append( tpl( {model: item} ) ) );
				$addButton.toggle( true );
			}
		},
		/**
		 * Handles delete confirmation
		 * - does DELETE request to server
		 * - renders list of purchased items
		 * @param {Event} event
		 */
		deleteAccessItem: function ( event ) {

			const $wrapper = $( event.currentTarget ).parent();
			const id = parseInt( event.currentTarget.dataset.id );
			const itemModel = this.model.get( 'purchasedItems' ).findWhere( {id: id} );

			const confirmView = new ConfirmView( {
				template: TVE_Dash.tpl( 'customers/delete-purchased-item' ),
				className: 'tva-delete-simple',
				confirm: () => {
					itemModel.url = `${this.model.url()}/disable-item/${id}`;
					confirmView.$el.html( TVA.t.deleting );
					this.model.set( 'courses', null );
					deleteOrderItem( itemModel )
						.then( () => {
							this.renderPurchasedItems( this.model.get( 'purchasedItems' ) );
						} );
				}
			} ).render();

			$wrapper.append( confirmView.$el );
		}
	} );

	/**
	 * Deletes from server a purchased order item
	 * @param {Backbone.Model} model
	 * @return {Promise<unknown>}
	 */
	function deleteOrderItem( model ) {

		return new Promise( ( resolve, reject ) => {

			if ( ! ( model instanceof Backbone.Model ) ) {
				return reject( model );
			}

			model.destroy( {
				beforeSend: function ( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', wpApiSettings.nonce );
				},
				success: ( deletedModel ) => {
					resolve( deletedModel );
				},
				error: () => reject( model )
			} );
		} );
	}
} )( jQuery );
