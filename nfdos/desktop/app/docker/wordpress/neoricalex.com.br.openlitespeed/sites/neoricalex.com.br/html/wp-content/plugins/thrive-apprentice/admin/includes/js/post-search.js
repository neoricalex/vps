( function ( $ ) {
	/**
	 * ajax-suggest post search for an input
	 * if fetch_single is passed and it's not empty, it will also fetch the selected post from the server and populate the input with it
	 *
	 * @param {object} $input jquery wrapper over the autocomplete input
	 * @param {object} options map of autocomplete options to control jquery ui autocomplete
	 * @constructor
	 */
	module.exports = function ( $input, options ) {
		options = options || {};
		options.no_value_callback = options.no_value_callback || jQuery.noop;
		options.change_callback = options.change_callback || jQuery.noop;

		function matches() {
			let regex;

			if ( ! ( regex = $input.data( 'allow-regex' ) ) ) {
				return false;
			}

			return $input.val().match( new RegExp( regex ) );
		}

		const defaults = {
			appendTo: $input.parent(),
			minLength: 2,
			delay: 200,
			change: function ( event, ui ) {
				if ( ! ui.item && ! $input.data( 'value-filled' ) && ! matches() ) {
					$input.val( '' );
					options.no_value_callback.apply( $input, arguments );
				}
				$input.data( 'value-filled', null );

				if ( matches() ) {
					options.change_callback.apply( $input, arguments );
				}
			}
		};

		options = $.extend( true, defaults, options );

		if ( ! options.source ) {
			options.source = options.url;
		}

		$.ajaxSetup( {
			headers: {'X-WP-Nonce': TVA.apiSettings.nonce}
		} );

		function renderItem( ul, item ) {
			let _class = '';
			if ( options.collection && options.collection.length ) {
				const model = options.collection.findWhere( {id: item.id} );
				if ( model ) {
					_class = 'tva-selected-post';
				}
			}

			return $( `<li class="${_class}">` ).append( `<span class="tva-ps-result-title">${item.label}</span><span class="tva-ps-result-email">(${item.type})</span>` ).appendTo( ul );
		}

		$input.autocomplete( options ).data( "ui-autocomplete" )._renderItem = options.renderItem || renderItem();

		$input.on( 'blur', function () {
			if ( ! $.trim( this.value ).length ) {
				options.no_value_callback.apply( $input, arguments );
			}
		} );

		if ( options.fetch_single && typeof options.fetch_single === 'number' ) {
			$input.addClass( 'ui-autocomplete-loading' );
			$.ajax( {
				url: ThriveApp.router.courses,
				data: {
					id: options.fetch_single
				},
				success: function ( result ) {
					$input.data( 'value-filled', 1 ).val( result.title ).removeClass( 'ui-autocomplete-loading' ).next( 'label' ).addClass( 'tvd-active' );
				}
			} );
		}

		if ( options.fetch_single && typeof options.fetch_single === 'string' ) {
			$input.data( 'value-filled', 1 ).val( options.fetch_single ).next( 'label' ).addClass( 'tvd-active' );
		}
	};
} )( jQuery );
