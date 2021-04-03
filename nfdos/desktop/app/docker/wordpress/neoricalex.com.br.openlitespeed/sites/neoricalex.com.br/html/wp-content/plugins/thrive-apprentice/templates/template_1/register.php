<?php
/**
 * Thrive Themes - https://thrivethemes.com
 *
 * @package thrive-apprentice
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Silence is golden
}

do_action( 'tva_register' );
?>

<?php include_once( TVA_Const::plugin_path( 'templates/header.php' ) ) ?>

<?php
do_action( 'register_form' );
?>

<?php include_once( TVA_Const::plugin_path( 'templates/footer.php' ) ) ?>
