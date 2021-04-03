( function ( $ ) {

	const base = require( './content-base' ),
		logsCollection = require( '../collections/logs' ),
		LogItem = require( './logs/item' ),
		SearchInputView = require( './filters/text-input' ),
		paginationView = require( './pagination' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'settings/logs' ),
		searchDefaultParams: {
			s: '',
			types: [],
		},
		initialize: function ( options ) {
			base.prototype.initialize.apply( this, arguments );

			this.collection = new logsCollection( TVA.logs.items, {total: TVA.logs.total} );
			this.types = TVA.logs.types;

			this.listenTo( this.collection, 'fetched', _.bind( this.renderData, this ) );
		},

		/**
		 * After Render Function
		 */
		afterRender: function () {
			this.$filters = this.$( '#tva-logs-filters' );
			this.$content = this.$( '#tva-logs-content' );
			this.$pagination = this.$( '.tva-pagination' );

			if ( Array.isArray( this.types ) && this.types.length > 0 ) {
				this.renderTypes();
			}

			this.renderSearch();
			this.renderData();
			this.renderPagination();
		},

		/**
		 * Renders the Log Types
		 */
		renderTypes: function () {
			this.$select = $( '<select multiple="multiple"></select>' );
			this.$clearSelect = $( `<span id="tva-clear-dropdown-filter" style="max-width:100px;" class="tva-customers-clear click" data-fn="clearDropdownFilter">${TVA.Utils.icon( 'cross' )} Clear Filters</span>` ).hide();

			this.$filters.append( this.$select );
			this.$filters.append( this.$clearSelect );

			this.types.forEach( type => {
				const $option = $( '<option/>' )
					.val( type.type )
					.text( type.type );

				this.$select.append( $option );
			} );

			this.$select.select2( {
				closeOnSelect: false,
				allowHtml: true,
				allowClear: true,
				tags: true,
			} ).on( 'select2:select select2:unselect', () => this._handleLogsFilterSelection() ).trigger( 'select2:select' )
			    .data( 'select2' ).$dropdown.addClass( 'tva-select2-with-checkboxes' );
		},

		/**
		 * Called from select2 events: select2:select, select2:unselect, change
		 *
		 * Triggers the logs ajax request to filter logs depending on the selected type
		 *
		 * @private
		 */
		_handleLogsFilterSelection: function () {
			const value = this.$select.val();

			let _text = `Filters ${TVA.Utils.icon( 'filter' )}`;

			this.$clearSelect.toggle( Array.isArray( value ) && value.length > 0 );

			if ( Array.isArray( value ) && value.length > 0 ) {
				_text = `${value.length} ${value.length === 1 ? 'Filter' : 'Filters'} Active ${TVA.Utils.icon( 'filter' )}`
			}

			this.$( '.select2-selection' ).html( _text );

			this.searchDefaultParams = {...this.searchDefaultParams, ...{types: value ? value : []}};

			this.collection.search( this.searchDefaultParams );
		},

		/**
		 * Called when use presses the Clear Filter button from the UI
		 *
		 * @param {Event} event
		 * @param {HTMLSpanElement} dom
		 */
		clearDropdownFilter: function ( event, dom ) {
			this.$select.val( '' ).trigger( 'select2:select' );
		},

		/**
		 * Renders the search view
		 */
		renderSearch: function () {
			const searchView = new SearchInputView( {placeholder: 'Search Logs...'} );

			this.$( '.tva-logs-search' ).append( searchView.render().$el );

			searchView.on( 'change', searchKey => {
				this.searchDefaultParams = {...this.searchDefaultParams, ...{s: searchKey}};

				this.collection.search( this.searchDefaultParams );
			} );
		},

		/**
		 * Renders the Log Data
		 */
		renderData: function () {
			this.$content.empty();

			this.collection.each( model => {
				this.$content.append( new LogItem( {
					model: model
				} ).render().$el );
			} );

			this.$( '.tvd-collection-header:not(.ttw-table-header), .tvd-collection-item:not(.ttw-table-header)' ).hide();
		},

		/**
		 * Renders the Pagination
		 */
		renderPagination: function () {
			( new paginationView( {
				el: this.$pagination,
				collection: this.collection,
				noItemTemplate: TVE_Dash.tpl( 'settings/logs-empty-list' )
			} ) ).render();
		},
	} );
} )( jQuery );
