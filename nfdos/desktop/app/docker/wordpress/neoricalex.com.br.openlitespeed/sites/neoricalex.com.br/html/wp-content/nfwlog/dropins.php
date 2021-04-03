<?php // NinjaFirewall's dropins.php ~ Do not delete!
if (! defined( 'NFW_ENGINE_VERSION' ) ) { die( 'Forbidden' ); }
if (defined('WP_CLI') && WP_CLI ) { return; }
// ---------------------------------------------------------------------
if (! is_super_admin() ) {
	if ( isset( $_REQUEST['action'] ) ) {

		if ( $_REQUEST['action'] == 'uael_register_user' ) {
			if (! get_option( 'users_can_register' ) ) {
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1602 );
			}

		
		} elseif( $_REQUEST['action'] == 'do-import' && isset( $_FILES['images-file'] ) ) {
			if ( file_exists( WP_PLUGIN_DIR .'/business-directory-plugin/business-directory-plugin.php') ) {
				if (! function_exists('get_plugin_data') ) {
					require_once( ABSPATH .'wp-admin/includes/plugin.php');
				}
				$info = get_plugin_data( WP_PLUGIN_DIR .'/business-directory-plugin/business-directory-plugin.php');
				if (version_compare( $info['Version'], '5.11', '<') ) {
					nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1620 );
				}
			}

		} else {
			$nfw_act_hash = sha1( $_REQUEST['action'] );

			
			if ( $nfw_act_hash == '08567ba37e087eb08de4d2340192e07616a72d31' && isset( $_POST['id'] ) ) {
				$post = get_post( (int)$_POST['id'] );
				if (! empty( $post->post_password ) || $post->post_status != 'publish' ) {
					nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1608);
				}
			} elseif ( $nfw_act_hash == 'c96f029c026116ebcf31aa3305c1f3c31600dfbb' ) {
				if (! current_user_can('publish_pages') ) {
					nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1609);
				}
			} elseif( $nfw_act_hash == '0ee6ca2cf012a9e859864a718d70dde5ebb01ff5' ) {
				if (! empty( $_REQUEST['status'] ) && $_REQUEST['status'] === 'disable-cmp' && get_option('niteoCS_counter_date' ) > time() ) {
					nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1610);
				}

			
			} elseif ( $nfw_act_hash == 'ef3c9c3e067c025f6e539f568936aa567b223b67' && ! current_user_can( 'unfiltered_html' ) ) {
				if ( preg_match('/vc_raw_(?:html|js)|custom_onclick_code/', $_POST['content'] ) ) {
					nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1601 );
				}

			
			} elseif ( $nfw_act_hash == '705df8160caaf4780afcfe4766fc79a2bb2913cf' && isset( $_POST['id'] ) ) {
				if ( nfw_dropin_can_edit_post( $_POST['id'] ) == true ) {
					return;
				}
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1611 );
			} elseif ( $nfw_act_hash == '1971efe76e79111e707b9ce423755d835493f2a6' ) {
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1612 );

			
			} elseif ( $nfw_act_hash == 'cbc27dd814f7e063c409a23d4f2a064f86c7f529' ) {
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1613 );

			
			} elseif ( $nfw_act_hash == '4cc05bebd6ff9badaf8f848643e94d843d7b4753' ) {
				if (! empty( $_POST['user_id'] ) && $_POST['user_id'] == get_current_user_id() ) {
					return;
				}
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1614 );
			} elseif ( $nfw_act_hash == 'c9a7fe6b86319c989098ee9081e8ede929d1dd01' ) {
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1615 );

			
			} elseif ( in_array( $nfw_act_hash, array( '2e591ffb0ab8b4a7cce955434311cb47e2f6b8fb', 'b07a208381e3e697f9d88b08e1fc2577f2820354' ) ) ) {
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1616 );
			} elseif ( $nfw_act_hash == '1f4c109f7908c2071250c77c12b9a52a34f2e50e' ) { 
				if (! isset( $_REQUEST['file_id'] ) || nfw_dropin_can_edit_post( $_REQUEST['file_id'] ) == false ) {
					nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1617 );
				}

			
			} elseif ( $nfw_act_hash == 'f6d125f4e6675177fcbec29917f2dea8ace619b9' ) { 
				$file_ext = pathinfo($_REQUEST['output']['imports'][0], PATHINFO_EXTENSION);
				if (!in_array($file_ext, array('less', 'css'))) {
					nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1618 );
				}

			
			} elseif ( in_array( $nfw_act_hash, array( 'c624721f01abd07ba2f23b7ad1354dac2ccbc79b', '517c946d6c1fc82c1b9c0c7031ef808d44c10105', '1cc1ec2a79e7048243dea88b63f5ca6fe48a25fb', '3822557d438a7d2ed33f291d1fff0ea4ad361082', 'ac1c1dba453b82d419f1cf5594167b070f2979e5', 'e2e82b67dd8f173c1323cb99387589c283b50a16', 'ba4a6c8a523b07dcd8ef6cbf70bdafdb27f74fef', '13756ee6e67ce9df76d4db663ac7e2936bfc2885', '1bf9360c52e636980b90064be9a149c01164e853', 'edb7480cc53c68c1d267c8a8a3b2c4b4ba0a9800', '2cff039018bff37b9a830c65b326a7e4b81f0795', 'dfd1387df8abfddb6f5089ad2ba06aa74e192a2c' ) ) && ! current_user_can('publish_posts')  ) {
				nfw_dropin_block( "REQUEST:action = {$_REQUEST['action']}", 3, 1619);
			}
		}
	} 

	
	if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] == 'POST' ) {
		if ( preg_match( '`1/api/ulisting-user/(?:deletelisting|draft_or_delete)`', @urldecode( $_SERVER['REQUEST_URI'] ) ) ) {
			$rb = file_get_contents('php://input');
			if ( $rb = json_decode($rb, true) ) {
				if (! empty( $rb['user_id'] ) && $rb['user_id'] == get_current_user_id() ) {
					if ( nfw_dropin_can_edit_post( $rb['listing_id'] ) == true ) {
						return;
					}
				}
			}
			nfw_dropin_block( "REQUEST_URI = {$_SERVER['REQUEST_URI']}", 3, 1603 );
		}
	}

} 

