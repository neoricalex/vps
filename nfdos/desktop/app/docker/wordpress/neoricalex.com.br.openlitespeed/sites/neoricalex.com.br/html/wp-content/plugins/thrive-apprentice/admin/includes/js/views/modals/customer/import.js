( function ( $ ) {

	const base = require( './base' );

	module.exports = base.extend( {
		template: TVE_Dash.tpl( 'modals/import-customer' ),
		codeMirrorEditor: null,
		uploader: null,
		customerList: [],
		customersPerRequest: 100,
		/**
		 * Called after the system shows step 2
		 */
		afterStep2Loaded: function () {
			this.codeMirrorEditor.refresh();
			this.codeMirrorEditor.setCursor( this.codeMirrorEditor.lineCount(), 0 );// Set the cursor at the end of existing content
			this.codeMirrorEditor.focus();

			return this;
		},
		/**
		 * Called after step 3 is shown
		 */
		afterStep3Loaded: function () {

			this.$( 'tbody' ).empty();
			this.$( '#tva-csv-customer-stats' ).empty();

			let totalCustomers = 0,
				errorsCustomers = 0;

			this.customerList.forEach( customer => {

				const $row = $( '<tr>' );

				if ( parseInt( customer.is_valid ) === 0 ) {
					$row.addClass( 'tva-customers-list-error' );
					errorsCustomers ++;
				}

				$row.append( $( '<td>' ).html( customer.buyer_name ) );
				$row.append( $( '<td>' ).html( customer.buyer_email + ( $row.hasClass( 'tva-customers-list-error' ) ? '<span style="color: #FF0000; float: right;">Invalid entry</span>' : '' ) ) );

				this.$( 'tbody' ).append( $row );
				totalCustomers ++;
			} );

			this.$( '#tva-csv-customer-stats' ).append( `<span>${TVA.Utils._n( totalCustomers, 'customer', 'customers', true )}</span>` );
			if ( errorsCustomers ) {
				this.$( '#tva-csv-customer-stats' ).append( `&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #FF0000;">${errorsCustomers} Invalid entries</span>` );
			}

			const $coursesList = this.$( '#tva-add-customer-courses-list' ).empty();
			TVA.courses.each( ( course ) => $coursesList.append( this.courseItemTpl( {model: course} ) ) );

			return this;
		},

		/**
		 * Validation before the system shows a particular step
		 *
		 * @param {string} step
		 *
		 * @returns {boolean}
		 */
		allowJumpToStep: function ( step ) {

			if ( step === 3 ) {
				if ( this.currentStep === 2 && this.codeMirrorEditor.getValue().length === 0 ) {
					TVE_Dash.err( TVA.t.MissingCustomers );
					return false;
				}

				if ( this.currentStep === 1 && this.uploader.files.length === 0 ) {
					TVE_Dash.err( TVA.t.ChooseCsv );
					return false;
				}
			}

			return true;
		},

		/**
		 * Called after the modal is opened
		 */
		dom: function () {
			/**
			 * Call the parent method
			 */
			base.prototype.dom.apply( this, arguments );

			this.codeMirrorEditor = this._configureCodeEditor();
			this.uploader = this._configurePlupload();
		},

		/**
		 * Configure CodeMirror Editor
		 *
		 * @returns {Object}
		 *
		 * @private
		 */
		_configureCodeEditor: function () {
			let editorSettings = wp.codeEditor.defaultSettings ? _.clone( wp.codeEditor.defaultSettings ) : {},
				editor;
			editorSettings.codemirror = _.extend(
				{},
				editorSettings.codemirror,
				{
					lineNumbers: true,
					mode: 'text',
					indentUnit: 2,
					tabSize: 2,
					lineWrapping: true,
					scrollbarStyle: null //Disable Scrollbar for CodeMirror Editor
				}
			);

			editor = wp.codeEditor.initialize( this.$( '#tva-list-import' ), editorSettings );
			editor.codemirror.setSize( '100%', '250px' );

			/**
			 * On Code Mirror Change, parse the Customer List Array
			 *
			 * @param {}
			 */
			editor.codemirror.on( 'change', ( codeMirrorInstance, changedObj ) => {
				const lines = codeMirrorInstance.getValue().split( /\r\n|\n/ ),
					customerList = [];

				lines.forEach( line => {
					const _aux = line.split( ',' ),
						_name = _aux[ 0 ].trim();

					if ( _name.length ) {

						const _buyer_email = _aux[ 1 ] ? _aux[ 1 ].trim() : '';

						customerList.push( {
							buyer_name: _aux[ 0 ].trim(),
							buyer_email: _buyer_email,
							is_valid: Number( _buyer_email && TVA.Utils.isEmail( _buyer_email ) )
						} );
					}
				} );

				this.customerList = customerList;
			} );

			return editor.codemirror;
		},
		/**
		 * Configures the plupload
		 *
		 * @returns {plupload.Uploader}
		 *
		 * @private
		 */
		_configurePlupload: function () {
			const $box = this.$( '.tva-drop-file-elem' ),
				$browseButton = this.$( '.tva-file-upload-trigger' ),
				$continueButton = this.$( '.tva-modal-step[data-step="1"] .tva-modal-btn-green' ),
				uploader = new plupload.Uploader( {
					headers: {
						'X-WP-Nonce': TVA.apiSettings.nonce
					},
					runtimes: 'html5,html4',
					dragdrop: true,
					multi_selection: false,
					drop_element: $box[ 0 ],
					browse_button: $browseButton[ 0 ],
					container: $box[ 0 ],
					url: `${TVA.routes.customer}/upload_file`,
					multipart: true, // Return JSON String
					filters: {
						max_files: 1,
						max_file_size: '1mb',
						mime_types: [
							{title: 'Custom', extensions: 'csv'},
						]
					},
					init: {
						FilesAdded: ( uploader, files ) => {
							const file = files[ 0 ];

							this.$( '#tva-file-name' ).html( file.name );

							$continueButton.addClass( 'disabled' );

							uploader.start();
						},
						Error: ( uploader, error ) => {
							let errorMessage = error.message;

							if ( error.response ) {
								try {
									const err = JSON.parse( error.response );
									if ( err.message ) {
										errorMessage = err.message;
									}
								} catch ( e ) {
								}
							}
							TVE_Dash.err( errorMessage );

							$continueButton.removeClass( 'disabled' );
						},
						FileUploaded: ( uploader, file, result ) => {
							const responseData = JSON.parse( result.response );

							if ( Array.isArray( responseData ) ) {

								const temp = [];

								responseData.forEach( data => {
									temp.push( {
										buyer_name: data.buyer_name,
										buyer_email: data.buyer_email,
										is_valid: data.is_valid
									} );
								} );

								this.customerList = temp;
							}

							$continueButton.removeClass( 'disabled' );
						}
					}
				} );

			uploader.init();

			return uploader;
		},
		/**
		 * Triggered when saving a customer list
		 *
		 * Makes a request to the server storing the saved data
		 */
		save: function () {
			const customersFiltered = this.customerList.filter( customer => parseInt( customer.is_valid ) === 1 );

			if ( customersFiltered.length === 0 ) {
				TVE_Dash.err( 'There are a few issues. Please correct them before saving' );
				return;
			}

			if ( this.courses.length === 0 ) {
				return TVE_Dash.err( TVA.t.selectCourse );
			}

			this.model.set( 'services', {'course_ids': this.courses} );

			TVE_Dash.showLoader();

			this.importCustomersAjax()
		},

		/**
		 * Ajax for importing customers
		 *
		 * Calls itself in batches
		 */
		importCustomersAjax: function () {
			const temp = this.customerList.slice( 0, this.customersPerRequest );

			$.ajax( {
				url: `${TVA.routes.customer}/import_customers`,
				type: 'POST',
				data: {
					customers: temp,
					services: this.model.get( 'services' ),
					notify: this.model.get( 'notify' ),
				},
				beforeSend: function ( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', TVA.apiSettings.nonce );
				}
			} ).success( response => {
				this.customerList = this.customerList.slice( this.customersPerRequest, this.customerList.length );

				if ( this.customerList.length ) {
					this.importCustomersAjax()
				} else {
					this.close();
					TVE_Dash.hideLoader();

					TVE_Dash.success( response.message );
					this.collection.fetch();
					this.collection.each( customerModel => {
						customerModel.removeServices();
						customerModel.set( 'purchasedItems', null );
					} );
				}
			} ).error( response => {
				TVE_Dash.err( response.responseJSON.message );

				TVE_Dash.hideLoader();
				this.close();
			} );
		}
	} );
} )( jQuery );
