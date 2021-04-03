( function ( $ ) {

	const customersCollection = require( './../collections/customers' );
	const CustomerModel = require( './../models/customer' );
	const dropdownFilterView = require( './filters/drop-down' );
	const textInputFilterView = require( './filters/text-input' );
	const paginationView = require( './pagination' );
	const AddCustomerModal = require( './modals/customer/add' );
	const EditCustomerModal = require( './modals/customer/access-items/base' );
	const ImportCustomerModal = require( './modals/customer/import' );
	const searchDropDownValuePrefix = '###';
	const ContentBase = require( './content-base' );
	const DropDownFilterListItems = Backbone.Collection.extend( {
		/**
		 * Returns the parsed dropdown filter list
		 *
		 * @param {String} prefix
		 *
		 * @returns Array
		 */
		getItems: function ( prefix = '' ) {
			const _return = [];

			prefix += searchDropDownValuePrefix;

			this.toJSON().forEach( listItem => {
				listItem.id = prefix + listItem.id;

				_return.push( listItem );
			} );

			return _return;
		}
	} );

	/**
	 * Backbone View which lists a collection of users
	 * and also filters the collection
	 */
	module.exports = ContentBase.extend( {
		/**
		 * @property {{jQuery}}
		 */
		$filters: null,
		/**
		 * @property {{jQuery}}
		 */
		$pagination: null,
		/**
		 * Input text view for search key
		 * @property {{Backbone.View}}
		 */
		searchFilterView: null,
		/**
		 * Underscore template for current view
		 */
		template: TVE_Dash.tpl( 'customers/list' ),
		/**
		 * Undersocre template for a single customer
		 */
		customerTemplate: TVE_Dash.tpl( 'customers/item' ),
		/**
		 * @property {string} css class element of this view takes
		 */
		className: 'tva-horizontal-list',
		/**
		 * Search Default Params
		 *
		 * @property {Object}
		 */
		searchDefaultParams: {
			bundle_id: 0,
			product_id: 0,
			course_id: 0,
			no_product: 0,
			s: ''
		},
		/**
		 * Contains the list of Courses protected with ThriveCart
		 *
		 * @property Array
		 */
		thriveCartCourses: [],
		/**
		 * - sets a customers collection
		 * - bind a reset event on collection to render the newly fetched customers
		 */
		initialize: function () {
			this.collection = new customersCollection( TVA.customers.items, {total: TVA.customers.total} );

			this.thriveCartCourses = TVA.courses.toArray().filter( item => {
				if ( item.get( 'status' ) !== 'publish' ) {
					return false;
				}

				return item.hasThriveCartIntegration();
			} );

			this.listenTo( this.collection, 'fetched', () => {
				this.renderCustomers();
				this.$customers.tvaToggleLoader();
			} );

			this.listenTo( this.collection, 'fetching', () => {
				this.$customers.tvaToggleLoader( 40 );
			} );
		},

		/**
		 * Overwrite the destroy method
		 *
		 * Resets all the view filters on destroy
		 */
		destroy: function () {
			ContentBase.prototype.destroy.apply( this, arguments );

			if ( this.collection.hasFilters() ) {
				this.collection.resetFilters().fetch();
			}
		},

		/**
		 * Renders:
		 * - filters
		 * - customers which were localized
		 * - pagination
		 * @return {{Backbone.View}}
		 */
		render: function () {
			this.$el.html( this.template() );
			this.$filters = this.$( '#tva-filters-wrapper' );
			this.$customers = this.$( '#tva-customers' );
			this.$pagination = this.$( '.tva-pagination' );

			this.renderDropdownFilter();

			//render search key filter
			this.searchFilterView = this.renderSearchFilter().on( 'change', searchKey => {

				const searchParams = {...this.searchDefaultParams, ...{s: searchKey}};

				if ( this.$( '#tva-dropdown-filter' ).length ) {
					const dropdownFilterValue = this.$( '#tva-dropdown-filter' ).val().split( searchDropDownValuePrefix );
					searchParams[ dropdownFilterValue[ 0 ] ] = dropdownFilterValue[ 1 ];
				}
				this.collection.search( searchParams );
			} );

			this.renderCustomers();

			this.renderPagination();

			return this;
		},
		/**
		 * Loop through collection and renders each item of collection
		 */
		renderCustomers: function () {
			this.$customers.empty();
			this.collection.each( item => {
				this.$customers.append( this.customerTemplate( {customer: item} ) );
			} );

			this.$pagination.toggleClass( 'tva-flex-start', this.collection.length === 0 )
		},
		/**
		 *
		 * @return {{Backbone.View}}
		 */
		renderSearchFilter: function () {
			const view = new textInputFilterView();
			this.$filters.append( view.render().$el );
			return view;
		},
		/**
		 * Callback when a user picks a filter from dropdown
		 * Launches the search functionality
		 *
		 * @param {Event} event
		 * @param {HTMLSelectElement} dom
		 */
		dropdownFilterChange: function ( event, dom ) {
			const value = dom.value.split( searchDropDownValuePrefix ),
				searchParams = {...this.searchDefaultParams, ...{s: this.searchFilterView.getValue()}};

			searchParams[ value[ 0 ] ] = value[ 1 ];

			this.collection.search( searchParams );
		},
		/**
		 * Renders the dropdown filter
		 */
		renderDropdownFilter: function () {
			let optionItems = [],
				selectPlaceholder = 'Search';

			if ( this.thriveCartCourses.length ) {
				optionItems = [ ...optionItems, ...[ {id: 'Courses_OptionGroup', name: 'Courses', option_group: 1} ], ...( new DropDownFilterListItems( this.thriveCartCourses ) ).getItems( 'course_id' ) ];
				selectPlaceholder += ' courses';
			}


			if ( TVA.sendowl.is_available ) {
				optionItems = [ ...optionItems, ...[ {id: 'Products_OptionGroup', name: 'SendOwl Products', option_group: 1} ], ...( new DropDownFilterListItems( TVA.sendowl.products ) ).getItems( 'product_id' ) ];
				optionItems = [ ...optionItems, ...[ {id: 'Bundles_OptionGroup', name: 'SendOwl Bundles', option_group: 1} ], ...( new DropDownFilterListItems( TVA.sendowl.bundles ) ).getItems( 'bundle_id' ) ];

				if ( this.thriveCartCourses.length ) {
					selectPlaceholder += ',';
				}

				selectPlaceholder += ' products or bundles';
			}

			if ( optionItems.length === 0 ) {
				return;
			}

			optionItems.unshift( {id: 'no_product###1', name: 'Customers with no access'} ); //Append at the head
			optionItems.unshift( {id: 0, name: 'All customers'} ); //Append at the head

			const $select = $( '<select id="tva-dropdown-filter" class="change" data-fn="dropdownFilterChange"><option></option></select>' );

			optionItems.forEach( item => {
				$select.append( item.option_group ? `<optgroup label="${item.name}"></optgroup>` : $( '<option/>' ).val( item.id ).text( item.name ) );
			} );

			$select.find( 'option[value="0"]' ).attr( 'selected', 'selected' );

			this.$filters.append( $select );

			$select.select2( {
				placeholder: 'Filter by product',
			} ).on( 'select2:open', () => {
				$( 'input.select2-search__field' ).prop( 'placeholder', selectPlaceholder );
			} ).data( 'select2' ).$dropdown.addClass( 'tva-customers-select' );
		},
		renderPagination: function () {
			const view = new paginationView( {
				el: this.$pagination,
				collection: this.collection,
				noItemTemplate: TVE_Dash.tpl( 'customers/empty-list' )
			} );
			view.render();
		},
		/**
		 * Opens the Add Customer Modal
		 */
		addCustomer: function () {
			this.openModal( AddCustomerModal, {
				model: new CustomerModel( {} ),
				collection: this.collection,
				width: '1180px',
				top: '40px',
				className: 'tvd-modal tvd-modal-big'
			} );
		},
		/**
		 * Opens the Edit Customer Modal
		 *
		 * @param {Event} event
		 * @param {Element} dom
		 */
		editCustomer: function ( event, dom ) {

			/**
			 * Opens the Edit Modal
			 *
			 * @param {Backbone.Model} m
			 */
			const openEditModal = ( m ) => {
					this.openModal( EditCustomerModal, {
						collection: this.collection,
						model: m,
						width: '1180px',
						top: '40px',
						className: 'tvd-modal tvd-modal-big tva-modal-edit-customer'
					} );
				},
				customerID = parseInt( dom.getAttribute( 'data-id' ) ),
				model = this.collection.findWhere( {ID: customerID} );

			TVE_Dash.showLoader();

			model
				.getPurchasedItems()
				.then( () => {
					model.getAccessCourses();
				} )
				.then( () => {
					TVE_Dash.hideLoader();
					openEditModal( model );
				} );
		},
		/**
		 * Opens the Import Customer Modal
		 */
		importCustomer: function () {
			this.openModal( ImportCustomerModal, {
				model: new CustomerModel( {} ),
				collection: this.collection,
				width: '1180px',
				top: '40px',
				className: 'tvd-modal tvd-modal-big'
			} );
		}
	} );
} )( jQuery );
