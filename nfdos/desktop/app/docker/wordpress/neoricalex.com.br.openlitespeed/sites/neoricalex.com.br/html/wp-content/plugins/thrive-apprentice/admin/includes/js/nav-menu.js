( function ( $ ) {

	$( document ).on( 'menu-item-added', ( e, element ) => {
		handle_tva_menu_item_frontend( element );
	} );

	/**
	 * Hides the url field in case of legacy themes
	 *
	 * @param element
	 */
	function handle_tva_menu_item_frontend( element ) {
		let type = $( element ).find( '.edit-menu-item-classes' ).val(),
			urlField = $( element ).find( '.field-url' );
		type = type ? type.split( ' ' ) : type;

		if ( type && type[ 0 ] === 'tva-menu-item' ) {
			switch ( type[ 1 ] ) {
				case 'logout' :
					urlField.toggleClass( 'hidden-field', true );
					break;
				default :
					handle_link_availability( element.find( '.tva-link-to' ) );
					element.find( '.tva-link-to' ).on( 'change', ( e ) => {
						handle_link_availability( e.target );
					} );
					break;
			}
		}
	}

	/**
	 * Checks if requested link is available or not
	 * If it is not then it displays an error label under the dropdown
	 *
	 * @param el
	 */
	function handle_link_availability( el ) {

		let selected = $( el ).find( ':selected' ).val();
		let menuItemSetting = $( el ).closest( '.menu-item-settings' );
		let type = menuItemSetting.find( '.edit-menu-item-classes' ).val();

		if ( selected && type ) {
			type = type.split( ' ' )[ 1 ];
			/**
			 * If the link is the home url then it means that the requested link is unavailable
			 */
			if ( links[ 'home_url' ] === links[ 0 ][ type ][ selected ] ) {

				menuItemSetting.find( '.notice-error' ).toggleClass( 'hidden-field', false );

				if ( selected === 'page' ) {
					menuItemSetting.find( '.notice-error p' ).html( 'Please note that you have not yet set an Apprentice login-register page, you can set it from <a href="' + links[ 'home_url' ]
					                                                + '/wp-admin/admin.php?page=thrive_apprentice#settings/login-page"> here </a>' );
				} else {
					menuItemSetting.find( '.notice-error p' ).html( 'This link is unavailable' );
				}
			} else {

				menuItemSetting.find( '.notice-error' ).toggleClass( 'hidden-field', true );
				menuItemSetting.find( '.notice-error p' ).html( '' );
			}

			menuItemSetting.find( '.field-url' ).toggleClass( 'hidden-field', ! ( selected === 'custom' ) );

			if ( selected === 'custom' && links[ 'legacy_theme' ] ) {
				const menuItemSettingHeight = menuItemSetting.outerHeight();

				menuItemSetting.find( '.field-url' ).insertAfter( $( el ).closest( '.link-to' ) );
				menuItemSetting.outerHeight( menuItemSettingHeight > 315 ? menuItemSettingHeight : 315 );
			}
		}
	}

	/**
	 * Adds an apprentice item to the menu
	 *
	 * @param e
	 * @param i
	 */
	function add_item_to_menu_bottom( e, i = 0 ) {
		const selectAreaMatch = $( '#ta-link-checklist' );
		const nrOfItemsSelected = selectAreaMatch.find( '.menu-item-title input:checked' ).length;
		const itemsSelected = selectAreaMatch.find( '.menu-item-title input:checked' );

		if ( nrOfItemsSelected ) {
			const link = $( itemsSelected[ i ] ).attr( 'data-link' ),
				name = $( itemsSelected[ i ] ).parent().text().trim(),
				slug = $( itemsSelected[ i ] ).attr( 'data-slug' ),
				currMenuItem = $( itemsSelected[ i ] );

			let classes = `tva-menu-item ${slug}`;

			const params = {
				'-1': {
					'menu-item-type': 'custom',
					'menu-item-url': link,
					'menu-item-title': name,
					'menu-item-classes': classes
				}
			};

			wpNavMenu.addItemToMenu( params, wpNavMenu.addMenuItemToBottom, function ( e ) {
				currMenuItem.removeAttr( 'checked' );
				add_item_to_menu_bottom( i + 1 )
			} );
		} else {
			return;
		}
	}

	$( function () {

			/**
			 * for current user the box might be hidden
			 * - if so we make it visible
			 * @see wp_ajax_closed_postboxes() php function
			 */
			if ( $( '#tva_account_links' ).is( ':hidden' ) ) {
				$( '#tva_account_links-hide' ).click();
			}

			/**
			 * Handle Apprentice menu items added
			 */
			$( '#submit-ta-links' ).on( 'click', ( e ) => {
				add_item_to_menu_bottom( e, 0 )
			} );

			/**
			 * Displays error labels if the links from the selected menu items are unavailable
			 */
			$( '.tva-link-to' ).on( 'change', ( e ) => {
				handle_link_availability( e.target );
			} );

			/**
			 * After page load displays error labels if the links from the menu items are unavailable
			 * Also hide the url field if necessary
			 */
			$( '.field-url' ).each( function ( index, element ) {
				let menuItemSettings = $( element ).closest( '.menu-item-settings' ),
					menuItemClasses = menuItemSettings.find( '.edit-menu-item-classes' ).val();

				menuItemClasses = menuItemClasses ? menuItemClasses.split( ' ' ) : menuItemClasses;

				if ( menuItemClasses && menuItemClasses[ 0 ] === 'tva-menu-item' ) {
					handle_tva_menu_item_frontend( menuItemSettings );
				}
			} );
		}
	);
} )
( jQuery );
