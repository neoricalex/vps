(function( $ ) {
	'use strict';

	/**
	 * All of the code for your public-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */

    var idUser = smartarget_params.smartarget_user_id;

    window.onload =  function ()
    {
        init();
    };

    function init ()
    {
        if (!idUser)
        {
            return;
        }

        fetch('https://api.smartarget.online/app/version').then(function (response)
        {
            try
            {
                if (!response.ok)
                {
                    return;
                }

                response.json().then(data =>
                {
                    if (!data.success)
                    {
                        throw new Error(data.message);
                    }

                    let version = data.data;
                    insertCss(version);
                    insertJs(version, idUser);
                });
            }
            catch (e)
            {
                console.log(e);
            }
        });
    }

    function insertJs (version, idUser)
    {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = `https://smartarget.online/main.js?ver=${version}&u=${idUser}`;
        document.head.appendChild(script);
    }

    function insertCss (version)
    {
        var styleSheet = document.createElement("link");
        styleSheet.rel = "stylesheet";
        styleSheet.href = `https://smartarget.online/main.css?ver=${version}`;
        document.head.appendChild(styleSheet);
    }


})( jQuery );