// 2020-09-01 http://blog.nintechnet.com/critical-zero-day-vulnerability-fixed-in-wordpress-file-manager-700000-installations/
if ( is_dir( WP_PLUGIN_DIR .'/wp-file-manager') ) {
	if ( file_exists( WP_PLUGIN_DIR .'/wp-file-manager/lib/php/connector.minimal.php' ) ) {
		@unlink( WP_PLUGIN_DIR .'/wp-file-manager/lib/php/connector.minimal.php' );
		$glob = glob( WP_PLUGIN_DIR .'/wp-file-manager/lib/files/*.php' );
		if ( is_array( $glob ) ) {
			foreach( $glob as $file ) {
				if ( is_writable( $file ) ) {
					@unlink( $file );
				}
			}
		}
	}
}
// 2020-12-07 https://blog.nintechnet.com/wordpress-easy-wp-smtp-plugin-fixed-zero-day-vulnerability/
if ( is_dir( WP_PLUGIN_DIR .'/easy-wp-smtp') ) {
	if (! file_exists( WP_PLUGIN_DIR .'/easy-wp-smtp/index.html' ) &&
		is_writable( WP_PLUGIN_DIR .'/easy-wp-smtp' ) ) {
		touch( WP_PLUGIN_DIR .'/easy-wp-smtp/index.html' );
	}
}

// ---------------------------------------------------------------------
function nfw_dropin_block( $message, $level, $rule ) {
	nfw_log2('WP vulnerability', $message, $level, $rule);
	exit("Error: please contact the administrator.");
}
// ---------------------------------------------------------------------
function nfw_dropin_can_edit_post( $postid ) {
	$type = get_post_type( (int) $postid );
	if ( ( $type == 'page' || $type == 'post' ) && ! current_user_can( "edit_{$type}", $postid ) ) {
		return false;
	}
	return true;
}
// ---------------------------------------------------------------------
function nfw_dropin_can_delete_post( $postid ) {
	$type = get_post_type( (int) $postid );
	if ( ( $type == 'page' || $type == 'post' ) && ! current_user_can( "delete_{$type}", $postid ) ) {
		return false;
	}
	return true;
}
// ---------------------------------------------------------------------
