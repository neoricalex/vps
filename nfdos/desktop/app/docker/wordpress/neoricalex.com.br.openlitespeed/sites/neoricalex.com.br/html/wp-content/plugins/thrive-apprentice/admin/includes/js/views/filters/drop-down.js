( function ( $ ) {

	/**
	 * Backbone View which takes a collection and renders it as dropdown/select
	 * - triggers a change event each time an option has been selected
	 */
	module.exports = require( './../base' ).extend( {
		/**
		 * HTML tag name
		 */
		tagName: 'select',
		/**
		 * Events binded to current view
		 */
		events: {
			'change': 'onSelected',
		},
		/**
		 * Option selected by default
		 */
		selected: -1,
		/**
		 * Implement this in order to
		 * - prepare the collection into one that this view is familiar with
		 * @param args
		 */
		initialize: function ( args ) {
			args = {
				idField: 'id', //Name of the model field that's used as id
				labelField: 'label', //Name of the model field that's used as label
				className: 'tva-filter-dropdown', //element's CSS class
				defaultOption: '', // default option label
				selected: - 1, // default selected option
				...args
			};
			if ( args.collection ) {
				this.collection = new Backbone.Collection( prepareFilter( args.collection, {id: args.idField, label: args.labelField} ) );
				if ( args.defaultOption ) {
					this.setDefaultOption( args.defaultOption );
				}
			}
			this.$el.addClass( args.className );
			this.selected = args.selected;
		},
		/**
		 * Append the collection to select as options
		 * @return {{Backbone.View}}
		 */
		render: function () {
			let $options = $();

			this.collection.each( model => {
				$options = $options.add( $( `<option value="${model.get( 'id' )}">${model.get( 'label' )}</option>` ) );
			}, this );

			this.$el.append( $options ).val( String( this.selected ) );

			return this;
		},
		/**
		 * Adds first option
		 * - e.g.: "Select option"
		 * @param {string} option
		 */
		setDefaultOption: function ( option ) {
			this.collection.add( new Backbone.Model( {
				id: - 1,
				label: option
			} ), {at: 0} );
			return this;
		},
		selectOption: function ( options, trigger ) {
			const model = this.collection.findWhere( options );
			if ( ! ( model instanceof Backbone.Model ) ) {
				return;
			}
			this.$el.val( model.get( 'id' ) );
			if ( trigger ) {
				this.$el.trigger( 'change' );
			}
		},
		/**
		 * On select handler
		 * Triggers a change event with the proper selected model from the collection
		 * @param {Event} event
		 */
		onSelected( event ) {
			this.trigger( 'change', event.currentTarget.value );
		}
	} );

	/**
	 * Prepares a specific array of objects required for current view to print/display
	 *
	 * @param {Backbone.Collection|Array} items to be converted; different types need to be implemented
	 * @param {Object} [fields] field mapping options
	 *
	 * @return {[]}
	 */
	function prepareFilter( items, fields = {} ) {

		let prepared = [];

		const fieldMap = {
			id: 'id',
			label: 'label',
			...fields
		};

		/**
		 * Ensure items is always an array
		 */
		if ( items instanceof Backbone.Collection ) {
			items = items.toJSON();
		}

		items.forEach( function ( item ) {
			if ( item instanceof Backbone.Model ) {
				item = item.toJSON();
			}

			prepared.push( {
				id: item[ fieldMap.id ],
				label: item[ fieldMap.label ],
			} );
		} );

		return prepared;
	}
} )( jQuery );
