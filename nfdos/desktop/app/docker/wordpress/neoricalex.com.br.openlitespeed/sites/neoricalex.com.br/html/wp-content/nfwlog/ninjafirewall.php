<?php
// ===============================================================//
// NinjaFirewall's loader.                                        //
// DO NOT alter or remove it as long as NinjaFirewall is running! //
// ===============================================================//
if ( file_exists('/usr/share/nginx/html/wp-content/plugins/ninjafirewall/lib/firewall.php') ) {
	@include_once '/usr/share/nginx/html/wp-content/plugins/ninjafirewall/lib/firewall.php';
}
// EOF
