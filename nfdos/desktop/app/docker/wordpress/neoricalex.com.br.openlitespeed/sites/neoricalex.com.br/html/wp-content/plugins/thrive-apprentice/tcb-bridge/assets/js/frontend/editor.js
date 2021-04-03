( function ( $, tveJq ) {

	if ( TCB_Front && TCB_Front.loginCallbacks ) {
		TCB_Front.loginCallbacks.redirect_to_ta_index = function ( config, response ) {
			if ( response.success && true === response.success ) {
				let url = response.tva_index_page_url;
				if ( config.urlParams && config.urlParams.length ) {
					url = TCB_Front.appendFormParamsToURL( url, config.urlParams );
				}
				TCB_Front.loginKeepLoader = true;

				if ( config[ 'login.show_success' ] || config[ 'show_success' ] ) {
					sessionStorage.setItem( 'tcb_toast_message', config.success_message );
				}

				document.location.href = url;
			}
		}
	}

	if ( TCB_Front ) {
		TCB_Front.course = require( './elements/course' );

		TCB_Front.course.init();
	}

} )( ThriveGlobal.$j, TVE_jQFn );
